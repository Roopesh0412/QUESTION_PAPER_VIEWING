import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Clock, BookOpen, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Watermark from './Watermark';
import CopyProtection from './CopyProtection';

export default function Layout({ children, apiClient }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 minutes (1800 seconds)
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Load user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = React.useCallback(async (reason = '') => {
    try {
      if (apiClient) {
        await apiClient.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (reason === 'inactivity') {
        navigate('/login?reason=inactive');
      } else {
        navigate('/login');
      }
    }
  }, [apiClient, navigate]);

  // Handle inactivity timer
  useEffect(() => {
    if (!user) return;

    // Reset countdown
    setSecondsRemaining(1800);

    const resetInactivityTimer = () => {
      setSecondsRemaining(1800);
    };

    // User activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Countdown interval
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          handleLogout('inactivity');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearInterval(countdownRef.current);
    };
  }, [user, handleLogout]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 select-none">
      {/* 1. Watermark Layer */}
      <Watermark 
        email={user.email} 
        loginTime={user.loginTime} 
        sessionId={user.sessionId} 
      />

      {/* 2. Copy Protection Layer */}
      <CopyProtection apiClient={apiClient} />

      {/* Header bar */}
      <header className="sticky top-0 z-[100] border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 text-white p-2 rounded-lg shadow-lg shadow-brand-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-slate-950 dark:text-white font-sans block leading-none">
                MANCHESTER
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-brand-600 block mt-0.5 leading-none">
                Technologies
              </span>
            </div>
          </div>

          {/* User info & controls */}
          <div className="flex items-center gap-6">
            
            {/* Subject Badge */}
            {user.role === 'teacher' ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30">
                <BookOpen className="w-3.5 h-3.5" />
                {user.subject}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                <Shield className="w-3.5 h-3.5" />
                Administrator
              </div>
            )}

            {/* Inactivity Timer */}
            <div className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/30" title="Session automatically ends after 30 minutes of inactivity">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-mono">{formatTime(secondsRemaining)}</span>
            </div>

            {/* User Profile */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                {user.email}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Session: {user.sessionId.substring(0, 8)}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <button
              onClick={() => handleLogout()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-100 dark:border-red-900/30 transition-all focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} Manchester Technologies. All Rights Reserved. Secure Document Management System.
        </div>
      </footer>
    </div>
  );
}
