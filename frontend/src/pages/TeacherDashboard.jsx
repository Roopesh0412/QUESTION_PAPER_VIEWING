import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCcw, ChevronLeft, ChevronRight, Eye, EyeOff, BookOpen, AlertCircle } from 'lucide-react';
import api from '../api';
import MathJaxRenderer from '../components/MathJaxRenderer';

export default function TeacherDashboard() {
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(5); // Show 5 questions per page

  // Filters
  const [search, setSearch] = useState('');
  const [chapter, setChapter] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Track shown answers per question ID
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Get user details
  const [subject, setSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setSubject(u.subject);
      setSelectedSubject(u.subject);
    }
  }, []);

  const fetchChapters = React.useCallback(async () => {
    if (!subject) return;
    try {
      const res = await api.get('/teachers/chapters', {
        params: { subject: selectedSubject }
      });
      setChapters(res.data.chapters);
    } catch (err) {
      console.error('Failed to fetch chapters:', err);
    }
  }, [subject, selectedSubject]);

  const fetchQuestions = React.useCallback(async () => {
    if (!subject) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teachers/questions', {
        params: {
          subject: selectedSubject,
          chapter,
          search,
          page,
          limit
        }
      });
      setQuestions(res.data.questions);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve questions.');
    } finally {
      setLoading(false);
    }
  }, [subject, selectedSubject, chapter, search, page, limit]);

  // Fetch chapters once subject is resolved
  useEffect(() => {
    fetchChapters();
  }, [subject, selectedSubject, fetchChapters]);

  // Refetch questions when filters or page changes
  useEffect(() => {
    fetchQuestions();
  }, [page, selectedSubject, fetchQuestions]);

  // Reset page to 1 when search or chapter filter is applied
  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setChapter(''); // Clear chapter when subject changes, as chapters are subject-specific!
    setPage(1);
  };

  const toggleRevealAnswer = (qId) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setChapter('');
    if (subject === 'All') {
      setSelectedSubject('All');
    }
    setPage(1);
    // State updates won't immediately reflect in fetchQuestions if called synchronously,
    // so we trigger the fetch after resetting params.
    setTimeout(() => {
      fetchQuestions();
    }, 50);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Subject Header Board */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-widest">
              <BookOpen className="w-4 h-4" />
              <span>Assigned Subject Bank</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {subject === 'All' ? 'All Subjects' : subject} Question Bank
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              {subject === 'All' 
                ? 'Access granted to the complete question database across all subjects.' 
                : `Access is limited to ${subject} curriculum materials. All views and restricted action attempts are monitored.`}
            </p>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/50 text-right min-w-[120px]">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Questions</span>
            <span className="text-2xl font-black text-brand-400 font-mono">{total}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <form onSubmit={handleApplyFilters} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        
        {/* Search */}
        <div className="flex-1 w-full">
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1.5">
            Search Questions
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search keywords in questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>
        </div>

        {/* Subject Filter (Only for teachers with 'All' access) */}
        {subject === 'All' && (
          <div className="w-full md:w-64">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1.5">
              Filter by Subject
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <BookOpen className="w-4 h-4" />
              </span>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="block w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white appearance-none cursor-pointer"
              >
                <option value="All">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>
        )}

        {/* Chapter Filter */}
        <div className="w-full md:w-64">
          <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1.5">
            Filter by Chapter
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Filter className="w-4 h-4" />
            </span>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white appearance-none cursor-pointer"
            >
              <option value="">All Chapters</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full md:w-auto gap-2">
          <button
            type="submit"
            className="flex-1 md:flex-initial px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Search
          </button>
          
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5"
            title="Reset Filters"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="md:hidden">Reset</span>
          </button>
        </div>

      </form>

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
            </div>
          ))
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-4xl text-slate-400">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3">No Questions Found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Try adjusting your keyword query or choosing a different chapter filter.
            </p>
          </div>
        ) : (
          // Questions Cards
          questions.map((q, idx) => {
            const displayIndex = (page - 1) * limit + idx + 1;
            const isAnswerRevealed = !!revealedAnswers[q._id];

            return (
              <div 
                key={q._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden"
              >
                
                {/* Top Chapter Tag */}
                <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Chapter: {q.chapter}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    ID: {q._id.substring(0, 8)}
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-4">
                  <div className="text-base font-bold text-slate-950 dark:text-slate-100 leading-relaxed">
                    <span className="text-brand-600 dark:text-brand-400 mr-1">Q{displayIndex}.</span>
                    <MathJaxRenderer content={q.question} className="inline-block" />
                  </div>

                  {/* Optional Image */}
                  {q.image_url && (
                    <div className="my-4 max-w-lg overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
                      <img 
                        src={q.image_url} 
                        alt="Question diagram" 
                        className="max-h-80 w-auto object-contain mx-auto" 
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                    {q.options.map((opt, oIdx) => {
                      return (
                        <div 
                          key={oIdx}
                          className="px-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-sm font-semibold transition-all flex items-center"
                        >
                          <MathJaxRenderer content={opt} className="w-full text-slate-700 dark:text-slate-300" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Key Expandable Drawer */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-between items-center">
                    <button
                      onClick={() => toggleRevealAnswer(q._id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500"
                    >
                      {isAnswerRevealed ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Hide Answer Key</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Show Answer Key</span>
                        </>
                      )}
                    </button>

                    {isAnswerRevealed && (
                      <div className="animate-slide-in px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-extrabold border border-emerald-100 dark:border-emerald-900/30">
                        Correct Option: {q.answer}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {pages > 1 && !loading && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">
            Showing Page <span className="font-mono text-slate-800 dark:text-slate-300">{page}</span> of <span className="font-mono text-slate-800 dark:text-slate-300">{pages}</span> ({total} items total)
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              disabled={page === pages}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
