import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCloudUploadAlt, FaFile, FaTimes, FaFileUpload, FaCheck, FaDownload } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { uploadFileToDrive, convertFile, downloadFile } from '../utils/driveUtils';
import { getConversionFormats, isFormatSupported } from '../utils/formatConstants';
import { localStorageService } from '../services/localStorageService';
import { getMimeType } from '../utils/fileUtils';
import { notify } from '../utils/notificationUtils';
import toast from 'react-hot-toast';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [downloadState, setDownloadState] = useState({ loading: false, success: false });
  const fileInputRef = useRef(null);
  const downloadTimer = useRef(null);

  const handleFiles = async (newFiles) => {
    try {
      const fileObjects = newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'pending',
        uploadProgress: 0,
        conversionProgress: 0,
        error: null
      }));

      for (const fileObj of fileObjects) {
        if (!isFormatSupported(fileObj.type)) {
          fileObj.status = 'error';
          fileObj.error = 'Unsupported file format';
          notify.error(`Unsupported file format: ${fileObj.type}`);
        }
      }

      setFiles(prev => [...prev, ...fileObjects]);

      for (const fileObj of fileObjects) {
        if (fileObj.status === 'pending') {
          await handleUpload(fileObj);
        }
      }
    } catch (error) {
      console.error('Error handling files:', error);
      notify.error('Something went wrong while processing your files');
    }
  };

  const handleUpload = async (fileObj) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'uploading' } : f
      ));

      const fileId = await uploadFileToDrive(fileObj.file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, uploadProgress: progress } : f
        ));
      });

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? {
          ...f,
          fileId,
          status: 'uploaded',
          availableFormats: getConversionFormats(f.type)
        } : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      notify.error('Failed to upload file');
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
      ));
    }
  };

  const handleConversion = async (fileObj) => {
    if (!fileObj.outputFormat) {
      notify.error('Please select a format');
      return;
    }

    try {
      // Reset progress bar and update status
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'converting', conversionProgress: 0 } : f
      ));

      const loadingToast = notify.loading('Converting your file...');
      
      const convertedFileId = await convertFile(fileObj.fileId, fileObj.outputFormat, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, conversionProgress: progress } : f
        ));
      });

      toast.dismiss(loadingToast);
      notify.success('File converted successfully!');

      // Smooth transition to completed state
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? {
          ...f,
          status: 'completed',
          convertedFileId,
          conversionProgress: 100
        } : f
      ));

    } catch (error) {
      console.error('Conversion error:', error);
      notify.error('Failed to convert file');
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
      ));
    }
  };

  const handleDownload = async (fileObj) => {
    try {
      setDownloadState({ loading: true, success: false });
      
      await downloadFile(fileObj.convertedFileId);
      
      setDownloadState({ loading: false, success: true });
      
      if (downloadTimer.current) clearTimeout(downloadTimer.current);
      downloadTimer.current = setTimeout(() => {
        setDownloadState({ loading: false, success: false });
      }, 2000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadState({ loading: false, success: false });
      notify.error('Unable to download file');
    }
  };

  const renderProgressBar = (fileObj) => {
    const progress = fileObj.status === 'converting' ? fileObj.conversionProgress : fileObj.uploadProgress;
    const message = fileObj.status === 'converting' ? 'Converting...' : 'Uploading...';
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full bg-gray-700 rounded-full h-2.5 mb-4 relative overflow-hidden"
      >
        <motion.div
          className="bg-purple-600 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute -top-6 left-0 text-sm text-gray-300">
          {message} {progress}%
          {fileObj.status === 'converting' && (
            <span className="ml-2">
              <AiOutlineLoading3Quarters className="inline animate-spin text-purple-500" />
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  const renderDownloadButton = (fileObj) => {
    const { loading, success } = downloadState;
    
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleDownload(fileObj)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin text-white" />
        ) : success ? (
          <FaCheck className="text-purple-300" />
        ) : (
          <FaDownload />
        )}
        <span>
          {loading ? 'Downloading...' : success ? 'Downloaded!' : 'Download'}
        </span>
      </motion.button>
    );
  };

  const getStatusMessage = (file) => {
    if (file.error) return `Error: ${file.error}`;
    
    switch (file.status) {
      case 'uploading':
        return `Uploading: ${file.uploadProgress}%`;
      case 'converting':
        return `Converting: ${file.conversionProgress}%`;
      case 'completed':
        return 'Conversion completed!';
      case 'error':
        return `Error: ${file.error}`;
      default:
        return 'Ready to convert';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const FileProgressBar = ({ progress, status }) => (
    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="relative h-full bg-purple-500 rounded-full progress-striped"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
          {progress}%
        </span>
      </motion.div>
    </div>
  );

  const StatusIcon = ({ status }) => {
    if (status === 'uploading' || status === 'converting') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <AiOutlineLoading3Quarters className="w-5 h-5 text-purple-400" />
        </motion.div>
      );
    }
    if (status === 'uploaded' || status === 'completed') {
      return <FaCheck className="w-5 h-5 text-green-400" />;
    }
    if (status === 'error') {
      return <FaTimes className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center space-x-4 mb-6">
          <FaFileUpload className="w-12 h-12 text-purple-400" />
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
            Convert Your Files
          </h2>
        </div>
        <p className="text-xl text-gray-300">
          Upload files to get started with the conversion process
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/20 p-8"
      >
        {files.length === 0 ? (
          <div
            className={`relative border-2 ${
              isDragging || isHovering
                ? 'border-dotted border-purple-500 bg-purple-500/10'
                : 'border-dashed border-gray-600 hover:border-purple-500/50'
            } rounded-2xl p-16 text-center transition-all duration-300`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
            />

            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isDragging ? 1.1 : 1 }}
              className="flex flex-col items-center gap-6"
            >
              <FaCloudUploadAlt className="w-24 h-24 text-purple-400" />
              <div>
                <div className="text-2xl font-medium text-gray-300 mb-2">
                  Drag and drop your files here
                </div>
                <div className="text-lg text-gray-400 cursor-pointer hover:text-purple-400 transition-colors">
                  or click to browse your files
                </div>
              </div>
            </motion.div>

            {(isDragging || isHovering) && (
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-lg transition-opacity duration-300" />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className="bg-gray-700/30 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FaFile className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="text-lg font-medium text-gray-300">
                        {fileObj.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <StatusIcon status={fileObj.status} />
                </div>

                {/* Upload Progress */}
                {fileObj.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Uploading to Drive...</div>
                    {renderProgressBar(fileObj)}
                  </div>
                )}

                {/* Format Selection */}
                {fileObj.status === 'uploaded' && (
                  <div className="space-y-4">
                    <select
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-purple-500"
                      value={fileObj.outputFormat || ''}
                      onChange={(e) => {
                        setFiles(prev => prev.map(f => 
                          f.id === fileObj.id ? { ...f, outputFormat: e.target.value } : f
                        ));
                      }}
                    >
                      <option value="">Select output format</option>
                      {fileObj.availableFormats?.map(format => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleConversion(fileObj)}
                        disabled={!fileObj.outputFormat}
                        className={`px-4 py-2 rounded ${
                          fileObj.outputFormat
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-gray-700 cursor-not-allowed'
                        } text-white`}
                      >
                        Convert
                      </button>
                    </div>
                  </div>
                )}

                {/* Conversion Progress */}
                {fileObj.status === 'converting' && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">{getStatusMessage(fileObj)}</div>
                    {renderProgressBar(fileObj)}
                  </div>
                )}

                {/* Download Button */}
                {fileObj.status === 'completed' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="text-sm text-green-400">
                      Conversion complete! File saved to your Drive
                    </div>
                    {renderDownloadButton(fileObj)}
                  </motion.div>
                )}

                {/* Error State */}
                {fileObj.status === 'error' && (
                  <div className="text-sm text-red-400">
                    Error: {fileObj.error}
                  </div>
                )}
              </div>
            ))}

            {/* Add More Files Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
            >
              Add More Files
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FileUpload;
