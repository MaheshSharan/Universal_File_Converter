# Universal File Converter

A modern web application for seamless file conversion with Google Drive integration, featuring real-time progress tracking and an intuitive dark-themed UI.

## 🚀 Features

- **Google Drive Integration**: Upload and convert files directly from your Google Drive
- **Real-time Progress**: Track conversion progress with smooth animations
- **Multiple Format Support**: Convert between various file formats
- **Secure Authentication**: Google OAuth integration for secure access
- **Modern UI**: Dark-themed, responsive interface with smooth transitions
- **Local Caching**: Improved performance with local file caching

## 🛠️ Tech Stack

- **Frontend**: React.js, Framer Motion, TailwindCSS
- **Backend**: Node.js, Express.js
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API, IndexedDB
- **File Processing**: Sharp, FFmpeg

## 📋 Prerequisites

- Node.js (v14 or higher)
- Google Cloud Platform account
- Google Drive API credentials

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/MaheshSharan/Universal_File_Converter.git
cd Universal_File_Converter
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables:
```bash
# In server directory
cp .env.example .env
# Add your Google OAuth credentials and other configuration
```

4. Start the development servers:
```bash
# Start backend server
cd server
npm run dev

# Start frontend in another terminal
cd client
npm run dev
```

## 📝 File Upload Rules

1. **Format Compatibility Rules**:
   - Images can only be converted to other image formats (jpg, jpeg, png, gif, webp)
   - Videos can only be converted to other video formats (mp4, avi, mov)
   - Documents can only be converted to other document formats (pdf, doc, docx, txt)
   - Audio files can only be converted to other audio formats (mp3, wav)

2. **Batch Upload Rules**:
   - When uploading multiple files, all files must be of the same type category (e.g., all images or all videos)
   - Files in a batch must have the same target format
   - Each file will be processed sequentially to ensure stability

3. **General Rules**:
   - Files must be in a supported format for conversion
   - Target format must be compatible with the source format category
   - Corrupted or invalid files will be rejected

## 🎯 Upcoming Features

- [ ] Support for additional file formats
- [ ] Multi-file conversion capability
- [ ] Enhanced server-side file cleanup
- [ ] Conversion history tracking
- [ ] Extended Google Drive integration features
- [ ] Batch processing capabilities
- [ ] Custom conversion settings
- [ ] Advanced error recovery mechanisms

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Drive API Documentation
- React.js Community
- FFmpeg Documentation
