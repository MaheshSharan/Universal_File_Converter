const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

const createDriveClient = (auth) => {
  return google.drive({ 
    version: 'v3',
    auth: auth
  });
};

const uploadFile = async ({ name, mimeType, buffer }, auth) => {
  try {
    const driveClient = createDriveClient(auth);
    const requestBody = {
      name,
      mimeType,
    };

    const media = {
      mimeType,
      body: stream.Readable.from(buffer)
    };

    const response = await driveClient.files.create({
      requestBody,
      media,
      fields: 'id,name,mimeType,size',
    });

    console.log('[DRIVE] Upload completed successfully:');
    console.log(`- File: ${response.data.name}`);
    console.log(`- Size: ${response.data.size} bytes`);
    console.log(`- Type: ${response.data.mimeType}`);

    return response.data;
  } catch (error) {
    console.error('[DRIVE] Upload error:', error.message);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const downloadFile = async (fileId, auth) => {
  try {
    const driveClient = createDriveClient(auth);
    
    // First get file metadata
    const file = await driveClient.files.get({
      fileId,
      fields: 'id,name,mimeType,size',
    });

    // Then download the file
    const response = await driveClient.files.get({
      fileId,
      alt: 'media',
    }, {
      responseType: 'arraybuffer'
    });

    console.log('[DRIVE] Download completed successfully:');
    console.log(`- File: ${file.data.name}`);
    console.log(`- Size: ${file.data.size} bytes`);
    console.log(`- Type: ${file.data.mimeType}`);

    return response.data;
  } catch (error) {
    console.error('[DRIVE] Download error:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

const getFileMetadata = async (fileId, auth) => {
  try {
    const driveClient = createDriveClient(auth);
    const response = await driveClient.files.get({
      fileId,
      fields: 'id,name,mimeType,size'
    });
    return response.data;
  } catch (error) {
    console.error('[DRIVE] Metadata error:', error.message);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};

const deleteFile = async (fileId, auth) => {
  try {
    const driveClient = createDriveClient(auth);
    await driveClient.files.delete({
      fileId
    });
    console.log('[DRIVE] File deleted successfully:', fileId);
  } catch (error) {
    console.error('[DRIVE] Delete error:', error.message);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  getFileMetadata,
  deleteFile
};
