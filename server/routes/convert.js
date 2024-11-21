const express = require('express');
const router = express.Router();
const { downloadFile, uploadFile, getFileMetadata } = require('../services/driveService');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const fileUpload = require('express-fileupload');

// Enable file upload middleware
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../temp')
}));

// Store conversion progress
const conversionProgress = new Map();

// Start conversion
router.post('/', async (req, res) => {
  try {
    const { fileId, outputFormat } = req.body;
    const conversionId = `${fileId}-${Date.now()}`;
    
    console.log(`[CONVERT] Starting conversion for file ${fileId} to ${outputFormat}`);
    
    // Initialize progress tracking
    conversionProgress.set(conversionId, {
      progress: 0,
      status: 'processing',
      source: 'drive'
    });

    // Start conversion process in background
    convertFile(conversionId, fileId, outputFormat, req.auth)
      .catch(error => {
        console.error('[CONVERT] Error:', error);
        conversionProgress.set(conversionId, {
          progress: 0,
          status: 'error',
          error: error.message,
          source: 'drive'
        });
      });

    res.json({ conversionId });
  } catch (error) {
    console.error('[CONVERT] Error starting conversion:', error);
    res.status(500).json({ error: 'Failed to start conversion' });
  }
});

// Handle local file conversion
router.post('/local', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.files.file;
    const outputFormat = req.body.format;
    const conversionId = `local-${Date.now()}`;
    
    console.log(`[CONVERT] Starting local conversion for ${file.name} to ${outputFormat}`);
    
    // Initialize progress tracking
    conversionProgress.set(conversionId, {
      progress: 0,
      status: 'processing',
      source: 'local'
    });

    // File is already saved to temp file by express-fileupload
    const tempInputPath = file.tempFilePath;
    const tempOutputPath = path.join(path.dirname(tempInputPath), `output-${conversionId}.${outputFormat.toLowerCase()}`);
    
    console.log(`[CONVERT] Using temp file: ${tempInputPath}`);
    console.log(`[CONVERT] File mimetype: ${file.mimetype}`);

    // Update progress
    conversionProgress.set(conversionId, {
      progress: 30,
      status: 'converting',
      source: 'local'
    });

    // Determine file type and convert
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    console.log(`[CONVERT] File type: ${isImage ? 'image' : isVideo ? 'video' : 'unknown'}`);

    let convertedBuffer;
    if (isImage) {
      console.log('[CONVERT] Converting image using Sharp');
      convertedBuffer = await convertImage(tempInputPath, outputFormat.toLowerCase());
    } else if (isVideo) {
      console.log('[CONVERT] Converting video using FFmpeg');
      await convertVideo(tempInputPath, tempOutputPath, outputFormat.toLowerCase(), conversionId);
      // Read the output file and ensure it's a Buffer
      const outputData = await fs.readFile(tempOutputPath);
      convertedBuffer = Buffer.from(outputData);
    } else {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    // Update progress
    conversionProgress.set(conversionId, {
      progress: 70,
      status: 'uploading',
      source: 'local'
    });

    console.log('[CONVERT] Uploading converted file to Drive');

    // Upload converted file to Drive
    const uploadResponse = await uploadFile({
      name: `${path.parse(file.name).name}.${outputFormat.toLowerCase()}`,
      mimeType: getMimeType(outputFormat),
      buffer: convertedBuffer
    }, req.auth);

    // Cleanup temp files
    try {
      await fs.unlink(tempInputPath);
      if (await fs.access(tempOutputPath).then(() => true).catch(() => false)) {
        await fs.unlink(tempOutputPath);
      }
      console.log('[CONVERT] Cleaned up temporary files');
    } catch (error) {
      console.error('[CONVERT] Error cleaning up temp files:', error);
    }

    // Update final progress
    conversionProgress.set(conversionId, {
      progress: 100,
      status: 'completed',
      convertedFileId: uploadResponse.id,
      source: 'local'
    });

    console.log('[CONVERT] Conversion completed successfully');

    res.json({ 
      conversionId,
      convertedFileId: uploadResponse.id 
    });
  } catch (error) {
    console.error('[CONVERT] Local conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversion status
router.get('/status/:conversionId', (req, res) => {
  const { conversionId } = req.params;
  const status = conversionProgress.get(conversionId) || {
    progress: 0,
    status: 'error',
    error: 'Conversion not found',
    source: 'unknown'
  };
  res.json(status);
});

async function convertFile(conversionId, fileId, outputFormat, auth) {
  try {
    console.log(`[CONVERT] Downloading file ${fileId} from Drive`);
    
    // Update progress
    conversionProgress.set(conversionId, {
      progress: 10,
      status: 'downloading',
      source: 'drive'
    });

    // Download file from Drive
    const fileBuffer = await downloadFile(fileId, auth);
    const fileMetadata = await getFileMetadata(fileId, auth);
    
    console.log(`[CONVERT] File downloaded: ${fileMetadata.name}`);
    
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempInputPath = path.join(tempDir, `input-${conversionId}`);
    const tempOutputPath = path.join(tempDir, `output-${conversionId}.${outputFormat.toLowerCase()}`);
    
    // Convert ArrayBuffer to Buffer if needed
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    
    // Write the buffer to file
    await fs.writeFile(tempInputPath, buffer);

    console.log(`[CONVERT] Saved input file to ${tempInputPath}`);

    // Update progress
    conversionProgress.set(conversionId, {
      progress: 30,
      status: 'converting',
      source: 'drive'
    });

    // Determine conversion type and convert
    const inputExt = path.extname(fileMetadata.name).toLowerCase().slice(1);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heic'].includes(inputExt);
    const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(inputExt);

    console.log(`[CONVERT] File type: ${isImage ? 'image' : isVideo ? 'video' : 'unknown'}`);

    let convertedBuffer;
    if (isImage) {
      console.log('[CONVERT] Converting image using Sharp');
      convertedBuffer = await convertImage(tempInputPath, outputFormat.toLowerCase());
    } else if (isVideo) {
      console.log('[CONVERT] Converting video using FFmpeg');
      await convertVideo(tempInputPath, tempOutputPath, outputFormat.toLowerCase(), conversionId);
      convertedBuffer = await fs.readFile(tempOutputPath);
    } else {
      throw new Error('Unsupported file type');
    }

    // Update progress
    conversionProgress.set(conversionId, {
      progress: 70,
      status: 'uploading',
      source: 'drive'
    });

    console.log('[CONVERT] Uploading converted file to Drive');

    // Upload converted file to Drive
    const uploadResponse = await uploadFile({
      name: `${path.parse(fileMetadata.name).name}.${outputFormat.toLowerCase()}`,
      mimeType: getMimeType(outputFormat),
      buffer: convertedBuffer
    }, auth);

    // Cleanup temp files
    try {
      await fs.unlink(tempInputPath);
      if (await fs.access(tempOutputPath).then(() => true).catch(() => false)) {
        await fs.unlink(tempOutputPath);
      }
      console.log('[CONVERT] Cleaned up temporary files');
    } catch (error) {
      console.error('[CONVERT] Error cleaning up temp files:', error);
    }

    // Update final progress
    conversionProgress.set(conversionId, {
      progress: 100,
      status: 'completed',
      convertedFileId: uploadResponse.id,
      source: 'drive'
    });

    console.log('[CONVERT] Conversion completed successfully');

    return uploadResponse.id;
  } catch (error) {
    console.error('[CONVERT] Conversion error:', error);
    conversionProgress.set(conversionId, {
      progress: 0,
      status: 'error',
      error: error.message,
      source: 'drive'
    });
    throw error;
  }
}

async function convertImage(inputPath, outputFormat) {
  const sharpInstance = sharp(inputPath);
  
  switch (outputFormat.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return await sharpInstance.jpeg({ quality: 90 }).toBuffer();
    case 'png':
      return await sharpInstance.png().toBuffer();
    case 'webp':
      return await sharpInstance.webp({ quality: 90 }).toBuffer();
    case 'gif':
      return await sharpInstance.gif().toBuffer();
    case 'tiff':
      return await sharpInstance.tiff().toBuffer();
    case 'bmp':
      return await sharpInstance.bmp().toBuffer();
    default:
      throw new Error(`Unsupported image format: ${outputFormat}`);
  }
}

function convertVideo(inputPath, outputPath, outputFormat, conversionId) {
  return new Promise((resolve, reject) => {
    let lastProgress = 0;
    let command = ffmpeg(inputPath)
      .toFormat(outputFormat)
      .on('start', () => {
        console.log('[CONVERT] FFmpeg process started');
        conversionProgress.set(conversionId, {
          progress: 30,
          status: 'converting',
          source: conversionId.startsWith('local-') ? 'local' : 'drive'
        });
      })
      .on('progress', (progress) => {
        // Only update if progress has changed significantly (more than 1%)
        if (progress.percent - lastProgress >= 1) {
          lastProgress = progress.percent;
          console.log(`[CONVERT] Video conversion progress: ${progress.percent}%`);
          // Update progress in 30-70% range
          const convertProgress = 30 + (progress.percent * 0.4);
          conversionProgress.set(conversionId, {
            progress: Math.floor(convertProgress),
            status: 'converting',
            source: conversionId.startsWith('local-') ? 'local' : 'drive'
          });
        }
      })
      .on('end', () => {
        console.log('[CONVERT] Video conversion completed');
        resolve();
      })
      .on('error', (err) => {
        console.error('[CONVERT] Video conversion error:', err);
        reject(err);
      });

    // Add format-specific settings
    switch (outputFormat.toLowerCase()) {
      case 'mp4':
        command.videoCodec('libx264').audioCodec('aac');
        break;
      case 'webm':
        command.videoCodec('libvpx').audioCodec('libvorbis');
        break;
      case 'mkv':
        command.videoCodec('libx264').audioCodec('aac');
        break;
      case 'avi':
        command.videoCodec('libx264').audioCodec('aac');
        break;
      default:
        throw new Error(`Unsupported video format: ${outputFormat}`);
    }

    command.save(outputPath);
  });
}

function getMimeType(format) {
  const mimeTypes = {
    // Image formats
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    
    // Video formats
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv'
  };

  const mimeType = mimeTypes[format.toLowerCase()];
  if (!mimeType) {
    throw new Error(`Unsupported format: ${format}`);
  }
  return mimeType;
}

module.exports = router;
