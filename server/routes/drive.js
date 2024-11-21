const express = require('express');
const router = express.Router();
const multer = require('multer');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/googleAuth');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit
  }
}).single('chunk'); // Configure multer to expect a single file with field name 'chunk'

// Middleware to check authentication
const checkAuth = async (req, res, next) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    oauth2Client.setCredentials(req.session.tokens);
    req.oauth2Client = oauth2Client;
    req.auth = oauth2Client;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

router.use(checkAuth);

// Initialize upload
router.post('/init-upload', async (req, res) => {
  try {
    console.log('[DRIVE] Initializing file upload...');
    console.log(`[DRIVE] User: ${req.session.user?.email}`);
    console.log(`[DRIVE] File details:`, req.body);

    const drive = google.drive({ version: 'v3', auth: req.auth });
    
    const fileMetadata = {
      name: req.body.fileName,
      parents: ['root']
    };

    console.log('[DRIVE] Creating upload session...');
    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    console.log(`[DRIVE] Upload session created. File ID: ${response.data.id}`);
    
    if (!req.session.uploads) {
      req.session.uploads = {};
    }
    req.session.uploads[response.data.id] = {
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      size: req.body.size,
      uploadedSize: 0
    };

    res.json({ fileId: response.data.id });
  } catch (error) {
    console.error('[DRIVE] Upload initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

// Upload file chunk
router.post('/upload-chunk/:fileId', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('[DRIVE] Multer error:', err);
      return res.status(500).json({ error: 'File upload error' });
    }

    try {
      const { fileId } = req.params;
      const { start, end, total } = req.body;
      const uploadInfo = req.session.uploads?.[fileId];
      
      if (!uploadInfo) {
        console.error(`[DRIVE] No upload info found for file ${fileId}`);
        return res.status(404).json({ error: 'Upload not found' });
      }

      if (!req.file) {
        console.error('[DRIVE] No file chunk received');
        return res.status(400).json({ error: 'No file chunk received' });
      }

      const chunkSize = parseInt(end) - parseInt(start);
      uploadInfo.uploadedSize += chunkSize;
      const progress = Math.round((uploadInfo.uploadedSize / uploadInfo.size) * 100);
      
      console.log(`[DRIVE] Uploading chunk for file ${fileId}`);
      console.log(`[DRIVE] Progress: ${progress}% (${uploadInfo.uploadedSize}/${uploadInfo.size} bytes)`);

      const drive = google.drive({ version: 'v3', auth: req.auth });
      
      // Update file with chunk
      await drive.files.update({
        fileId: fileId,
        media: {
          body: req.file.buffer,
          mimeType: req.file.mimetype
        }
      });

      res.json({ 
        success: true,
        progress
      });
    } catch (error) {
      console.error('[DRIVE] Chunk upload error:', error);
      res.status(500).json({ error: 'Failed to upload chunk' });
    }
  });
});

// Complete upload
router.post('/complete-upload/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadInfo = req.session.uploads?.[fileId];
    
    console.log(`[DRIVE] Completing upload for file ${fileId}`);

    const drive = google.drive({ version: 'v3', auth: req.auth });
    
    // Get file metadata
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size'
    });

    console.log(`[DRIVE] Upload completed successfully:`);
    console.log(`- File: ${file.data.name}`);
    console.log(`- Size: ${file.data.size} bytes`);
    console.log(`- Type: ${file.data.mimeType}`);

    // Clean up session data
    if (uploadInfo) {
      delete req.session.uploads[fileId];
    }

    res.json({ 
      success: true,
      file: file.data
    });
  } catch (error) {
    console.error('[DRIVE] Upload completion error:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

// Download file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`[DRIVE] Downloading file ${fileId}`);

    const drive = google.drive({ version: 'v3', auth: req.auth });
    
    // Get file metadata first
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size'
    });

    // Set response headers
    res.setHeader('Content-Type', file.data.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.data.name}"`);

    // Get the file content
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });

    // Pipe the file stream to response
    response.data.pipe(res);

    response.data.on('end', () => {
      console.log(`[DRIVE] Download completed successfully:`);
      console.log(`- File: ${file.data.name}`);
      console.log(`- Size: ${file.data.size} bytes`);
      console.log(`- Type: ${file.data.mimeType}`);
    });

    response.data.on('error', (err) => {
      console.error('[DRIVE] Download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('[DRIVE] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

module.exports = router;
