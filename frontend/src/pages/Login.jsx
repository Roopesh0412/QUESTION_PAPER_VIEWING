import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Key, Mail, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

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
    }
  }, [searchParams]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/request-otp', { email });
      setSuccessMsg(res.data.message);
      setStep(2);
      setResendCooldown(60); // 60 seconds delay
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError('');

    try {
      const deviceId = getDeviceId();
      const res = await api.post('/auth/verify-otp', {
        email,
        otp,
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
        loginTime: new Date(payload.exp * 1000 - 86400 * 1000).toLocaleString(), // derived approx login time or formatted string
      };

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code. Please try again.');
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

          {/* Step 1: Request OTP */}
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
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
                <p className="text-[11px] text-slate-500 mt-2">
                  Enter your registered institutional email to verify your access.
                </p>
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
                    <span>Generate Secure OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Verify OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-bold text-slate-400 hover:text-white"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 tracking-[0.4em] text-center font-bold text-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Check your inbox. We have sent a 6-digit access code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify and Authenticate</span>
                )}
              </button>

              {/* Cooldown Timer */}
              <div className="text-center pt-2">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-slate-500 font-medium">
                    Resend code in <strong className="font-mono text-slate-400">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 underline"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
            </form>
          )}

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
