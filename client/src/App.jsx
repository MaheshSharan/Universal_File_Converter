import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MaintenancePage from './components/MaintenancePage';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import FileUpload from './components/FileUpload';
import ConversionHistory from './components/ConversionHistory';
import { AuthProvider } from './context/AuthContext';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Maintenance mode flag - set to false when ready to launch
const MAINTENANCE_MODE = true;

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const App = () => {
  // If in maintenance mode, don't even initialize auth
  if (MAINTENANCE_MODE) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F2937',
                color: 'white',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<MaintenancePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // Only wrap with AuthProvider when not in maintenance mode
  return (
    <Router>
      <AuthProvider>
        {({ isAuthenticated, isLoading }) => (
          <div className="min-h-screen bg-gray-900 text-white">
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1F2937',
                  color: 'white',
                },
              }}
            />
            
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Header />
                <motion.main 
                  className="flex-grow container mx-auto px-4 py-8 mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Routes>
                    <Route
                      path="/"
                      element={
                        isAuthenticated ? (
                          <Navigate to="/upload" replace />
                        ) : (
                          <LoginPrompt />
                        )
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        isAuthenticated ? (
                          <FileUpload />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        isAuthenticated ? (
                          <ConversionHistory />
                        ) : (
                          <Navigate to="/" replace />
                        )
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </motion.main>
                <Footer />
              </>
            )}
          </div>
        )}
      </AuthProvider>
    </Router>
  );
};

export default App;