import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaQuestionCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LoginPrompt = () => {
  const { login } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <svg className="absolute w-full h-full">
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-purple-500/20 to-blue-500/20"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              borderRadius: '40%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, 30, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="bg-gray-800/50 backdrop-blur-lg p-12 rounded-2xl shadow-2xl z-10 max-w-2xl w-full mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
          Welcome to Universal File Converter
        </h1>
        
        <div className="text-center mb-10 text-gray-300 relative">
          <p className="text-xl inline-flex items-center gap-2">
            Sign in with Google to access secure file conversion
            <span
              className="text-gray-400 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FaQuestionCircle />
            </span>
          </p>
          
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 p-4 bg-gray-700 rounded-lg shadow-lg text-sm max-w-xs z-50"
            >
              We use Google login to upload your files directly to your Drive for conversion. Once converted, the files are saved back to your Drive.Why?
              This is an open-source project with no servers or storage costs—we rely on your Drive to handle file storage
            </motion.div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-8 rounded-xl text-lg font-medium transition-all hover:from-purple-600 hover:to-blue-600 shadow-lg"
        >
          <FaGoogle className="text-2xl" />
          Sign in with Google
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LoginPrompt;
