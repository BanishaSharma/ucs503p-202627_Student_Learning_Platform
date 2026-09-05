import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { user, apiFetch, language, t } = useAuth();

  // Navigation & Page Tab States
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'history' | 'doubts'

  // Curriculum Hierarchy States
  const [classesList, setClassesList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chaptersList, setChaptersList] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [quizzesList, setQuizzesList] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);

  // Quiz Engine Active States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [index]: 'A' | 'B' | 'C' | 'D' }
  const [markedForReview, setMarkedForReview] = useState({}); // { [index]: boolean }
  const [timeLeft, setTimeLeft] = useState(600);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isReviewingMode, setIsReviewingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Attempt History
  const [historyRecords, setHistoryRecords] = useState([]);

  // Doubts State
  const [doubtsList, setDoubtsList] = useState([]);
  const [doubtSubjectId, setDoubtSubjectId] = useState('');
  const [doubtTitle, setDoubtTitle] = useState('');
  const [doubtDescription, setDoubtDescription] = useState('');
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [doubtToast, setDoubtToast] = useState(null);

  // 1. Fetch Classes on mount (scoped to student's class)
  useEffect(() => {
    async function loadClasses() {
      try {
        setIsLoading(true);
        const res = await apiFetch('/api/classes');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setClassesList(json.data);
          setSelectedClassId(json.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
        setApiError('Unable to load curriculum. Please check server connection.');
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
        const res = await apiFetch(`/api/classes/${selectedClassId}/subjects`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSubjectsList(json.data);
          if (json.data.length > 0) {
            setSelectedSubject(json.data[0]);
            setDoubtSubjectId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSubjects();
  }, [selectedClassId]);

  // 3. Fetch Chapters when selectedSubject changes
  useEffect(() => {
    if (!selectedSubject) {
      setChaptersList([]);
      return;
    }
    async function loadChapters() {
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/subjects/${selectedSubject.id}/chapters`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setChaptersList(json.data);
          if (json.data.length > 0) {
            setSelectedChapter(json.data[0]);
          } else {
            setSelectedChapter(null);
            setQuizzesList([]);
          }
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChapters();
  }, [selectedSubject]);

  // 4. Fetch Quizzes when selectedChapter changes
  useEffect(() => {
    if (!selectedChapter) {
      setQuizzesList([]);
      return;
    }
    async function loadQuizzes() {
      try {
        setIsLoading(true);
        const res = await apiFetch(`/api/chapters/${selectedChapter.id}/quizzes`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setQuizzesList(json.data);
        }
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, [selectedChapter]);

  // Load history records
  const loadAttemptsHistory = async () => {
    try {
      const res = await apiFetch('/api/attempts');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHistoryRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to load attempt history:', err);
    }
  };

  // Load student doubts
  const loadStudentDoubts = async () => {
    try {
      const res = await apiFetch('/api/queries');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDoubtsList(json.data);
      }
    } catch (err) {
      console.error('Failed to load student doubts:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') loadAttemptsHistory();
    if (activeTab === 'doubts') loadStudentDoubts();
  }, [activeTab]);

  // Active Timer Effect for Quiz
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

  // Start Quiz Handler
  const handleStartQuiz = async (quiz) => {
    try {
      setIsLoading(true);
      setActiveQuiz(quiz);
      const res = await apiFetch(`/api/quizzes/${quiz.id}/questions`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setQuizQuestions(json.data);
        setIsQuizRunning(true);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setMarkedForReview({});
        setTimeLeft((quiz.durationMinutes || 10) * 60);
        setQuizResult(null);
        setIsReviewingMode(false);
      } else {
        alert('This quiz currently has no questions assigned.');
      }
    } catch (err) {
      alert('Failed to load questions for quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  // Option selection
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

  // Submit Quiz
  const handleFinalSubmission = async () => {
    if (!activeQuiz) return;
    try {
      setIsSubmitting(true);
      const answersPayload = quizQuestions.map((q, idx) => {
        const chosen = userAnswers[idx];
        return chosen ? { questionId: q.id, selectedAnswer: chosen } : null;
      }).filter(Boolean);

      const res = await apiFetch(`/api/quizzes/${activeQuiz.id}/attempts`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersPayload })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setQuizResult(json.data);
        setIsQuizRunning(false);
        setShowSubmitModal(false);
        loadAttemptsHistory();
      } else {
        alert(json.error || 'Failed to submit quiz.');
      }
    } catch (err) {
      alert('Network error while submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Doubt
  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    if (!doubtTitle.trim() || !doubtDescription.trim()) return;

    setIsSubmittingDoubt(true);
    try {
      const res = await apiFetch('/api/queries', {
        method: 'POST',
        body: JSON.stringify({
          subjectId: doubtSubjectId ? Number(doubtSubjectId) : undefined,
          chapterId: selectedChapter ? Number(selectedChapter.id) : undefined,
          title: doubtTitle.trim(),
          description: doubtDescription.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setDoubtTitle('');
        setDoubtDescription('');
        setDoubtToast('Doubt submitted to your subject teacher successfully!');
        loadStudentDoubts();
      } else {
        alert(json.error || 'Failed to submit doubt.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  // Get current question localized text
  const getCurrentQuestionText = (q) => {
    if (!q) return '';
    if (language === 'pa' && q.questionTextPa) return q.questionTextPa;
    return q.questionText;
  };

  const getOptionText = (q, key) => {
    if (!q) return '';
    if (language === 'pa') {
      if (key === 'A' && q.optionAPa) return q.optionAPa;
      if (key === 'B' && q.optionBPa) return q.optionBPa;
      if (key === 'C' && q.optionCPa) return q.optionCPa;
      if (key === 'D' && q.optionDPa) return q.optionDPa;
    }
    if (key === 'A') return q.optionA;
    if (key === 'B') return q.optionB;
    if (key === 'C') return q.optionC;
    if (key === 'D') return q.optionD;
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Student Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {t('welcome')}, {user?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                {user?.className || 'Class 8'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enrolled Punjab State Government School Curriculum
            </p>
          </div>

          {/* Navigation Tabs */}
          {!isQuizRunning && !quizResult && (
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'quizzes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📚 {t('quizzes')}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📜 {t('history')} ({historyRecords.length})
              </button>
              <button
                onClick={() => setActiveTab('doubts')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'doubts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💬 {t('doubts')} ({doubtsList.length})
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: ACTIVE QUIZ ENGINE */}
        {/* ------------------------------------------------------------- */}
        {isQuizRunning && quizQuestions.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 md:p-8 space-y-6">
            {/* Quiz Header Bar */}
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedSubject?.name} • {selectedChapter?.name}
                </span>
                <h3 className="text-lg font-black text-slate-900">{activeQuiz?.title}</h3>
              </div>

              <div className="flex items-center space-x-3">
                {/* Timer Pill */}
                <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-sm flex items-center space-x-1.5 ${
                  timeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span>⏱️</span>
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md transition"
                >
                  {t('submitQuiz')}
                </button>
              </div>
            </div>

            {/* Question Progress Grid */}
            <div className="flex flex-wrap gap-1.5 pb-2">
              {quizQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    currentQuestionIndex === idx
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : userAnswers[idx]
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : markedForReview[idx]
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Current Question */}
            {(() => {
              const currentQ = quizQuestions[currentQuestionIndex];
              return (
                <div className="space-y-6 pt-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400">
                      {t('question')} {currentQuestionIndex + 1} {t('of')} {quizQuestions.length}
                    </span>
                    <button
                      type="button"
                      onClick={toggleMarkForReview}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                        markedForReview[currentQuestionIndex]
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      🚩 {markedForReview[currentQuestionIndex] ? t('marked') : t('markForReview')}
                    </button>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {getCurrentQuestionText(currentQ)}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {['A', 'B', 'C', 'D'].map((optKey) => {
                      const isSelected = userAnswers[currentQuestionIndex] === optKey;
                      const text = getOptionText(currentQ, optKey);
                      return (
                        <button
                          key={optKey}
                          onClick={() => handleSelectOption(optKey)}
                          className={`p-4 rounded-2xl text-left text-xs sm:text-sm font-semibold border-2 transition flex items-center space-x-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {optKey}
                          </div>
                          <span className="flex-1">{text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition"
                    >
                      ← {t('previous')}
                    </button>

                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
                      >
                        {t('next')} →
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition"
                      >
                        {t('submitQuiz')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: QUIZ RESULT SCORECARD */}
        {/* ------------------------------------------------------------- */}
        {quizResult && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-2xl mx-auto space-y-6 text-center">
            <div className="text-5xl mb-2">
              {quizResult.percentage >= 50 ? '🏆' : '📚'}
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              {t('quizCompleted')}
            </h3>
            <p className="text-xs text-slate-400">
              {activeQuiz?.title} • {selectedSubject?.name}
            </p>

            <div className="grid grid-cols-3 gap-3 py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <div className="text-2xl font-black text-blue-600">
                  {quizResult.score} / {quizResult.totalMarks}
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mt-1">{t('yourScore')}</div>
              </div>
              <div>
                <div className="text-2xl font-black text-purple-600">
                  {quizResult.percentage}%
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mt-1">{t('percentage')}</div>
              </div>
              <div>
                <div className={`text-2xl font-black ${quizResult.percentage >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {quizResult.percentage >= 50 ? t('passed') : t('needsPractice')}
                </div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mt-1">{t('status')}</div>
              </div>
            </div>

            {/* Answer Breakdown */}
            {quizResult.results && (
              <div className="text-left space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{t('reviewAnswers')}</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                  {quizResult.results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                        r.isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                      }`}
                    >
                      <span className="font-bold text-slate-700">Q{idx + 1}</span>
                      <span>
                        Your answer: <strong className="font-mono">{r.selectedAnswer || 'None'}</strong> | Correct: <strong className="font-mono text-emerald-700">{r.correctAnswer}</strong>
                      </span>
                      <span>{r.isCorrect ? '✅ (+1)' : '❌ (0)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setQuizResult(null);
                setActiveQuiz(null);
                setActiveTab('quizzes');
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              {t('backToDashboard')}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: CURRICULUM BROWSER & QUIZ LIST (DEFAULT) */}
        {/* ------------------------------------------------------------- */}
        {!isQuizRunning && !quizResult && activeTab === 'quizzes' && (
          <div className="space-y-6">
            {/* Subject Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {subjectsList.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                    selectedSubject?.id === subj.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {subj.name}
                </button>
              ))}
            </div>

            {/* Main Curriculum Two-Column View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Chapters */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">{t('chapters')}</h3>
                  <span className="text-[11px] text-slate-400 font-semibold">{chaptersList.length} total</span>
                </div>

                <div className="space-y-1.5">
                  {chaptersList.length === 0 ? (
                    <div className="text-xs text-slate-400 py-6 text-center">No chapters found for this subject.</div>
                  ) : (
                    chaptersList.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedChapter(ch)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex justify-between items-center ${
                          selectedChapter?.id === ch.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span className="truncate flex-1">{ch.name}</span>
                        <span>→</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Quizzes in Selected Chapter */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedChapter?.name || t('quizzesAvailable')}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedSubject?.name} • Class-scoped assessments</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {quizzesList.length} {t('quizzes')}
                  </span>
                </div>

                <div className="space-y-3">
                  {quizzesList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      {t('noQuizzes')}
                    </div>
                  ) : (
                    quizzesList.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                          <p className="text-xs text-slate-500">
                            {quiz.description || 'Comprehensive curriculum assessment'}
                          </p>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                            <span>⏱️ {quiz.durationMinutes} {t('minutes')}</span>
                            <span>•</span>
                            <span>🎯 {quiz.totalMarks} {t('marks')}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer whitespace-nowrap"
                        >
                          {t('startQuiz')} →
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: STUDENT ATTEMPT HISTORY */}
        {/* ------------------------------------------------------------- */}
        {!isQuizRunning && !quizResult && activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Attempt History</h3>
              <p className="text-xs text-slate-400">Your recorded scores and evaluations</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Quiz</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Percentage</th>
                    <th className="px-6 py-3">Result</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No quiz attempts recorded yet. Start a quiz from the curriculum!
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4 font-bold text-slate-900">{att.quizTitle}</td>
                        <td className="px-6 py-4 text-slate-600">{att.subjectName}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{att.score} / {att.totalMarks}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{att.percentage}%</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              att.percentage >= 50
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {att.percentage >= 50 ? t('passed') : t('needsPractice')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">
                          {new Date(att.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: DOUBTS & INQUIRIES */}
        {/* ------------------------------------------------------------- */}
        {!isQuizRunning && !quizResult && activeTab === 'doubts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ask Doubt Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t('askTeacher')}</h3>
                <p className="text-xs text-slate-400">{t('askTeacherDesc')}</p>
              </div>

              {doubtToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  {doubtToast}
                </div>
              )}

              <form onSubmit={handleSubmitDoubt} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">{t('selectSubject')}</label>
                  <select
                    value={doubtSubjectId}
                    onChange={(e) => setDoubtSubjectId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">{t('doubtTitle')}</label>
                  <input
                    type="text"
                    required
                    value={doubtTitle}
                    onChange={(e) => setDoubtTitle(e.target.value)}
                    placeholder={t('doubtTitlePlaceholder')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">{t('doubtDesc')}</label>
                  <textarea
                    rows={4}
                    required
                    value={doubtDescription}
                    onChange={(e) => setDoubtDescription(e.target.value)}
                    placeholder={t('doubtDescPlaceholder')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingDoubt}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDoubt ? 'Submitting...' : t('submitDoubt')}
                </button>
              </form>
            </div>

            {/* Doubts Thread List */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm">{t('myDoubts')}</h3>
                <p className="text-xs text-slate-400">Track questions sent to your teachers and view their answers</p>
              </div>

              {doubtsList.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
                  {t('noDoubtsYet')}
                </div>
              ) : (
                doubtsList.map((d) => (
                  <div key={d.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-sm">{d.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {d.status === 'resolved' ? t('resolved') : t('open')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {d.subjectName || 'General'} • {new Date(d.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-100">
                      {d.description}
                    </div>

                    {/* Teacher responses */}
                    {d.responses && d.responses.length > 0 ? (
                      <div className="space-y-2 pl-4 border-l-2 border-emerald-200">
                        {d.responses.map((resp) => (
                          <div key={resp.id} className="p-3 bg-emerald-50/60 rounded-xl text-xs border border-emerald-100">
                            <div className="flex justify-between text-[10px] text-emerald-900 font-bold mb-1">
                              <span>👩‍🏫 {resp.responderName} ({resp.responderRole})</span>
                              <span className="text-slate-400">{new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-slate-800">{resp.responseText}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        ⏳ {t('waitingForReply')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
              <div className="text-4xl">📝</div>
              <h3 className="font-bold text-slate-900 text-base">{t('submitQuiz')}</h3>
              <p className="text-xs text-slate-500">{t('confirmSubmit')}</p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Continue Quiz
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmission}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}