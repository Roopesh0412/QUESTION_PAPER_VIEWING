import React, { useState, useEffect } from 'react';
import { 
  Users, HelpCircle, HardDrive, FileText, Plus, Trash2, 
  ToggleLeft, ToggleRight, Upload, LogOut, Search, AlertCircle 
} from 'lucide-react';
import api from '../api';
import MathJaxRenderer from '../components/MathJaxRenderer';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Teachers state
  const [teachers, setTeachers] = useState([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Physics');
  const [newTeacherRole, setNewTeacherRole] = useState('teacher');
  const [teacherMsg, setTeacherMsg] = useState('');
  const [teacherErr, setTeacherErr] = useState('');

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [qSubject, setQSubject] = useState('Physics');
  const [qChapter, setQChapter] = useState('');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qAnswer, setQAnswer] = useState('A');
  const [qImageUrl, setQImageUrl] = useState('');
  const [bulkJson, setBulkJson] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [qErr, setQErr] = useState('');
  const [qSearch, setQSearch] = useState('');
  const [qPage, setQPage] = useState(1);
  const [qPages, setQPages] = useState(1);
  const [qFilterSubject, setQFilterSubject] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionMsg, setSessionMsg] = useState('');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logEmail, setLogEmail] = useState('');
  const [logAction, setLogAction] = useState('');

  const subjectsList = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  // ----------------------------------------------------
  // API Calls - Teachers
  // ----------------------------------------------------
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setTeacherMsg('');
    setTeacherErr('');
    try {
      await api.post('/admin/teachers', {
        email: newTeacherEmail,
        subject: newTeacherSubject,
        role: newTeacherRole,
        is_active: true
      });
      setTeacherMsg('Teacher account added successfully.');
      setNewTeacherEmail('');
      fetchTeachers();
    } catch (err) {
      setTeacherErr(err.response?.data?.detail || 'Failed to add teacher.');
    }
  };

  const handleToggleTeacherStatus = async (teacherId, currentStatus) => {
    try {
      await api.put(`/admin/teachers/${teacherId}`, {
        is_active: !currentStatus
      });
      fetchTeachers();
      // If active sessions view is open, refresh that too since deactivation logs them out
      if (activeTab === 'sessions') fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to permanently delete this teacher account?')) return;
    try {
      await api.delete(`/admin/teachers/${teacherId}`);
      fetchTeachers();
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Questions
  // ----------------------------------------------------
  const fetchQuestions = async () => {
    try {
      const res = await api.get('/teachers/questions', {
        params: {
          subject: qFilterSubject,
          search: qSearch,
          page: qPage,
          limit: 6
        }
      });
      setQuestions(res.data.questions);
      setQPages(res.data.pages);
    } catch (err) {
      console.error(err);
    }
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' or 'url'

  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQErr('Only image files are allowed.');
      return;
    }
    // Limit file size to 3MB
    if (file.size > 3 * 1024 * 1024) {
      setQErr('Image size should be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setQImageUrl(e.target.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  const handlePasteImage = (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        handleImageFile(file);
        e.preventDefault();
        break;
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQMsg('');
    setQErr('');
    
    // Validate options are filled
    if (qOptions.some(opt => !opt.trim())) {
      setQErr('All four option fields are required.');
      return;
    }

    try {
      await api.post('/admin/questions', {
        subject: qSubject,
        chapter: qChapter,
        question: qText,
        options: qOptions,
        answer: qAnswer,
        image_url: qImageUrl
      });
      setQMsg('Question added successfully.');
      setQChapter('');
      setQText('');
      setQOptions(['', '', '', '']);
      setQImageUrl('');
      fetchQuestions();
    } catch (err) {
      setQErr(err.response?.data?.detail || 'Failed to add question.');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setQMsg('');
    setQErr('');
    try {
      const parsed = JSON.parse(bulkJson);
      const payload = Array.isArray(parsed) ? parsed : [parsed];
      
      const res = await api.post('/admin/questions/bulk', payload);
      setQMsg(res.data.message);
      setBulkJson('');
      fetchQuestions();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setQErr('Invalid JSON syntax. Ensure it matches [{ "subject": "...", ... }]');
      } else {
        setQErr(err.response?.data?.detail || 'Bulk upload failed.');
      }
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Active Sessions
  // ----------------------------------------------------
  const fetchSessions = async () => {
    try {
      const res = await api.get('/admin/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceLogout = async (email, sessionId) => {
    if (!window.confirm(`Force logout user ${email}?`)) return;
    setSessionMsg('');
    try {
      await api.post('/admin/sessions/force-logout', { email, session_id: sessionId });
      setSessionMsg(`Successfully terminated session for ${email}.`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Audit Logs
  // ----------------------------------------------------
  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          email: logEmail,
          action: logAction
        }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'logs') {
      fetchAuditLogs();
    }
  }, [activeTab, qPage, qFilterSubject]);

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Page Title */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl border border-slate-700/50 shadow-lg">
        <div>
          <span className="text-brand-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
            <HardDrive className="w-4 h-4" />
            System Control Panel
          </span>
          <h1 className="text-2xl font-black mt-1">Manchester Admin Panel</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'teachers' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teachers CRUD</span>
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'questions' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Questions Panel</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'sessions' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Active Sessions ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'logs' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Security Logs</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB: TEACHERS CRUD                                    */}
      {/* ==================================================== */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Teacher Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-600" />
              Add Teacher Account
            </h2>
            
            {teacherMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
                {teacherMsg}
              </div>
            )}
            {teacherErr && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold mb-4 border border-red-100">
                {teacherErr}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@domain.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Subject Assignment</label>
                <select
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                >
                  {subjectsList.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="All">All Subjects (Admin Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Access Role</label>
                <select
                  value={newTeacherRole}
                  onChange={(e) => setNewTeacherRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Add Teacher Account
              </button>
            </form>
          </div>

          {/* Teachers List Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold mb-4">Authorized Accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {teachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="py-3 font-semibold">{t.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          {t.subject}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs capitalize">{t.role}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleToggleTeacherStatus(t._id, t.is_active)}
                          title="Click to toggle status"
                          className="focus:outline-none"
                        >
                          {t.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded text-xs font-bold">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded text-xs font-bold">
                              Suspended
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 text-center">
                        {t.email !== 'admin@manchester.com' && (
                          <button
                            onClick={() => handleDeleteTeacher(t._id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: QUESTIONS MANAGEMENT                            */}
      {/* ==================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          
          {/* Question Add & Bulk Upload forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Create Single Question */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                Add Single Question
              </h2>

              {qMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
                  {qMsg}
                </div>
              )}
              {qErr && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold mb-4 border border-red-100">
                  {qErr}
                </div>
              )}

              <form onSubmit={handleAddQuestion} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                    <select
                      value={qSubject}
                      onChange={(e) => setQSubject(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      {subjectsList.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Chapter Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thermodynamics"
                      value={qChapter}
                      onChange={(e) => setQChapter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Question Body (HTML & LaTeX allowed)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter question text here. Use $$[equation]$$ for display math and $[equation]$ for inline math."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white font-mono"
                  />
                </div>

                {/* Options inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {qOptions.map((opt, oIdx) => {
                    const label = String.fromCharCode(65 + oIdx); // A, B, C, D
                    // Strip the "A. ", "B. " prefix for the visual input value to avoid double-prepending bugs
                    const displayValue = opt.startsWith(`${label}. `) ? opt.substring(3) : opt;
                    return (
                      <div key={oIdx}>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Option {label}</label>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${label}`}
                          value={displayValue}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            updated[oIdx] = `${label}. ${e.target.value}`;
                            setQOptions(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                        />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Correct Answer</label>
                  <select
                    value={qAnswer}
                    onChange={(e) => setQAnswer(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">Question Image (Optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputMode(imageInputMode === 'upload' ? 'url' : 'upload');
                        setQImageUrl('');
                      }}
                      className="text-[10px] text-brand-600 hover:underline font-bold"
                    >
                      {imageInputMode === 'upload' ? 'Or paste web image URL' : 'Or drag & drop/paste file'}
                    </button>
                  </div>

                  {imageInputMode === 'upload' ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onPaste={handlePasteImage}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDragActive 
                          ? 'border-brand-500 bg-brand-50/10' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900/30'
                      }`}
                      onClick={() => document.getElementById('image-upload-input').click()}
                    >
                      <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageFile(e.target.files[0]);
                          }
                        }}
                      />
                      {qImageUrl ? (
                        <div className="relative group/img max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                          <img src={qImageUrl} alt="Preview" className="max-h-24 mx-auto rounded border border-slate-200 shadow-sm" />
                          <button
                            type="button"
                            onClick={() => setQImageUrl('')}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-all hover:scale-110"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 text-slate-400 select-none">
                          <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400 dark:text-slate-600" />
                          <span className="text-xs font-bold block text-slate-650 dark:text-slate-400">Drag & Drop image here</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Click to browse or Paste image directly (Ctrl+V)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://example.com/image.png"
                        value={qImageUrl}
                        onChange={(e) => setQImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                      />
                      {qImageUrl && (
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <img src={qImageUrl} alt="URL Preview" className="max-h-24 mx-auto rounded border border-slate-200 shadow-sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg text-sm transition-all"
                >
                  Create Question
                </button>
              </form>
            </div>

            {/* Bulk Upload Questions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-brand-600" />
                  Bulk Upload via JSON
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Paste a JSON array of question documents. Options must start with letter labels.
                </p>
                
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <textarea
                    rows={8}
                    required
                    placeholder={`[\n  {\n    "subject": "Physics",\n    "chapter": "Relativity",\n    "question": "What is E?",\n    "options": ["A. mc^2", "B. mc", "C. m/c", "D. c^2"],\n    "answer": "A",\n    "image_url": ""\n  }\n]`}
                    value={bulkJson}
                    onChange={(e) => setBulkJson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold rounded-lg text-sm transition-all"
                  >
                    Run Bulk Upload
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Questions Grid list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">Existing Question Library</h2>
              
              {/* Question list filters */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={qFilterSubject}
                  onChange={(e) => {
                    setQFilterSubject(e.target.value);
                    setQPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold dark:text-white"
                >
                  <option value="">All Subjects</option>
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className="relative flex-1 sm:flex-initial">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={qSearch}
                    onChange={(e) => {
                      setQSearch(e.target.value);
                      setQPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 w-full sm:w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q._id} className="border border-slate-100 dark:border-slate-850 p-4 rounded-lg bg-slate-50 dark:bg-slate-950/40 relative group">
                  <button
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="absolute top-4 right-4 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {q.subject} &bull; {q.chapter}
                  </div>
                  
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 pr-8 leading-snug">
                    <MathJaxRenderer content={q.question} />
                  </div>

                  {q.image_url && (
                    <div className="my-2.5 max-w-full overflow-hidden rounded border border-slate-200/80 dark:border-slate-800 shadow-inner bg-white">
                      <img 
                        src={q.image_url} 
                        alt="Question diagram" 
                        className="max-h-24 w-auto object-contain mx-auto" 
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500 font-medium">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2.5 py-1.5 rounded truncate">
                        <MathJaxRenderer content={opt} />
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                    Correct Option: {q.answer}
                  </div>
                </div>
              ))}
            </div>

            {/* Questions list pagination */}
            {qPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Page {qPage} of {qPages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setQPage((p) => Math.max(p - 1, 1))}
                    disabled={qPage === 1}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded hover:bg-slate-250 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setQPage((p) => Math.min(p + 1, qPages))}
                    disabled={qPage === qPages}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded hover:bg-slate-250 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: ACTIVE SESSIONS                                 */}
      {/* ==================================================== */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Active User Sessions</h2>
            <button
              onClick={fetchSessions}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh Sessions
            </button>
          </div>

          {sessionMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
              {sessionMsg}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No active single-device sessions registered in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Teacher Email</th>
                    <th className="pb-3">Session ID</th>
                    <th className="pb-3">Device Identity</th>
                    <th className="pb-3">Login Timestamp</th>
                    <th className="pb-3 text-center">Terminate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="py-3 font-semibold">{s.email}</td>
                      <td className="py-3 font-mono text-xs">{s.session_id}</td>
                      <td className="py-3 font-mono text-xs">{s.device_id}</td>
                      <td className="py-3 text-xs">{new Date(s.login_time).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleForceLogout(s.email, s.session_id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded text-xs font-bold"
                          title="Force immediate logout of this user"
                        >
                          Force Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: AUDIT LOGS                                      */}
      {/* ==================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold">Security Audit Trail</h2>

            {/* Audit log filters */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filter email..."
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white w-full sm:w-36"
              />
              <input
                type="text"
                placeholder="Filter action..."
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white w-full sm:w-36"
              />
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm relative">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase">
                  <th className="pb-3 bg-white dark:bg-slate-900">Timestamp</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Actor Email</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Action Type</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">IP Address</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Device ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                {auditLogs.map((l) => {
                  const isSuspicious = l.action.includes('unauthorized') || l.action.includes('restricted');
                  return (
                    <tr 
                      key={l._id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-850/50 ${
                        isSuspicious ? 'bg-red-500/5 text-red-500 dark:text-red-400 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 font-sans font-semibold">{l.email}</td>
                      <td className="py-2.5 font-bold uppercase tracking-tight">
                        {isSuspicious ? '⚠️ ' : ''}{l.action}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">{l.ip_address}</td>
                      <td className="py-2.5 font-semibold text-slate-500">{l.device_id.substring(0, 12)}...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
