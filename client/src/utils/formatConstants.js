// File format categories
export const FORMAT_CATEGORIES = {
  IMAGE: 'image',
  VIDEO: 'video',
};

// Supported formats by category
export const SUPPORTED_FORMATS = {
  [FORMAT_CATEGORIES.IMAGE]: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heic'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'image/heic'
    ]
  },
  [FORMAT_CATEGORIES.VIDEO]: {
    extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    mimeTypes: [
      'video/mp4',
      'video/x-matroska',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/webm'
    ]
  }
};

// Get category from mime type
export const getCategoryFromMimeType = (mimeType) => {
  for (const [category, formats] of Object.entries(SUPPORTED_FORMATS)) {
    if (formats.mimeTypes.includes(mimeType)) {
      return category;
    }
  }
  return null;
};

// Get available conversion formats
export const getConversionFormats = (fileType) => {
  const category = getCategoryFromMimeType(fileType);
  if (!category) return [];
  
  // Return all formats in the same category except the current format
  const currentFormat = fileType.split('/')[1];
  return SUPPORTED_FORMATS[category].extensions.filter(
    format => format !== currentFormat && format !== currentFormat.replace('x-', '')
  );
};

// Validate file format
export const isFormatSupported = (mimeType) => {
  return Object.values(SUPPORTED_FORMATS).some(
    category => category.mimeTypes.includes(mimeType)
  );
};

// Get friendly format name
export const getFormatDisplayName = (format) => {
  return format.toUpperCase();
};

export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toUpperCase();
  if (SUPPORTED_FORMATS[FORMAT_CATEGORIES.IMAGE].extensions.includes(extension.toLowerCase())) return FORMAT_CATEGORIES.IMAGE;
  if (SUPPORTED_FORMATS[FORMAT_CATEGORIES.VIDEO].extensions.includes(extension.toLowerCase())) return FORMAT_CATEGORIES.VIDEO;
  return null;
};

export const getAvailableFormats = (fileType, currentFormat) => {
  const formats = fileType === FORMAT_CATEGORIES.IMAGE ? SUPPORTED_FORMATS[FORMAT_CATEGORIES.IMAGE].extensions : SUPPORTED_FORMATS[FORMAT_CATEGORIES.VIDEO].extensions;
  return formats.filter(format => format !== currentFormat.toLowerCase());
};

export const validateFileFormats = (files) => {
  if (files.length === 0) return { valid: false, message: 'No files selected' };

  const firstFileType = getFileType(files[0].name);
  if (!firstFileType) {
    return { 
      valid: false, 
      message: 'Unsupported file format' 
    };
  }

  // For multiple files, check if they're all the same format
  if (files.length > 1) {
    const firstExtension = files[0].name.split('.').pop().toUpperCase();
    const hasInvalidFile = Array.from(files).some(file => {
      const extension = file.name.split('.').pop().toUpperCase();
      return extension !== firstExtension;
    });

    if (hasInvalidFile) {
      return { 
        valid: false, 
        message: 'When uploading multiple files, all files must be of the same format' 
      };
    }
  }

  return { valid: true, fileType: firstFileType };
};
