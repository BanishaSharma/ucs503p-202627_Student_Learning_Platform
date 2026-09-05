import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function TeacherDashboard() {
  const { user, apiFetch, t } = useAuth();

  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'builder' | 'excel' | 'results' | 'doubts'
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Quiz Builder state
  const [selectedAssignment, setSelectedAssignment] = useState(null); // { classId, subjectId }
  const [builderChapterId, setBuilderChapterId] = useState('');
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderDuration, setBuilderDuration] = useState(15);
  const [builderTotalMarks, setBuilderTotalMarks] = useState(10);
  const [builderQuestions, setBuilderQuestions] = useState([
    {
      questionText: '',
      questionTextPa: '',
      optionA: '',
      optionAPa: '',
      optionB: '',
      optionBPa: '',
      optionC: '',
      optionCPa: '',
      optionD: '',
      optionDPa: '',
      correctAnswer: 'A'
    }
  ]);

  // Excel upload state
  const [excelFile, setExcelFile] = useState(null);
  const [excelChapterId, setExcelChapterId] = useState('');
  const [excelTitle, setExcelTitle] = useState('');
  const [excelDuration, setExcelDuration] = useState(15);
  const [isUploading, setIsUploading] = useState(false);

  // Doubt Reply state
  const [replyTexts, setReplyTexts] = useState({}); // { [queryId]: string }

  // Load teacher baseline data
  const loadTeacherData = async () => {
    setIsLoading(true);
    try {
      // 1. Assigned classes & subjects
      const acRes = await apiFetch('/api/teacher/classes');
      const acJson = await acRes.json();
      if (acJson.success && Array.isArray(acJson.data)) {
        setAssignedClasses(acJson.data);
        if (acJson.data.length > 0 && !selectedAssignment) {
          setSelectedAssignment(acJson.data[0]);
        }
      }

      // 2. Teacher Quizzes
      const qRes = await apiFetch('/api/teacher/quizzes');
      const qJson = await qRes.json();
      if (qJson.success) setQuizzes(qJson.data);

      // 3. Student Results
      const rRes = await apiFetch('/api/teacher/results');
      const rJson = await rRes.json();
      if (rJson.success) setResults(rJson.data);

      // 4. Doubts
      const dRes = await apiFetch('/api/queries');
      const dJson = await dRes.json();
      if (dJson.success) setDoubts(dJson.data);
    } catch (err) {
      console.error('Failed to load teacher workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, []);

  // When selected assignment changes, fetch chapters
  useEffect(() => {
    async function loadChapters() {
      if (!selectedAssignment?.subjectId) return;
      try {
        const res = await apiFetch(`/api/subjects/${selectedAssignment.subjectId}/chapters`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setChapters(json.data);
          setBuilderChapterId(json.data[0].id);
          setExcelChapterId(json.data[0].id);
        } else {
          setChapters([]);
        }
      } catch (err) {
        console.error('Failed to load chapters:', err);
      }
    }
    loadChapters();
  }, [selectedAssignment]);

  // Quiz Builder methods
  const handleAddQuestionRow = () => {
    setBuilderQuestions([
      ...builderQuestions,
      {
        questionText: '',
        questionTextPa: '',
        optionA: '',
        optionAPa: '',
        optionB: '',
        optionBPa: '',
        optionC: '',
        optionCPa: '',
        optionD: '',
        optionDPa: '',
        correctAnswer: 'A'
      }
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...builderQuestions];
    updated[index][field] = value;
    setBuilderQuestions(updated);
  };

  const handleRemoveQuestionRow = (index) => {
    if (builderQuestions.length <= 1) return;
    setBuilderQuestions(builderQuestions.filter((_, i) => i !== index));
  };

  const handleSaveQuiz = async (statusToSet = 'draft') => {
    if (!builderTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!builderChapterId) {
      alert('Please select a target chapter');
      return;
    }

    const payload = {
      chapterId: Number(builderChapterId),
      title: builderTitle.trim(),
      description: builderDescription.trim() || undefined,
      durationMinutes: Number(builderDuration),
      totalMarks: Number(builderTotalMarks),
      status: statusToSet,
      questions: builderQuestions.map((q) => ({
        questionText: q.questionText.trim(),
        questionTextPa: q.questionTextPa.trim() || undefined,
        optionA: q.optionA.trim(),
        optionAPa: q.optionAPa.trim() || undefined,
        optionB: q.optionB.trim(),
        optionBPa: q.optionBPa.trim() || undefined,
        optionC: q.optionC.trim(),
        optionCPa: q.optionCPa.trim() || undefined,
        optionD: q.optionD.trim(),
        optionDPa: q.optionDPa.trim() || undefined,
        correctAnswer: q.correctAnswer
      }))
    };

    try {
      const res = await apiFetch('/api/teacher/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Quiz successfully saved as ${statusToSet}!`);
        setActiveTab('quizzes');
        setBuilderTitle('');
        setBuilderDescription('');
        loadTeacherData();
      } else {
        alert(json.error || 'Failed to save quiz');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTogglePublish = async (quizId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await apiFetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Quiz status updated to ${newStatus}`);
        loadTeacherData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await apiFetch(`/api/teacher/quizzes/${quizId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('Quiz deleted successfully');
        loadTeacherData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Excel upload handler
  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      alert('Please select an .xlsx file');
      return;
    }
    if (!excelChapterId) {
      alert('Please select a target chapter');
      return;
    }

    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('chapterId', excelChapterId);
    formData.append('title', excelTitle || 'Imported Excel Quiz');
    formData.append('durationMinutes', excelDuration);

    setIsUploading(true);
    try {
      const res = await apiFetch('/api/teacher/quizzes/upload-excel', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Successfully created quiz from Excel with ${json.data.questionCount} questions!`);
        setActiveTab('quizzes');
        setExcelFile(null);
        setExcelTitle('');
        loadTeacherData();
      } else {
        alert(json.error || 'Failed to import Excel file');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Doubts responses handler
  const handleSendReply = async (queryId) => {
    const text = replyTexts[queryId]?.trim();
    if (!text) return;

    try {
      const res = await apiFetch(`/api/queries/${queryId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ responseText: text })
      });
      const json = await res.json();
      if (json.success) {
        setReplyTexts({ ...replyTexts, [queryId]: '' });
        setStatusMessage('Response submitted successfully');
        loadTeacherData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolveDoubt = async (queryId, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    try {
      const res = await apiFetch(`/api/queries/${queryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        loadTeacherData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('teacherWorkspace')}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <span>{user?.name}</span>
              <span>•</span>
              <div className="flex gap-1">
                {assignedClasses.map((ac, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    {ac.className}: {ac.subjectName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'quizzes' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 {t('myQuizzes')} ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'builder' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✏️ {t('createQuiz')}
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'excel' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 {t('excelImport')}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'results' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 {t('results')} ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('doubts')}
              className={`px-3.5 py-2 rounded-xl transition ${
                activeTab === 'doubts' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💬 {t('doubts')} ({doubts.filter(d => d.status === 'open').length} open)
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex justify-between items-center">
            <span>✅ {statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-600 font-bold ml-4">✕</button>
          </div>
        )}

        {/* TAB 1: MY QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Class Quizzes</h3>
                <p className="text-xs text-slate-400">Assessments published to enrolled students</p>
              </div>
              <button
                onClick={() => setActiveTab('builder')}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
              >
                + {t('createQuiz')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Quiz Title</th>
                    <th className="px-6 py-3">Curriculum Scope</th>
                    <th className="px-6 py-3">Questions</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No quizzes found. Click "+ Create Quiz" or use Excel Import to add your first quiz.
                      </td>
                    </tr>
                  ) : (
                    quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{quiz.title}</div>
                          <div className="text-[11px] text-slate-400">{quiz.description || 'Standard Chapter Assessment'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700">{quiz.className}</span> • {quiz.subjectName}
                          <div className="text-[10px] text-slate-400">{quiz.chapterName}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {quiz.questionCount} questions
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {quiz.durationMinutes} mins
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              quiz.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {quiz.status === 'published' ? t('published') : t('draft')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleTogglePublish(quiz.id, quiz.status)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                              quiz.status === 'published'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: QUIZ BUILDER */}
        {activeTab === 'builder' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">{t('quizBuilder')}</h3>
              <p className="text-xs text-slate-400">Design bilingual questions with English & Punjabi support</p>
            </div>

            {/* Scope selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class & Subject</label>
                <select
                  value={selectedAssignment ? `${selectedAssignment.classId}-${selectedAssignment.subjectId}` : ''}
                  onChange={(e) => {
                    const [cId, sId] = e.target.value.split('-').map(Number);
                    const match = assignedClasses.find(a => a.classId === cId && a.subjectId === sId);
                    if (match) setSelectedAssignment(match);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {assignedClasses.map((ac, idx) => (
                    <option key={idx} value={`${ac.classId}-${ac.subjectId}`}>
                      {ac.className}: {ac.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('quizChapter')}</label>
                <select
                  value={builderChapterId}
                  onChange={(e) => setBuilderChapterId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('quizTitle')}</label>
                <input
                  type="text"
                  required
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="e.g. Chapter Test: Rational Numbers"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={builderDuration}
                  onChange={(e) => setBuilderDuration(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  min="1"
                  value={builderTotalMarks}
                  onChange={(e) => setBuilderTotalMarks(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 text-sm">
                  {t('questionsList')} ({builderQuestions.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddQuestionRow}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                >
                  + Add Question
                </button>
              </div>

              {builderQuestions.map((q, idx) => (
                <div key={idx} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-slate-700">Question {idx + 1}</span>
                    {builderQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionRow(idx)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Question Text (English)</label>
                      <input
                        type="text"
                        required
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                        placeholder="What is the square root of 64?"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Question Text (ਪੰਜਾਬੀ - Optional)</label>
                      <input
                        type="text"
                        value={q.questionTextPa}
                        onChange={(e) => handleQuestionChange(idx, 'questionTextPa', e.target.value)}
                        placeholder="64 ਦਾ ਵਰਗਮੂਲ ਕੀ ਹੈ?"
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Option A (EN)</label>
                      <input
                        type="text"
                        required
                        value={q.optionA}
                        onChange={(e) => handleQuestionChange(idx, 'optionA', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={q.optionAPa}
                        placeholder="ਪੰਜਾਬੀ"
                        onChange={(e) => handleQuestionChange(idx, 'optionAPa', e.target.value)}
                        className="w-full mt-1 p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Option B (EN)</label>
                      <input
                        type="text"
                        required
                        value={q.optionB}
                        onChange={(e) => handleQuestionChange(idx, 'optionB', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={q.optionBPa}
                        placeholder="ਪੰਜਾਬੀ"
                        onChange={(e) => handleQuestionChange(idx, 'optionBPa', e.target.value)}
                        className="w-full mt-1 p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Option C (EN)</label>
                      <input
                        type="text"
                        required
                        value={q.optionC}
                        onChange={(e) => handleQuestionChange(idx, 'optionC', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={q.optionCPa}
                        placeholder="ਪੰਜਾਬੀ"
                        onChange={(e) => handleQuestionChange(idx, 'optionCPa', e.target.value)}
                        className="w-full mt-1 p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Option D (EN)</label>
                      <input
                        type="text"
                        required
                        value={q.optionD}
                        onChange={(e) => handleQuestionChange(idx, 'optionD', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        value={q.optionDPa}
                        placeholder="ਪੰਜਾਬੀ"
                        onChange={(e) => handleQuestionChange(idx, 'optionDPa', e.target.value)}
                        className="w-full mt-1 p-1.5 text-[11px] border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1 text-xs">
                    <label className="font-bold text-slate-700">Correct Answer:</label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                      className="px-3 py-1 border border-slate-200 rounded-lg bg-white font-bold text-emerald-700"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSaveQuiz('draft')}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                {t('saveAsDraft')}
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuiz('published')}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition"
              >
                {t('publishQuiz')}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: EXCEL IMPORT */}
        {activeTab === 'excel' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">{t('uploadExcelFile')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload batch questions via Microsoft Excel spreadsheet (.xlsx). Columns required:
                <span className="font-mono font-bold text-slate-600"> question_text, option_a, option_b, option_c, option_d, correct_answer</span>
              </p>
            </div>

            <form onSubmit={handleExcelUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class & Subject</label>
                <select
                  value={selectedAssignment ? `${selectedAssignment.classId}-${selectedAssignment.subjectId}` : ''}
                  onChange={(e) => {
                    const [cId, sId] = e.target.value.split('-').map(Number);
                    const match = assignedClasses.find(a => a.classId === cId && a.subjectId === sId);
                    if (match) setSelectedAssignment(match);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {assignedClasses.map((ac, idx) => (
                    <option key={idx} value={`${ac.classId}-${ac.subjectId}`}>
                      {ac.className}: {ac.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Chapter</label>
                <select
                  value={excelChapterId}
                  onChange={(e) => setExcelChapterId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={excelTitle}
                  onChange={(e) => setExcelTitle(e.target.value)}
                  placeholder="e.g. Science Term 1 Exam"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  value={excelDuration}
                  onChange={(e) => setExcelDuration(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition">
                <input
                  type="file"
                  id="excelUploadInput"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label htmlFor="excelUploadInput" className="cursor-pointer space-y-2 block">
                  <div className="text-3xl">📊</div>
                  <div className="font-bold text-slate-700">
                    {excelFile ? excelFile.name : 'Click here to choose .xlsx file'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supports bilingual columns: question_text_pa, option_a_pa ...
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isUploading ? 'Parsing & Importing Questions...' : 'Import Quiz from Excel'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: STUDENT RESULTS */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Class Performance</h3>
              <p className="text-xs text-slate-400">Actual student scores from your assigned classes</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Class & Section</th>
                    <th className="px-6 py-3">Quiz</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Percentage</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        No student attempts recorded yet for your classes.
                      </td>
                    </tr>
                  ) : (
                    results.map((res) => (
                      <tr key={res.attemptId} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{res.studentName}</div>
                          <div className="text-[11px] text-slate-400">{res.studentEmail}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {res.className} (Sec {res.section || 'A'})
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{res.quizTitle}</div>
                          <div className="text-[10px] text-slate-400">{res.subjectName}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {res.score} / {res.totalMarks}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              res.percentage >= 50
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {res.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">
                          {new Date(res.attemptedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT DOUBTS / Q&A */}
        {activeTab === 'doubts' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm">Student Doubts Inbox</h3>
              <p className="text-xs text-slate-400">Questions submitted by students in your assigned subjects</p>
            </div>

            {doubts.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
                🎉 No pending doubts from your students.
              </div>
            ) : (
              doubts.map((d) => (
                <div key={d.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
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
                          {d.status === 'resolved' ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Asked by <span className="font-bold text-slate-700">{d.studentName}</span> ({d.className}) • {d.subjectName || 'General'} • {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveDoubt(d.id, d.status)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition ${
                        d.status === 'resolved'
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {d.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-100">
                    {d.description}
                  </div>

                  {/* Thread Responses */}
                  {d.responses && d.responses.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                      {d.responses.map((resp) => (
                        <div key={resp.id} className="p-3 bg-blue-50/60 rounded-xl text-xs border border-blue-100">
                          <div className="flex justify-between text-[10px] text-blue-900 font-bold mb-1">
                            <span>{resp.responderName} ({resp.responderRole})</span>
                            <span className="text-slate-400">{new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-slate-800">{resp.responseText}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={replyTexts[d.id] || ''}
                      onChange={(e) => setReplyTexts({ ...replyTexts, [d.id]: e.target.value })}
                      placeholder="Write your explanation or guidance..."
                      className="flex-1 p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSendReply(d.id)}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}