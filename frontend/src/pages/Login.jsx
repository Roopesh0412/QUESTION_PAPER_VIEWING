import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Key, Mail, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Notifications from URL
  const [notification, setNotification] = useState('');

  // Persist device_id
  const getDeviceId = () => {
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_id', id);
    }
    return id;
  };

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'inactive') {
      setNotification('Your session has ended due to 30 minutes of inactivity.');
    } else if (reason === 'terminated') {
      setNotification('Your account has been logged in from another device. Previous session terminated.');
    } else if (reason === 'expired') {
      setNotification('Your security token has expired. Please login again.');
    } else if (reason === 'screenshot_violation') {
      setNotification('Access Denied: Your account has been suspended for 1 hour due to a security violation (screenshot attempt).');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/login', {
        email,
        password,
        device_id: deviceId,
      });

      const { access_token, role, subject } = res.data;
      
      // Decode JWT locally for display metadata (e.g. session_id, loginTime)
      const tokenParts = access_token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      
      const userData = {
        email,
        role,
        subject,
        sessionId: payload.session_id,
        loginTime: new Date(payload.exp * 1000 - 86400 * 1000).toLocaleString(),
      };

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.18),rgba(255,255,255,0))] font-sans px-4 sm:px-6">
      
      <div className="max-w-md w-full">
        
        {/* Top Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-brand-600/10 text-brand-400 p-4 rounded-2xl shadow-inner border border-brand-500/20 mb-4 animate-bounce">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            MANCHESTER TECHNOLOGIES
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase font-semibold tracking-widest">
            Secure Question Bank Portal
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 transition-all duration-300">
          
          {/* Notification Banners */}
          {notification && (
            <div className="flex gap-3 bg-amber-500/10 text-amber-400 p-4 rounded-xl border border-amber-500/20 text-sm mb-6 font-medium leading-relaxed animate-pulse">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {error && (
            <div className="flex gap-3 bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 text-sm mb-6 font-medium leading-relaxed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-3 bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-sm mb-6 font-medium leading-relaxed">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                Teacher Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="teacher@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Security Footer Notice */}
        <p className="text-center text-slate-500 text-xs mt-6 leading-relaxed">
          Manchester Technologies Document Security Policy v4.1.<br />
          All actions are audited. Intrusions are logged.
        </p>

      </div>
    </div>
  );
}
