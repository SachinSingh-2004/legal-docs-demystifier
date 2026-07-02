import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon, LogOut, User, Folder, UploadCloud, HelpCircle, ShieldAlert } from 'lucide-react';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AnalysisResultPage from './pages/AnalysisResultPage';
import ChatPage from './pages/ChatPage';
import WhatIfPage from './pages/WhatIfPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
        <div className="spinner mb-4"></div>
        <p className="font-semibold text-sm">Authenticating session...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Global Toast Alert Handler
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const { type, message } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message }]);
      
      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('toast-alert', handleToastEvent);
    return () => window.removeEventListener('toast-alert', handleToastEvent);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold capitalize text-sm">{t.type}:</span>
            <span className="text-sm text-[var(--text-secondary)]">{t.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Navigation Component
const Nav = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <div className="nav-logo">⚖️</div>
          <span className="nav-title font-display">Demystifier</span>
        </Link>
        
        <div className="nav-actions">
          <button onClick={toggleTheme} className="nav-btn btn-icon flex items-center justify-center" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <>
              <Link to="/dashboard" className="nav-btn flex items-center gap-2">
                <Folder size={16} /> <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link to="/upload" className="nav-btn flex items-center gap-2">
                <UploadCloud size={16} /> <span className="hidden sm:inline">Upload</span>
              </Link>
              <Link to="/settings" className="nav-btn flex items-center gap-2">
                <User size={16} /> <span className="hidden sm:inline">Profile</span>
              </Link>
              <button onClick={logout} className="nav-btn primary flex items-center gap-2">
                <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn">Login</Link>
              <Link to="/register" className="nav-btn primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-200">
        <Nav />
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } />
            <Route path="/analysis/:analysisId" element={
              <ProtectedRoute>
                <AnalysisResultPage />
              </ProtectedRoute>
            } />
            <Route path="/chat/:documentId" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/whatif/:documentId" element={
              <ProtectedRoute>
                <WhatIfPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
