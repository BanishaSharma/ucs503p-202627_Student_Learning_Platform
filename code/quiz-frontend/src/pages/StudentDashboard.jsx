import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  // REPLACE WITH THIS CODE BLOCK:
  const getFirstName = () => {
    const passedName = location.state?.userName || localStorage.getItem('userName');
    
    if (passedName) {
      return passedName.trim().split(' ')[0]; // Takes "Gurleen" from "Gurleen Kaur"
    }
    
    const passedEmail = location.state?.userEmail || localStorage.getItem('userEmail');
    if (passedEmail && passedEmail.includes('@')) {
      const namePart = passedEmail.split('@')[0];
      const cleaned = namePart.replace(/[0-9._]/g, ''); // Turns "gurleen123" into "gurleen"
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1); // Capitalizes to "Gurleen"
    }

    return 'Student';
  };

  const userName = getFirstName();

  // Navigation & Page Tab States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'progress', 'history'
  
  // Database Hierarchy States
  const [classesList, setClassesList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  
  // Drilldown View States
  const [activeSubject, setActiveSubject] = useState(null);
  const [chaptersList, setChaptersList] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [quizzesList, setQuizzesList] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Quiz Engine Active States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: 'A' | 'B' | 'C' | 'D' }
  const [markedForReview, setMarkedForReview] = useState({}); // { 0: true }
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  
  // Quiz Flow Views & Feedback
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isReviewingMode, setIsReviewingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);

  // Fetch Student Quiz History from Database
  const loadAttemptsHistory = async () => {
    try {
      const res = await fetch('/api/attempts');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHistoryRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to load attempt history from database:', err);
    }
  };

  useEffect(() => {
    loadAttemptsHistory();
  }, []);

  // 1. Fetch Classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        setIsLoading(true);
        setApiError(null);
        const res = await fetch('/api/classes');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setClassesList(json.data);
          setSelectedClassId(json.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes from API:', err);
        setApiError('Unable to connect to backend server. Please verify backend is running on port 5000.');
      } finally {
        setIsLoading(false);
      }
    }
    loadClasses();
  }, []);

  // 2. Fetch Subjects when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) return;
    async function loadSubjects() {
      try {
        setIsLoading(true);
        setApiError(null);
        const res = await fetch(`/api/classes/${selectedClassId}/subjects`);
        const json = await res.json();
        if (json.success) {
          setSubjectsList(json.data || []);
          setActiveSubject(null);
          setActiveChapter(null);
          setActiveQuiz(null);
        }
      } catch (err) {
        console.error('Failed to load subjects from API:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSubjects();
  }, [selectedClassId]);

  // 3. Fetch Chapters when activeSubject changes
  useEffect(() => {
    if (!activeSubject) {
      setChaptersList([]);
      return;
    }
    async function loadChapters() {
      try {
        setIsLoading(true);
        setApiError(null);
        const res = await fetch(`/api/subjects/${activeSubject.id}/chapters`);
        const json = await res.json();
        if (json.success) {
          setChaptersList(json.data || []);
          setActiveChapter(null);
          setActiveQuiz(null);
        }
      } catch (err) {
        console.error('Failed to load chapters from API:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChapters();
  }, [activeSubject]);

  // 4. Fetch Quizzes when activeChapter changes
  useEffect(() => {
    if (!activeChapter) {
      setQuizzesList([]);
      return;
    }
    async function loadQuizzes() {
      try {
        setIsLoading(true);
        setApiError(null);
        const res = await fetch(`/api/chapters/${activeChapter.id}/quizzes`);
        const json = await res.json();
        if (json.success) {
          setQuizzesList(json.data || []);
          setActiveQuiz(null);
        }
      } catch (err) {
        console.error('Failed to load quizzes from API:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, [activeChapter]);

  // Active Timer Effect
  useEffect(() => {
    let timer;
    if (isQuizRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isQuizRunning) {
      handleFinalSubmission();
    }
    return () => clearInterval(timer);
  }, [isQuizRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // State Updates & Auto-Save Simulation
  const handleSelectOption = (optKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optKey
    }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const handleStartQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/questions`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const formatted = json.data.map((q) => ({
          id: q.id,
          question: q.questionText,
          options: [
            { key: 'A', text: q.optionA },
            { key: 'B', text: q.optionB },
            { key: 'C', text: q.optionC },
            { key: 'D', text: q.optionD }
          ]
        }));
        setQuizQuestions(formatted);
        setIsQuizRunning(true);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setMarkedForReview({});
        setTimeLeft((activeQuiz.durationMinutes || 10) * 60);
        setQuizResult(null);
        setIsReviewingMode(false);
      } else {
        alert('No questions configured for this quiz.');
      }
    } catch (err) {
      console.error('Failed to load quiz questions from API:', err);
      alert('Failed to load quiz questions. Please verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmission = async () => {
    if (!activeQuiz) return;
    try {
      setIsSubmitting(true);
      const answersPayload = quizQuestions.map((q, idx) => {
        const chosen = userAnswers[idx];
        return chosen ? { questionId: q.id, selectedAnswer: chosen } : null;
      }).filter(Boolean);

      const res = await fetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload, studentId: 1 })
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Submission failed');
      }

      const attempt = json.data;
      const total = attempt.totalQuestions;
      const correctCount = attempt.score;
      const attemptedCount = answersPayload.length;
      const wrong = attemptedCount - correctCount;
      const unattempted = total - attemptedCount;
      const totalSeconds = (activeQuiz.durationMinutes || 10) * 60;
      const timeSpentSeconds = Math.max(0, totalSeconds - timeLeft);

      const evaluationPayload = {
        attemptId: attempt.attemptId,
        score: correctCount,
        totalQuestions: total,
        percentage: attempt.percentage,
        correctAnswers: correctCount,
        wrongAnswers: Math.max(0, wrong),
        unattempted: Math.max(0, unattempted),
        timeTaken: formatTime(timeSpentSeconds),
        date: new Date().toISOString().split('T')[0],
        answers: attempt.answers || []
      };

      setQuizResult(evaluationPayload);
      setIsQuizRunning(false);
      setShowSubmitModal(false);

      // Refresh history records directly from database
      await loadAttemptsHistory();
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { title: 'Excellent! 🌟', desc: 'Outstanding work! You have mastered this material.', color: 'text-green-600' };
    if (percentage >= 70) return { title: 'Great Job! 🎉', desc: 'Solid performance! Keep up the good work.', color: 'text-blue-600' };
    if (percentage >= 50) return { title: 'Good Effort! 👍', desc: 'You passed, but reviewing weak concepts will help.', color: 'text-amber-600' };
    return { title: 'Keep Practicing! 💪', desc: 'Don\'t give up. Review the answers below and try again.', color: 'text-red-500' };
  };

  const getSubjectIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('math')) return '📘';
    if (lower.includes('scien')) return '🔬';
    if (lower.includes('eng')) return '📕';
    if (lower.includes('social') || lower.includes('hist') || lower.includes('geo')) return '🌍';
    return '📚';
  };

  const filteredSubjects = selectedSubjectFilter === 'All' 
    ? subjectsList
    : subjectsList.filter((s) => s.name === selectedSubjectFilter);

  // Status counters for confirmation modal
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = Math.max(0, quizQuestions.length - answeredCount);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      
      {/* GLOBAL HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Hello, {userName}! 👏</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ready to level up your score today?</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Main Navigation Tabs */}
          {!isQuizRunning && !quizResult && (
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button 
                onClick={() => { setActiveTab('dashboard'); setActiveSubject(null); setActiveChapter(null); setActiveQuiz(null); }}
                className={`px-3 py-2 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('progress')}
                className={`px-3 py-2 rounded-lg transition ${activeTab === 'progress' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'}`}
              >
                My Progress
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 rounded-lg transition ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Quiz History
              </button>
            </div>
          )}

          <button 
            onClick={() => navigate('/')}
            className="bg-red-500 text-white px-3.5 py-2 rounded-xl hover:bg-red-600 transition font-semibold text-xs shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 1. ACTIVE QUIZ ENGINE VIEW                                          */}
      {/* ------------------------------------------------------------------- */}
      {isQuizRunning && quizQuestions.length > 0 && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Top Bar */}
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
            <div>
              <h2 className="font-bold text-base md:text-lg">{activeChapter?.name || activeChapter}: {activeQuiz?.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Question <span className="text-white font-bold">{currentQuestionIndex + 1}</span> of {quizQuestions.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700 text-amber-400 font-mono font-bold text-sm">
                ⏳ {formatTime(timeLeft)}
              </div>
              <button 
                onClick={() => setShowExitModal(true)}
                className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[480px]">
            
            {/* Main Question Workspace */}
            <div className="lg:col-span-3 p-6 md:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
              <div>
                {/* Status Bar Indicator */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Question {currentQuestionIndex + 1}
                  </span>
                  {markedForReview[currentQuestionIndex] && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                      🟡 Marked for Review
                    </span>
                  )}
                </div>

                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                  {quizQuestions[currentQuestionIndex]?.question}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-3 mb-6">
                  {quizQuestions[currentQuestionIndex]?.options?.map((option) => {
                    const isSelected = userAnswers[currentQuestionIndex] === option.key;
                    return (
                      <div 
                        key={option.key}
                        onClick={() => handleSelectOption(option.key)}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/60 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {option.key}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700 font-medium'}`}>
                            {option.text}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-6 border-t border-slate-100">
                <button
                  onClick={toggleMarkForReview}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    markedForReview[currentQuestionIndex]
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {markedForReview[currentQuestionIndex] ? '📌 Unmark Review' : '🔖 Mark for Review'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-sm"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Navigation Palette Side Panel */}
            <div className="p-6 bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Question Navigator</h4>
                
                <div className="grid grid-cols-5 gap-2.5 mb-6">
                  {quizQuestions.map((_, idx) => {
                    const isCurrent = currentQuestionIndex === idx;
                    const isAnswered = userAnswers[idx] !== undefined;
                    const isMarked = markedForReview[idx];

                    let btnStyles = "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    if (isAnswered) btnStyles = "bg-green-600 border-green-600 text-white font-bold";
                    if (isMarked) btnStyles = "bg-amber-400 border-amber-500 text-amber-950 font-bold";
                    if (isCurrent) btnStyles += " ring-2 ring-blue-600 ring-offset-2";

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-10 rounded-xl border text-xs flex items-center justify-center transition shadow-xs ${btnStyles}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend Key */}
                <div className="space-y-2 border-t border-slate-200 pt-4 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block"></span>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                    <span>Current Question</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSubmitModal(true)}
                className="w-full mt-6 bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition"
              >
                Submit Quiz Now
              </button>
            </div>
          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Are you sure you want to submit?</h3>
                <p className="text-xs text-slate-500 mb-6">Your answers will be graded server-side against the database.</p>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 mb-6 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Answered</p>
                    <p className="text-lg font-bold text-green-600">{answeredCount} / {quizQuestions.length}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Unanswered</p>
                    <p className="text-lg font-bold text-red-500">{unattemptedCount}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">In Review</p>
                    <p className="text-lg font-bold text-amber-500">{reviewCount}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSubmitModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 disabled:opacity-50"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleFinalSubmission}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Evaluating...' : 'Yes, Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exit Modal */}
          {showExitModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Exit Quiz Attempt?</h3>
                <p className="text-xs text-slate-500 mb-6">Your recorded responses for this session will not be saved.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { setShowExitModal(false); setIsQuizRunning(false); }}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-xs hover:bg-red-600"
                  >
                    Exit Quiz
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. QUIZ RESULT SCREEN                                               */}
      {/* ------------------------------------------------------------------- */}
      {quizResult && !isReviewingMode && (
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Quiz Completed!</h2>
          <p className="text-slate-500 text-xs mt-1 mb-8">Official score verified and saved to database</p>

          {/* Performance Badge Banner */}
          {(() => {
            const msg = getPerformanceMessage(quizResult.percentage);
            return (
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl mb-8">
                <h3 className={`text-xl font-bold ${msg.color}`}>{msg.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{msg.desc}</p>
              </div>
            );
          })()}

          {/* Big Score Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-xs font-bold text-blue-600 uppercase">Score</p>
              <h4 className="text-2xl font-black text-blue-900 mt-1">{quizResult.score} / {quizResult.totalQuestions}</h4>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-xs font-bold text-blue-600 uppercase">Percentage</p>
              <h4 className="text-2xl font-black text-blue-900 mt-1">{quizResult.percentage}%</h4>
            </div>
          </div>

          {/* Detailed Statistics Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 mb-8 text-center text-xs">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Correct</p>
              <p className="text-base font-bold text-green-600 mt-0.5">{quizResult.correctAnswers}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Wrong</p>
              <p className="text-base font-bold text-red-500 mt-0.5">{quizResult.wrongAnswers}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Unattempted</p>
              <p className="text-base font-bold text-slate-600 mt-0.5">{quizResult.unattempted}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Time Taken</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{quizResult.timeTaken}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setIsReviewingMode(true)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm"
            >
              📖 Review Answers
            </button>
            <button 
              onClick={handleStartQuiz}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition border border-slate-200"
            >
              🔄 Retake Quiz
            </button>
            <button 
              onClick={() => { setQuizResult(null); setActiveQuiz(null); }}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition border border-slate-200"
            >
              ← Back to Chapter
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. ANSWER REVIEW PAGE                                               */}
      {/* ------------------------------------------------------------------- */}
      {quizResult && isReviewingMode && (
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Answer Review</h2>
              <p className="text-xs text-slate-500">Database verified solutions and answers</p>
            </div>
            <button 
              onClick={() => setIsReviewingMode(false)}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 border border-slate-200"
            >
              ← Back to Summary
            </button>
          </div>

          <div className="space-y-6">
            {quizQuestions.map((q, idx) => {
              const evalAns = (quizResult.answers || []).find((a) => a.questionId === q.id);
              const userChoice = userAnswers[idx];
              const isCorrect = evalAns ? evalAns.isCorrect : false;
              const isUnattempted = userChoice === undefined;
              const correctChoiceKey = evalAns?.correctAnswer;

              return (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-bold uppercase text-slate-400">Question {idx + 1}</span>
                    {isCorrect && <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Correct ✅</span>}
                    {!isCorrect && !isUnattempted && <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">Wrong ❌</span>}
                    {isUnattempted && <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">Unattempted ⚪</span>}
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm mb-4">{q.question}</h4>

                  <div className="space-y-2 text-xs mb-4">
                    {q.options?.map((opt) => {
                      let optionStyle = "bg-white border-slate-200 text-slate-700";
                      if (opt.key === correctChoiceKey) optionStyle = "bg-green-50 border-green-500 text-green-900 font-bold";
                      if (userChoice === opt.key && !isCorrect) optionStyle = "bg-red-50 border-red-400 text-red-900 font-bold";

                      return (
                        <div key={opt.key} className={`p-3 rounded-xl border flex justify-between items-center ${optionStyle}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {opt.key === correctChoiceKey && <span className="font-bold text-green-700">Correct Choice ✅</span>}
                          {userChoice === opt.key && !isCorrect && <span className="font-bold text-red-600">Your Choice ❌</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl text-xs text-blue-950">
                    <strong className="block font-bold text-blue-900 mb-1">💡 Solution Key:</strong>
                    Correct Option: <span className="font-bold text-blue-950">Option {correctChoiceKey}</span> (verified by server).
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. MAIN DASHBOARD CONTENT                                           */}
      {/* ------------------------------------------------------------------- */}
      {!isQuizRunning && !quizResult && activeTab === 'dashboard' && (
        <>
          {/* API Connection Warning / Error Banner */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-6 flex justify-between items-center shadow-xs">
              <span>⚠️ {apiError}</span>
              <button onClick={() => window.location.reload()} className="underline font-bold hover:text-red-900">
                Retry Connection
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && !isQuizRunning && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>Fetching live curriculum from PostgreSQL database...</span>
            </div>
          )}

          {/* Curriculum Selection Bar */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Select Curriculum</h3>
              <p className="text-xs text-slate-500">Filter subjects and educational tiers from database</p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class Level</label>
                <select 
                  value={selectedClassId || ''} 
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  {classesList.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject Filter</label>
                <select 
                  value={selectedSubjectFilter} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSubjectFilter(val);
                    if (val === 'All') {
                      setActiveSubject(null);
                    } else {
                      const matched = subjectsList.find((s) => s.name === val);
                      setActiveSubject(matched || null);
                    }
                    setActiveChapter(null);
                    setActiveQuiz(null);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="All">All Subjects</option>
                  {Array.from(new Set(subjectsList.map((s) => s.name))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Root Level Overview Cards */}
          {!activeSubject && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">📊</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Quizzes Attempted</p>
                  <h3 className="text-xl font-bold text-slate-800 mt-0.5">{historyRecords.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Average Score</p>
                  <h3 className="text-xl font-bold text-blue-600 mt-0.5">
                    {historyRecords.length > 0 
                      ? Math.round(historyRecords.reduce((acc, r) => acc + (r.percentage || 0), 0) / historyRecords.length) + '%'
                      : '100%'}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">🔥</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Streak</p>
                  <h3 className="text-xl font-bold text-amber-600 mt-0.5">5 Days</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">📚</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Subjects Available</p>
                  <h3 className="text-xl font-bold text-indigo-600 mt-0.5">{subjectsList.length}</h3>
                </div>
              </div>

              {/* Continue Banner */}
              {subjectsList.length > 0 && (
                <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-blue-200 mb-1">Active Curriculum</p>
                    <h2 className="text-lg font-bold">
                      {classesList.find((c) => c.id === Number(selectedClassId))?.name || 'Curriculum'} — {subjectsList[0]?.name}
                    </h2>
                    <p className="text-blue-100 text-xs">Jump straight into chapters and interactive assessments</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveSubject(subjectsList[0]);
                      setActiveChapter(null);
                      setActiveQuiz(null);
                    }}
                    className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm"
                  >
                    Explore Subject →
                  </button>
                </div>
              )}

              {/* Subject Grid */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Subjects</h2>
                <p className="text-slate-500 text-xs mb-4">Select a subject card to view chapters and quizzes</p>

                {filteredSubjects.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-xs border border-slate-200">
                    No subjects found for this class tier.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredSubjects.map((subj) => (
                      <div 
                        key={subj.id} 
                        onClick={() => {
                          setActiveSubject(subj);
                          setActiveChapter(null);
                          setActiveQuiz(null);
                        }}
                        className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col items-start group"
                      >
                        <div className="text-3xl mb-3 p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50">{getSubjectIcon(subj.name)}</div>
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600">{subj.name}</h3>
                        <span className="text-xs text-blue-600 font-semibold mt-2">View Chapters →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Chapters Level */}
          {activeSubject && !activeChapter && (
            <div>
              <button 
                onClick={() => {
                  setActiveSubject(null);
                  setActiveChapter(null);
                  setActiveQuiz(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-3 block cursor-pointer"
              >
                ← Back to All Subjects
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {activeSubject.name} — {classesList.find((c) => c.id === Number(selectedClassId))?.name || 'Class'}
              </h2>
              <p className="text-slate-500 text-xs mb-6">Select a chapter to explore practice quizzes</p>

              {chaptersList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-xs border border-slate-200">
                  No chapters registered for {activeSubject.name} yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {chaptersList.map((chap) => (
                    <div key={chap.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Chapter {chap.id}</p>
                        <h3 className="font-bold text-slate-800 text-base mt-1 mb-2">{chap.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">📝 Practice assessments available</p>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveChapter(chap);
                          setActiveQuiz(null);
                        }}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        View Chapter Quizzes →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quiz Selection Level */}
          {activeChapter && !activeQuiz && (
            <div>
              <button 
                onClick={() => {
                  setActiveChapter(null);
                  setActiveQuiz(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-3 block cursor-pointer"
              >
                ← Back to Chapters
              </button>
              <h2 className="text-xl font-bold text-slate-800">{activeChapter.name} — Practice Quizzes</h2>
              <p className="text-slate-500 text-xs mb-6">Select a quiz to test your mastery</p>

              {quizzesList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center text-slate-500 text-xs border border-slate-200">
                  No quizzes configured for this chapter yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {quizzesList.map((quiz) => (
                    <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                            🟢 Standard
                          </span>
                          <span className="text-xs font-semibold text-green-600">Total: {quiz.totalMarks} Marks</span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-base mb-4">{quiz.title}</h3>

                        <div className="space-y-1.5 text-xs text-slate-600 mb-6">
                          <p>❓ <strong>Total Marks:</strong> {quiz.totalMarks}</p>
                          <p>⏱️ <strong>Time:</strong> {quiz.durationMinutes} mins</p>
                          <p>🎯 <strong>Passing Score:</strong> 60%</p>
                          <p>🔄 <strong>Attempts:</strong> Unlimited</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveQuiz(quiz)}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
                      >
                        Select Quiz
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions Level */}
          {activeQuiz && !isQuizRunning && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-slate-200">
              <button 
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-4 block cursor-pointer"
              >
                ← Back to Quiz Selection
              </button>

              <h2 className="text-2xl font-bold text-slate-800 mb-1">{activeChapter?.name}: {activeQuiz.title}</h2>
              <p className="text-slate-500 text-xs mb-6">Read instructions before starting the timer.</p>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl mb-6 text-center border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Marks</p>
                  <p className="text-base font-bold text-slate-800">{activeQuiz.totalMarks}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
                  <p className="text-base font-bold text-slate-800">{activeQuiz.durationMinutes} mins</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Passing</p>
                  <p className="text-base font-bold text-blue-600">60%</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Instructions</h3>
                <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <li>Read every question carefully before choosing your answer.</li>
                  <li>Use the right side navigator grid to review or mark questions.</li>
                  <li>Answers auto-save immediately to frontend state upon selection.</li>
                  <li>Ensure you submit before the timer expires. Submissions are scored against the database.</li>
                </ul>
              </div>

              <button 
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Loading Questions...' : "I'm Ready - Start Quiz"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5. STUDENT PROGRESS TAB                                             */}
      {/* ------------------------------------------------------------------- */}
      {!isQuizRunning && !quizResult && activeTab === 'progress' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Overall Performance</h2>
            <p className="text-xs text-slate-500 mb-4">Calculated across all completed database attempts</p>
            {historyRecords.length === 0 ? (
              <p className="text-xs text-slate-400">No attempts yet. Complete quizzes to view your overall performance analytics.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.round(historyRecords.reduce((acc, r) => acc + (r.percentage || 0), 0) / historyRecords.length)}%` 
                    }}
                  ></div>
                </div>
                <span className="font-bold text-blue-600 text-sm">
                  {Math.round(historyRecords.reduce((acc, r) => acc + (r.percentage || 0), 0) / historyRecords.length)}%
                </span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4">Subject-wise Performance</h3>
            {historyRecords.length === 0 ? (
              <p className="text-xs text-slate-400">No subject quiz attempts recorded in database yet.</p>
            ) : (
              <div className="space-y-4 text-xs">
                {(() => {
                  const subjectStats = {};
                  historyRecords.forEach((r) => {
                    const sName = r.subjectName || r.subject || 'Curriculum';
                    if (!subjectStats[sName]) subjectStats[sName] = { totalPct: 0, count: 0 };
                    subjectStats[sName].totalPct += (r.percentage || 0);
                    subjectStats[sName].count += 1;
                  });
                  return Object.entries(subjectStats).map(([sName, stat]) => {
                    const avg = Math.round(stat.totalPct / stat.count);
                    return (
                      <div key={sName}>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>{sName}</span>
                          <span className="text-blue-600 font-bold">{avg}% ({stat.count} attempt{stat.count > 1 ? 's' : ''})</span>
                        </div>
                        <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${avg}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4">Chapter Mastery Breakdown</h3>
            {historyRecords.length === 0 ? (
              <p className="text-xs text-slate-400">No chapter quiz attempts recorded in database yet.</p>
            ) : (
              <div className="space-y-4 text-xs">
                {(() => {
                  const chapterStats = {};
                  historyRecords.forEach((r) => {
                    const cName = r.chapterName || r.quizTitle || 'Chapter';
                    if (!chapterStats[cName]) chapterStats[cName] = { totalPct: 0, count: 0 };
                    chapterStats[cName].totalPct += (r.percentage || 0);
                    chapterStats[cName].count += 1;
                  });
                  return Object.entries(chapterStats).map(([cName, stat]) => {
                    const avg = Math.round(stat.totalPct / stat.count);
                    const color = avg >= 70 ? 'bg-green-600' : avg >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={cName}>
                        <div className="flex justify-between font-semibold mb-1">
                          <span>{cName}</span>
                          <span className="text-slate-700 font-bold">{avg}%</span>
                        </div>
                        <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`${color} h-full transition-all duration-500`} style={{ width: `${avg}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. QUIZ HISTORY TAB                                                 */}
      {/* ------------------------------------------------------------------- */}
      {!isQuizRunning && !quizResult && activeTab === 'history' && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Quiz History</h2>
          <p className="text-xs text-slate-500 mb-6">Live exam attempts and evaluation scores from PostgreSQL database</p>

          {historyRecords.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500">No quiz attempts recorded in the database yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Start a quiz from the dashboard to test your skills!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase">
                    <th className="p-3">Quiz Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.map((rec) => {
                    const displayDate = rec.attemptedAt ? new Date(rec.attemptedAt).toLocaleDateString() : (rec.date || 'Recent');
                    const displaySubject = rec.subjectName || rec.subject || 'Curriculum';
                    const isPassed = (rec.percentage || 0) >= 60;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-800">{rec.quizTitle}</td>
                        <td className="p-3 text-slate-600">{displaySubject}</td>
                        <td className="p-3 text-slate-500">{displayDate}</td>
                        <td className="p-3 font-bold text-blue-600">{rec.score}/{rec.totalQuestions} ({rec.percentage}%)</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPassed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isPassed ? 'Passed' : 'Needs Practice'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}