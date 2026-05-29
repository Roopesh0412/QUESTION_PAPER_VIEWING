import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-full mb-6">
          <ShieldAlert className="w-12 h-12 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          ACCESS FORBIDDEN
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-3 font-medium">
          You do not have administrative permissions or proper credentials to view this page.
        </p>
        <p className="text-slate-400 dark:text-slate-600 text-xs mt-2 leading-relaxed">
          Your subject assignments and access rights are restricted. This security incident has been logged.
        </p>
        
        <button
          onClick={() => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const u = JSON.parse(userStr);
              navigate(u.role === 'admin' ? '/admin' : '/dashboard');
            } else {
              navigate('/login');
            }
          }}
          className="inline-flex items-center gap-2 mt-8 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
