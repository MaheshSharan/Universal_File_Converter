import React, { useState, useEffect } from 'react';
import { Bell, FileUp, FileDown, History, Settings, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MaintenancePage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    { 
      icon: <FileUp className="w-6 h-6" />, 
      text: "Multi-format Support",
      color: "from-purple-500 to-blue-500" 
    },
    { 
      icon: <FileDown className="w-6 h-6" />, 
      text: "Batch Processing",
      color: "from-blue-500 to-cyan-500" 
    },
    { 
      icon: <History className="w-6 h-6" />, 
      text: "Conversion History",
      color: "from-cyan-500 to-teal-500" 
    },
    { 
      icon: <Settings className="w-6 h-6" />, 
      text: "Custom Settings",
      color: "from-teal-500 to-green-500" 
    },
    { 
      icon: <Shield className="w-6 h-6" />, 
      text: "Enhanced Security",
      color: "from-green-500 to-emerald-500" 
    },
    { 
      icon: <Zap className="w-6 h-6" />, 
      text: "Lightning Fast",
      color: "from-emerald-500 to-purple-500" 
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setEmail('');
  };

  return (
    <div className="relative min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(600px at 0% 0%, #4F46E5 0%, transparent 80%)',
            'radial-gradient(600px at 100% 0%, #7C3AED 0%, transparent 80%)',
            'radial-gradient(600px at 100% 100%, #2563EB 0%, transparent 80%)',
            'radial-gradient(600px at 0% 100%, #9333EA 0%, transparent 80%)',
            'radial-gradient(600px at 0% 0%, #4F46E5 0%, transparent 80%)',
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />

      {/* Mouse follow effect */}
      <motion.div
        className="absolute w-96 h-96 bg-purple-500 rounded-full filter blur-[100px] opacity-20"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
        }}
      />

      <motion.div 
        className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-8 border border-purple-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Maintenance Badge */}
        <motion.div
          className="absolute -top-3 right-8 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 0.5,
            scale: {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
        >
          Website Under Maintenance
        </motion.div>

        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="text-6xl mb-2"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🚀
          </motion.div>

          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            CRAFTING SOMETHING EXTRAORDINARY
          </motion.h1>
          
          <motion.p 
            className="text-gray-300 text-lg mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            We're enhancing your file conversion experience with powerful new features.
            <br />Stay tuned for something revolutionary!
          </motion.p>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`flex items-center space-x-2 bg-gradient-to-r ${feature.color} p-[1px] rounded-lg overflow-hidden`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-2 bg-gray-800 w-full p-3 rounded-lg">
                  <div className="text-white">{feature.icon}</div>
                  <span className="text-gray-300">{feature.text}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {!isSubmitted ? (
              <motion.div 
                className="relative flex items-center bg-gray-700/50 rounded-full p-2 w-full max-w-md overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Bell className="text-purple-400 w-6 h-6 ml-4" />
                <input
                  type="email"
                  placeholder="Enter your email to get notified"
                  className="bg-transparent border-none outline-none px-4 py-2 flex-1 text-gray-300 placeholder-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full hover:from-purple-600 hover:to-blue-600 transition duration-300"
                >
                  Notify Me
                </button>
              </motion.div>
            ) : (
              <motion.div 
                className="text-green-400 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Thank you! We'll notify you when we launch.
              </motion.div>
            )}
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
