import React from 'react';
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/30 backdrop-blur-[2px] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-center space-x-4">
        <a 
          href="https://github.com/MaheshSharan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/40 hover:text-purple-400 transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>
        <span className="text-white/40 text-sm">© 2024 Universal File Converter</span>
      </div>
    </footer>
  );
};

export default Footer;
