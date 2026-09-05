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
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  
  // Drilldown View States
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Quiz Engine Active States
  const [isQuizRunning, setIsQuizRunning] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: optionIdx }
  const [markedForReview, setMarkedForReview] = useState({}); // { 0: true }
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  
  // Quiz Flow Views
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // Stores submitted evaluation payload
  const [isReviewingMode, setIsReviewingMode] = useState(false);

  // Mock Question Database
  const quizQuestions = [
    {
      id: 1,
      question: "Which of the following expressions is a polynomial?",
      options: ["1/x + 2", "x² + 3x + 2", "√x + 1", "x⁻¹ + 4"],
      correct: 1,
      explanation: "A polynomial cannot contain variables under a square root, in denominators, or with negative exponents."
    },
    {
      id: 2,
      question: "What is the degree of a non-zero constant polynomial?",
      options: ["0", "1", "2", "Not Defined"],
      correct: 0,
      explanation: "A constant polynomial like f(x) = 5 can be written as 5x⁰, meaning its degree is 0."
    },
    {
      id: 3,
      question: "If α and β are the zeroes of x² - 5x + 6, then the value of (α + β) is:",
      options: ["5", "-5", "6", "-6"],
      correct: 0,
      explanation: "By Vieta's formula, sum of zeroes (α + β) = -b/a = -(-5)/1 = 5."
    },
    {
      id: 4,
      question: "The maximum number of zeroes a cubic polynomial can have is:",
      options: ["1", "2", "3", "4"],
      correct: 2,
      explanation: "A polynomial of degree n has at most n real zeroes. A cubic polynomial has degree 3."
    },
    {
      id: 5,
      question: "The geometrical representation of a quadratic polynomial is a:",
      options: ["Straight Line", "Parabola", "Circle", "Hyperbola"],
      correct: 1,
      explanation: "The equation y = ax² + bx + c always plots as a U-shaped or inverted U-shaped parabola."
    }
  ];

  // Mock Dashboard & History Data
  // Mock Data: Chapters
  const chaptersData = {
    Mathematics: [
      { id: 101, chapterNum: 1, title: 'Real Numbers', status: 'Completed' },
      { id: 102, chapterNum: 2, title: 'Polynomials', status: 'In Progress' },
    ],
    Science: [
      { id: 201, chapterNum: 1, title: 'Chemical Reactions', status: 'In Progress' },
      { id: 202, chapterNum: 2, title: 'Light Reflection & Refraction', status: 'Not Started' },
    ],
    English: [
      { id: 301, chapterNum: 1, title: 'A Letter to God', status: 'In Progress' },
      { id: 302, chapterNum: 2, title: 'Nelson Mandela: Long Walk to Freedom', status: 'Not Started' },
    ],
    'Social Science': [
      { id: 401, chapterNum: 1, title: 'The Rise of Nationalism in Europe', status: 'Not Started' },
    ]
  };

  // Mock Data: Quizzes
  const quizzesData = {
    // Mathematics
    'Real Numbers': [
      { id: 1, title: 'Basic Concepts Quiz', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: '100%' },
      { id: 2, title: 'Euclid Division Lemma', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '2 / 3', bestScore: '80%' },
      { id: 3, title: 'Irrationality Proofs', badge: '🔴 Challenge', questions: 5, difficulty: 'Hard', time: '15 mins', attempts: '0 / 2', bestScore: 'N/A' },
    ],
    'Polynomials': [
      { id: 1, title: 'Basic Practice Quiz', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: '90%' },
      { id: 2, title: 'Intermediate Quiz', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '2 / 3', bestScore: '60%' },
      { id: 3, title: 'Challenge Quiz', badge: '🔴 Challenge', questions: 5, difficulty: 'Hard', time: '15 mins', attempts: '0 / 2', bestScore: 'N/A' },
    ],

    // Science
    'Chemical Reactions': [
      { id: 1, title: 'Types of Reactions', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: '80%' },
      { id: 2, title: 'Balancing Chemical Equations', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '1 / 3', bestScore: '70%' },
      { id: 3, title: 'Oxidation & Reduction', badge: '🔴 Challenge', questions: 5, difficulty: 'Hard', time: '15 mins', attempts: '0 / 2', bestScore: 'N/A' },
    ],
    'Light Reflection & Refraction': [
      { id: 1, title: 'Mirror Formula Quiz', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: 'N/A' },
      { id: 2, title: 'Refractive Index', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '0 / 3', bestScore: 'N/A' },
    ],

    // English
    'A Letter to God': [
      { id: 1, title: 'Reading Comprehension', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: '90%' },
      { id: 2, title: 'Vocabulary & Metaphors', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '1 / 3', bestScore: '80%' },
    ],
    'Nelson Mandela: Long Walk to Freedom': [
      { id: 1, title: 'Chapter Summary Quiz', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: 'N/A' },
      { id: 2, title: 'Key Themes & Quotes', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '0 / 3', bestScore: 'N/A' },
    ],

    // Social Science
    'The Rise of Nationalism in Europe': [
      { id: 1, title: 'French Revolution & Idea of Nation', badge: '🟢 Basic', questions: 5, difficulty: 'Easy', time: '10 mins', attempts: 'Unlimited', bestScore: 'N/A' },
      { id: 2, title: 'Unification of Italy & Germany', badge: '🟡 Intermediate', questions: 5, difficulty: 'Medium', time: '10 mins', attempts: '0 / 3', bestScore: 'N/A' },
    ]
  };
  const [historyRecords, setHistoryRecords] = useState([
    { id: 101, quizTitle: 'Polynomials - Basic Practice', subject: 'Mathematics', date: '2026-08-30', score: '4/5', percentage: 80, status: 'Passed' },
    { id: 102, quizTitle: 'Real Numbers - Diagnostic', subject: 'Mathematics', date: '2026-08-28', score: '5/5', percentage: 100, status: 'Passed' },
    { id: 103, quizTitle: 'Chemical Reactions - Quiz 1', subject: 'Science', date: '2026-08-25', score: '3/5', percentage: 60, status: 'Needs Practice' },
  ]);

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
  const handleSelectOption = (optIdx) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optIdx
    }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const handleStartQuiz = () => {
    setIsQuizRunning(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setTimeLeft(600);
    setQuizResult(null);
    setIsReviewingMode(false);
  };

  const handleFinalSubmission = () => {
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) correctCount++;
    });

    const total = quizQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const unattempted = total - Object.keys(userAnswers).length;
    const wrong = total - correctCount - unattempted;
    const timeSpentSeconds = 600 - timeLeft;

    const evaluationPayload = {
      score: correctCount,
      totalQuestions: total,
      percentage,
      correctAnswers: correctCount,
      wrongAnswers: wrong,
      unattempted,
      timeTaken: formatTime(timeSpentSeconds),
      date: new Date().toISOString().split('T')[0]
    };

    setQuizResult(evaluationPayload);
    setIsQuizRunning(false);
    setShowSubmitModal(false);

    // Save attempt to History
    const newRecord = {
      id: Date.now(),
      quizTitle: `${activeChapter} - ${activeQuiz?.title || 'Practice Quiz'}`,
      subject: activeSubject || 'Mathematics',
      date: evaluationPayload.date,
      score: `${correctCount}/${total}`,
      percentage: percentage,
      status: percentage >= 70 ? 'Passed' : 'Needs Practice'
    };
    setHistoryRecords([newRecord, ...historyRecords]);
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return { title: 'Excellent! 🌟', desc: 'Outstanding work! You have mastered this material.', color: 'text-green-600' };
    if (percentage >= 70) return { title: 'Great Job! 🎉', desc: 'Solid performance! Keep up the good work.', color: 'text-blue-600' };
    if (percentage >= 50) return { title: 'Good Effort! 👍', desc: 'You passed, but reviewing weak concepts will help.', color: 'text-amber-600' };
    return { title: 'Keep Practicing! 💪', desc: 'Don\'t give up. Review the answers below and try again.', color: 'text-red-500' };
  };

  const filteredSubjects = selectedSubjectFilter === 'All' 
    ? [
        { id: 1, name: 'Mathematics', icon: '📘' },
        { id: 2, name: 'Science', icon: '🔬' },
        { id: 3, name: 'English', icon: '📕' },
        { id: 4, name: 'Social Science', icon: '🌍' }
      ] 
    : [
        { id: 1, name: 'Mathematics', icon: '📘' },
        { id: 2, name: 'Science', icon: '🔬' },
        { id: 3, name: 'English', icon: '📕' },
        { id: 4, name: 'Social Science', icon: '🌍' }
      ].filter(s => s.name === selectedSubjectFilter);

  // Status counters for confirmation modal
  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = quizQuestions.length - answeredCount;

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
      {isQuizRunning && (
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Top Bar */}
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
            <div>
              <h2 className="font-bold text-base md:text-lg">{activeChapter}: {activeQuiz?.title}</h2>
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
                  {quizQuestions[currentQuestionIndex].question}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-3 mb-6">
                  {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/60 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700 font-medium'}`}>
                            {option}
                          </span>
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
                <p className="text-xs text-slate-500 mb-6">Please check your answer summary below before finalizing.</p>

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
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleFinalSubmission}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 shadow-sm"
                  >
                    Yes, Submit
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
          <p className="text-slate-500 text-xs mt-1 mb-8">Here is a breakdown of your score performance</p>

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
              <p className="text-xs text-slate-500">Step-by-step solutions and explanations</p>
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
              const userChoice = userAnswers[idx];
              const isCorrect = userChoice === q.correct;
              const isUnattempted = userChoice === undefined;

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
                    {q.options.map((opt, oIdx) => {
                      let optionStyle = "bg-white border-slate-200 text-slate-700";
                      if (oIdx === q.correct) optionStyle = "bg-green-50 border-green-500 text-green-900 font-bold";
                      if (userChoice === oIdx && !isCorrect) optionStyle = "bg-red-50 border-red-400 text-red-900 font-bold";

                      return (
                        <div key={oIdx} className={`p-3 rounded-xl border flex justify-between items-center ${optionStyle}`}>
                          <span>{opt}</span>
                          {oIdx === q.correct && <span className="font-bold text-green-700">Correct Choice ✅</span>}
                          {userChoice === oIdx && !isCorrect && <span className="font-bold text-red-600">Your Choice ❌</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl text-xs text-blue-950">
                    <strong className="block font-bold text-blue-900 mb-1">💡 Explanation:</strong>
                    {q.explanation}
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
          {/* Curriculum Selection Bar */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Select Curriculum</h3>
              <p className="text-xs text-slate-500">Filter subjects and class levels</p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Class</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="8th">Class 8th</option>
                  <option value="9th">Class 9th</option>
                  <option value="10th">Class 10th</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                <select 
                  value={selectedSubjectFilter} 
                  onChange={(e) => {
                    setSelectedSubjectFilter(e.target.value);
                    setActiveSubject(e.target.value !== 'All' ? e.target.value : null);
                    setActiveChapter(null);
                    setActiveQuiz(null);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-3 py-2 outline-none"
                >
                  <option value="All">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Social Science">Social Science</option>
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
                  <h3 className="text-xl font-bold text-blue-600 mt-0.5">80%</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">🔥</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Streak</p>
                  <h3 className="text-xl font-bold text-amber-600 mt-0.5">5 Days</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
                  <div className="text-2xl mb-1">⏳</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Quizzes</p>
                  <h3 className="text-xl font-bold text-red-500 mt-0.5">3</h3>
                </div>
              </div>

              {/* Continue Banner */}
              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md mb-8 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-blue-200 mb-1">Continue Where You Left Off</p>
                  <h2 className="text-lg font-bold">Mathematics ({selectedClass})</h2>
                  <p className="text-blue-100 text-xs">Chapter: Polynomials</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveSubject('Mathematics');
                    setActiveChapter('Polynomials');
                  }}
                  className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition"
                >
                  Continue Quiz
                </button>
              </div>

              {/* Subject Grid */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">Subjects</h2>
                <p className="text-slate-500 text-xs mb-4">Select a subject card to view chapters</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredSubjects.map((subj) => (
                    <div 
                      key={subj.id} 
                      onClick={() => setActiveSubject(subj.name)}
                      className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col items-start group"
                    >
                      <div className="text-3xl mb-3 p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50">{subj.icon}</div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600">{subj.name}</h3>
                      <span className="text-xs text-blue-600 font-semibold mt-2">View Chapters →</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Chapters Level */}
          {activeSubject && !activeChapter && (
            <div>
              <button 
                onClick={() => setActiveSubject(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-3 block"
              >
                ← Back to All Subjects
              </button>
              <h2 className="text-xl font-bold text-slate-800">{activeSubject} - Class {selectedClass}</h2>
              <p className="text-slate-500 text-xs mb-6">Select a chapter to explore quizzes</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(chaptersData[activeSubject] || []).map((chap) => {
                  {/* Dynamic Quiz Count Sync Fix */}
                  const actualQuizCount = (quizzesData[chap.title] || []).length;
                  return (
                    <div key={chap.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Chapter {chap.chapterNum}</p>
                        <h3 className="font-bold text-slate-800 text-base mt-1 mb-2">{chap.title}</h3>
                        <p className="text-xs text-slate-500 mb-4">📝 {actualQuizCount} Quizzes Available</p>
                      </div>

                      <button 
                        onClick={() => setActiveChapter(chap.title)}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                      >
                        View Chapter Quizzes →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quiz Selection Level */}
          {activeChapter && !activeQuiz && (
            <div>
              <button 
                onClick={() => setActiveChapter(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-3 block"
              >
                ← Back to Chapters
              </button>
              <h2 className="text-xl font-bold text-slate-800">{activeChapter} - Practice Quizzes</h2>
              <p className="text-slate-500 text-xs mb-6">Select a difficulty tier to start</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(quizzesData[activeChapter] || quizzesData['Polynomials']).map((quiz) => (
                  <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {quiz.badge}
                        </span>
                        <span className="text-xs font-semibold text-green-600">Best: {quiz.bestScore}</span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-base mb-4">{quiz.title}</h3>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-6">
                        <p>❓ <strong>Questions:</strong> {quiz.questions}</p>
                        <p>⏱️ <strong>Time:</strong> {quiz.time}</p>
                        <p>🎯 <strong>Difficulty:</strong> {quiz.difficulty}</p>
                        <p>🔄 <strong>Attempts Allowed:</strong> {quiz.attempts}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveQuiz(quiz)}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Start Quiz
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions Level */}
          {activeQuiz && !isQuizRunning && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-slate-200">
              <button 
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 mb-4 block"
              >
                ← Back to Quiz Selection
              </button>

              <h2 className="text-2xl font-bold text-slate-800 mb-1">{activeChapter}: {activeQuiz.title}</h2>
              <p className="text-slate-500 text-xs mb-6">Read instructions before starting the timer.</p>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl mb-6 text-center border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Questions</p>
                  <p className="text-base font-bold text-slate-800">{activeQuiz.questions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p>
                  <p className="text-base font-bold text-slate-800">{activeQuiz.time}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Difficulty</p>
                  <p className="text-base font-bold text-blue-600">{activeQuiz.difficulty}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Instructions</h3>
                <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <li>Read every question carefully before choosing your answer.</li>
                  <li>Use the right side navigator grid to review or mark questions.</li>
                  <li>Answers auto-save immediately to frontend state upon selection.</li>
                  <li>Ensure you submit before the 10-minute timer expires.</li>
                </ul>
              </div>

              <button 
                onClick={handleStartQuiz}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-sm"
              >
                I'm Ready - Start Quiz
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
            <p className="text-xs text-slate-500 mb-4">Total curriculum completion rate</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: '65%' }}></div>
              </div>
              <span className="font-bold text-blue-600 text-sm">65%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4">Subject-wise Performance</h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Mathematics</span>
                  <span className="text-blue-600">80%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Science</span>
                  <span className="text-blue-600">65%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>English</span>
                  <span className="text-blue-600">72%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4">Chapter Progress</h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Polynomials</span>
                  <span className="text-slate-600">80%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Linear Equations</span>
                  <span className="text-slate-600">50%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Number Systems</span>
                  <span className="text-slate-600">70%</span>
                </div>
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. QUIZ HISTORY TAB                                                 */}
      {/* ------------------------------------------------------------------- */}
      {!isQuizRunning && !quizResult && activeTab === 'history' && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Quiz History</h2>
          <p className="text-xs text-slate-500 mb-6">Recent exam attempts and scores</p>

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
                {historyRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-800">{rec.quizTitle}</td>
                    <td className="p-3 text-slate-600">{rec.subject}</td>
                    <td className="p-3 text-slate-500">{rec.date}</td>
                    <td className="p-3 font-bold text-blue-600">{rec.score} ({rec.percentage}%)</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}