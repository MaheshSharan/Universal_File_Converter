// server/index.js (Improved)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Redis = require('redis');
const RedisStore = require('connect-redis').default;
const DriveService = require('./services/driveService');
const { setCredentials, getAuthClient, oauth2Client } = require('./config/googleAuth');
const authRoutes = require('./routes/auth');
const driveRoutes = require('./routes/drive');
const convertRoutes = require('./routes/convert');
const { scheduleCleanup } = require('./utils/cleanup');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Redis client setup
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'temp-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Content-Range'],
  exposedHeaders: ['Content-Range', 'Content-Length', 'Content-Disposition'],
}));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(cookieParser());
app.use(express.json());

// Mount auth routes
app.use('/auth', authRoutes);

// Auth middleware
const checkAuth = async (req, res, next) => {
  console.log('[AUTH] Checking authentication...');
  if (!req.session || !req.session.tokens) {
    console.log('[AUTH] No session or tokens found');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const tokens = req.session.tokens;
    console.log(`[AUTH] User ${req.session.user?.email || 'unknown'} attempting access`);
    
    oauth2Client.setCredentials(tokens);
    req.auth = oauth2Client;
    
    console.log('[AUTH] Authentication successful');
    next();
  } catch (error) {
    console.error('[AUTH] Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected routes
app.use('/api/drive', checkAuth, driveRoutes);
app.use('/api/convert', checkAuth, convertRoutes);

// Mount drive routes without /api prefix
app.use('/drive', checkAuth, driveRoutes);

// Handle file upload to Google Drive
app.post('/api/upload', checkAuth, async (req, res) => {
  try {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const fileBuffer = Buffer.concat(chunks);
      const file = await req.auth.driveService.uploadFile(
        fileBuffer,
        req.headers['file-name'],
        req.headers['content-type']
      );
      res.json({ fileId: file.id });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Create temp directory and schedule cleanup
async function createDirectories() {
  try {
    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    console.log('[SETUP] Temporary directory created:', tempDir);
    
    // Schedule cleanup of temporary files
    scheduleCleanup(tempDir);
  } catch (error) {
    console.error('[SETUP] Error creating directories:', error);
  }
}
createDirectories();

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('startConversion', async (data) => {
    try {
      const { fileId, outputFormat, authTokens } = data;
      
      // Set up Drive service
      const auth = setCredentials(JSON.parse(authTokens));
      const driveService = new DriveService(auth);
      
      // Download file from Drive
      const fileBuffer = await driveService.downloadFile(fileId);
      
      // Convert the file
      const convertedBuffer = await convertBuffer(fileBuffer, outputFormat, (progress) => {
        socket.emit('conversionProgress', progress);
      });
      
      // Update the file in Drive
      const updatedFile = await driveService.updateFile(
        fileId,
        convertedBuffer,
        getMimeType(outputFormat)
      );
      
      socket.emit('conversionComplete', {
        fileId: updatedFile.id,
        webViewLink: updatedFile.webViewLink
      });
    } catch (error) {
      socket.emit('conversionError', { message: error.message });
    }
  });
});

async function convertBuffer(buffer, outputFormat, progressCallback) {
  const format = outputFormat.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format)) {
    return await convertImage(buffer, format, progressCallback);
  } else if (['mp4', 'avi', 'mkv', 'webm'].includes(format)) {
    return await convertVideo(buffer, format, progressCallback);
  } else if (['mp3', 'wav', 'flac', 'aac'].includes(format)) {
    return await convertAudio(buffer, format, progressCallback);
  } else if (['pdf', 'docx', 'txt'].includes(format)) {
    return await convertDocument(buffer, format, progressCallback);
  } else {
    throw new Error('Unsupported format');
  }
}

async function convertImage(buffer, format, progressCallback) {
  let progress = 0;
  const updateProgress = () => {
    progress += 20;
    progressCallback(Math.min(progress, 100));
  };
  const image = sharp(buffer);
  updateProgress();
  const outputBuffer = await image.toFormat(format).toBuffer();
  progressCallback(100);
  return outputBuffer;
}

function convertVideo(buffer, format, progressCallback) {
  return new Promise((resolve, reject) => {
    ffmpeg(buffer)
      .toFormat(format)
      .on('progress', (progress) => {
        progressCallback(Math.min(Math.round(progress.percent), 100));
      })
      .on('end', (stdout, stderr) => {
        resolve(stdout);
      })
      .on('error', reject)
      .pipe(fs.createWriteStream('temp.' + format));
  }).then((stdout) => {
    return fs.readFile('temp.' + format);
  }).then((buffer) => {
    fs.unlink('temp.' + format);
    return buffer;
  });
}

function convertAudio(buffer, format, progressCallback) {
  return new Promise((resolve, reject) => {
    ffmpeg(buffer)
      .toFormat(format)
      .on('progress', (progress) => {
        progressCallback(Math.min(Math.round(progress.percent), 100));
      })
      .on('end', (stdout, stderr) => {
        resolve(stdout);
      })
      .on('error', reject)
      .pipe(fs.createWriteStream('temp.' + format));
  }).then((stdout) => {
    return fs.readFile('temp.' + format);
  }).then((buffer) => {
    fs.unlink('temp.' + format);
    return buffer;
  });
}

async function convertDocument(buffer, format, progressCallback) {
  const content = buffer;
  progressCallback(30);

  if (format === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    await pdfDoc.save('temp.pdf');
    const pdfBuffer = await fs.readFile('temp.pdf');
    fs.unlink('temp.pdf');
    return pdfBuffer;
  } else if (format === 'txt') {
    const result = await mammoth.extractRawText({ buffer: content });
    return Buffer.from(result.value);
  }
  
  progressCallback(100);
}

// Helper function to get mime type
function getMimeType(format) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  };
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('upload-progress', (data) => {
    socket.broadcast.emit('upload-progress-update', data);
  });

  socket.on('conversion-progress', (data) => {
    socket.broadcast.emit('conversion-progress-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
