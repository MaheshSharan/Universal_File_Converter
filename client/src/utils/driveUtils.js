import axiosInstance from './axiosConfig';

const API_URL = 'http://localhost:3000/api';

// Create axios instance with credentials
const api = axiosInstance;

// Smaller chunk size for more frequent progress updates
const CHUNK_SIZE = 256 * 1024; // 256KB chunks

export const uploadFileToDrive = async (file, onProgress) => {
  try {
    console.log('[UPLOAD] Starting file upload:', file.name);

    // Initialize upload
    const initResponse = await axiosInstance.post('/api/drive/init-upload', {
      fileName: file.name,
      mimeType: file.type,
      size: file.size
    });

    const fileId = initResponse.data.fileId;
    const chunkSize = 256 * 1024; // 256KB chunks
    let uploadedSize = 0;
    let lastProgress = 0;

    // Upload file in chunks
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      try {
        const formData = new FormData();
        formData.append('chunk', new Blob([chunk], { type: file.type }));
        formData.append('start', start.toString());
        formData.append('end', end.toString());
        formData.append('total', file.size.toString());

        const response = await axiosInstance.post(
          `/api/drive/upload-chunk/${fileId}`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 second timeout for each chunk
          }
        );
        
        // Update progress only if it increases
        if (response.data.progress > lastProgress) {
          lastProgress = response.data.progress;
          onProgress(response.data.progress);
        }
      } catch (chunkError) {
        console.error(`[UPLOAD] Chunk upload failed at ${start}-${end}:`, chunkError);
        throw new Error('File upload failed. Please try again.');
      }
    }

    // Complete upload
    const completeResponse = await axiosInstance.post(`/api/drive/complete-upload/${fileId}`);
    onProgress(100);
    return completeResponse.data.file.id;

  } catch (error) {
    console.error('[UPLOAD] Error uploading file:', error);
    if (error.response?.status === 401) {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to upload file. Please try again later.');
  }
};

export const convertFile = async (fileId, outputFormat, onProgress) => {
  try {
    console.log('[CONVERT] Starting conversion:', fileId, outputFormat);

    // Start conversion
    const response = await axiosInstance.post('/api/convert', {
      fileId,
      outputFormat
    });

    const { conversionId } = response.data;
    let status = { progress: 0, status: 'processing' };
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // Poll conversion status with exponential backoff
    while (status.status !== 'completed' && status.status !== 'error') {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount))); 
        const statusResponse = await axiosInstance.get(`/api/convert/status/${conversionId}`);
        status = statusResponse.data;
        retryCount = 0; // Reset retry count on successful request
        
        // Update progress based on status
        if (onProgress) {
          switch (status.status) {
            case 'downloading':
              onProgress(status.progress, 'Preparing file...');
              break;
            case 'converting':
              onProgress(status.progress, 'Converting...');
              break;
            case 'uploading':
              onProgress(status.progress, 'Finalizing...');
              break;
            case 'completed':
              onProgress(100, 'Done!');
              break;
            case 'error':
              throw new Error(status.error || 'Conversion failed');
          }
        }
      } catch (pollError) {
        console.error('[CONVERT] Poll error:', pollError);
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error('Unable to track conversion progress. Please check your converted files later.');
        }
      }
    }

    if (status.status === 'error') {
      throw new Error(status.error || 'Conversion failed');
    }

    return status.convertedFileId;

  } catch (error) {
    console.error('[CONVERT] Error during conversion:', error);
    if (error.response?.status === 401) {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  }
};

export const downloadFile = async (fileId) => {
  try {
    console.log('[DOWNLOAD] Starting download for file:', fileId);
    
    const response = await axiosInstance.get(`/api/drive/download/${fileId}`, {
      responseType: 'blob',
      timeout: 60000 // 1 minute timeout for downloads
    });

    // Get the filename from the response headers
    const contentDisposition = response.headers['content-disposition'];
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `download-${Date.now()}`;

    // Create a download link
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return response.data;
  } catch (error) {
    console.error('[DOWNLOAD] Error downloading file:', error);
    if (error.response?.status === 401) {
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error('Unable to download file. Please try again later.');
  }
};

export const downloadMultipleFiles = async (files) => {
  try {
    console.log('[DOWNLOAD] Starting multiple downloads:', files.length, 'files');
    
    // Create a JSZip instance
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Download each file and add to zip
    for (const file of files) {
      const response = await axiosInstance.get(`/api/drive/download/${file.fileId}`, {
        responseType: 'blob'
      });
      zip.file(file.name, response.data);
    }

    // Generate and download zip
    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'converted_files.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[DOWNLOAD] Error downloading multiple files:', error);
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    console.log('[DELETE] Deleting file:', fileId);
    await axiosInstance.delete(`/api/drive/delete/${fileId}`);
  } catch (error) {
    console.error('[DELETE] Error:', error);
    throw error;
  }
};
