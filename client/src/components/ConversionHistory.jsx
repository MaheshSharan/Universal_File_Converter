import React from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaDownload } from 'react-icons/fa';

const ConversionHistory = () => {
  // This will be replaced with actual history data from the backend
  const mockHistory = [
    {
      id: 1,
      originalName: 'document.docx',
      convertedName: 'document.pdf',
      date: new Date().toLocaleDateString(),
      status: 'completed'
    },
    // Add more mock data as needed
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
          Conversion History
        </h2>
        <p className="text-lg text-gray-300">
          View and manage your previous file conversions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700"
      >
        {mockHistory.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {mockHistory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <FaHistory className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="text-gray-200 font-medium">
                      {item.originalName} → {item.convertedName}
                    </div>
                    <div className="text-sm text-gray-400">{item.date}</div>
                  </div>
                </div>
                <button
                  className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                  onClick={() => {
                    // Handle download here
                    console.log('Downloading:', item.convertedName);
                  }}
                >
                  <FaDownload className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <FaHistory className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No conversion history yet</p>
            <p className="text-sm mt-2">
              Your previous file conversions will appear here
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ConversionHistory;
