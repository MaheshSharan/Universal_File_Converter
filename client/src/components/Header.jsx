import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHome, FaUser, FaHistory, FaSignOutAlt, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navItems = isAuthenticated ? [
    {
      label: user?.name || 'Profile',
      icon: FaUser,
      to: '/upload',
      active: location.pathname === '/upload'
    },
    {
      label: 'History',
      icon: FaHistory,
      to: '/history',
      active: location.pathname === '/history'
    }
  ] : [
    {
      label: 'Home',
      icon: FaHome,
      to: '/',
      active: location.pathname === '/'
    },
    {
      label: 'Formats',
      icon: FaFileAlt,
      to: '/formats',
      active: location.pathname === '/formats'
    },
    {
      label: 'How It Works',
      icon: FaQuestionCircle,
      to: '/how-it-works',
      active: location.pathname === '/how-it-works'
    }
  ];

  return (
    <header className="bg-gray-800/80 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Universal File Converter
          </Link>

          <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-gray-700/50 text-purple-400'
                    : 'text-gray-300 hover:text-purple-400'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-red-400 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
