import React, { useState } from 'react';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'create' | 'results'
  const [editingQuizId, setEditingQuizId] = useState(null);

  // Initial State Data for Teacher Quizzes
  const [quizzes, setQuizzes] = useState([
    { id: 1, name: 'DSA Quiz', subject: 'Computer Science', questionsCount: 20, duration: '20 mins', marks: 20, status: 'Published' },
    { id: 2, name: 'DBMS Quiz', subject: 'Database', questionsCount: 15, duration: '15 mins', marks: 15, status: 'Draft' },
    { id: 3, name: 'OS Quiz', subject: 'Operating Systems', questionsCount: 25, duration: '30 mins', marks: 25, status: 'Published' },
  ]);

  // Quiz Form State (Create/Edit)
  const [quizForm, setQuizForm] = useState({ title: '', description: '', subject: 'Computer Science', duration: '', marks: '' });

  // Question Form State (Add/Edit Question inside a quiz)
  const [questions, setQuestions] = useState([
    { id: 101, text: 'Which data structure follows FIFO?', optionA: 'Stack', optionB: 'Queue', optionC: 'Tree', optionD: 'Graph', correct: 'B', marks: 1 }
  ]);
  const [newQuestion, setNewQuestion] = useState({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A', marks: 1 });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Student Results Mock Data
  const studentResults = [
    { id: 1, student: 'Rijul', score: '18/20', percentage: '90%' },
    { id: 2, student: 'Student 2', score: '15/20', percentage: '75%' },
    { id: 3, student: 'Student 3', score: '12/20', percentage: '60%' },
  ];

  // --- Handlers ---
  const handleTogglePublish = (id) => {
    setQuizzes(quizzes.map(q => q.id === id ? { ...q, status: q.status === 'Published' ? 'Draft' : 'Published' } : q));
  };

  const handleDeleteQuiz = (id) => {
    setQuizzes(quizzes.filter(q => q.id !== id));
  };

  const handleSaveQuiz = (status) => {
    const newEntry = {
      id: Date.now(),
      name: quizForm.title || 'Untitled Quiz',
      subject: quizForm.subject,
      questionsCount: questions.length,
      duration: `${quizForm.duration || 15} mins`,
      marks: quizForm.marks || questions.reduce((acc, q) => acc + Number(q.marks), 0),
      status: status
    };
    setQuizzes([...quizzes, newEntry]);
    setActiveTab('quizzes');
    setQuizForm({ title: '', description: '', subject: 'Computer Science', duration: '', marks: '' });
  };

  const handleAddOrUpdateQuestion = () => {
    if (!newQuestion.text) return;
    if (editingQuestionId) {
      setQuestions(questions.map(q => q.id === editingQuestionId ? { ...newQuestion, id: editingQuestionId } : q));
      setEditingQuestionId(null);
    } else {
      setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
    }
    setNewQuestion({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct: 'A', marks: 1 });
  };

  const handleEditQuestion = (q) => {
    setNewQuestion(q);
    setEditingQuestionId(q.id);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Teacher Workspace</h1>
          <p className="text-xs text-slate-500">Manage quizzes, questions, and view student performance</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('quizzes')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${activeTab === 'quizzes' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            My Quizzes
          </button>
          <button 
            onClick={() => setActiveTab('create')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            + Create Quiz
          </button>
          <button 
            onClick={() => setActiveTab('results')} 
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Results Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">
        {/* 1. MY QUIZZES TABLE */}
        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">My Quizzes</h2>
              <button onClick={() => setActiveTab('create')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700">
                + Create New Quiz
              </button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Quiz Name</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{quiz.name}</td>
                    <td className="py-4 px-4 text-slate-600">{quiz.questionsCount}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quiz.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleTogglePublish(quiz.id)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100">
                        {quiz.status === 'Published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDeleteQuiz(quiz.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2 & 3 & 4. CREATE / EDIT QUIZ & QUESTION MANAGER */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Quiz Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Quiz Info</h2>
              <div>
                <label className="text-xs font-semibold text-slate-600">Quiz Title</label>
                <input type="text" value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} placeholder="e.g. DSA Quiz" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea value={quizForm.description} onChange={(e) => setQuizForm({...quizForm, description: e.target.value})} placeholder="Short details..." className="w-full mt-1 p-2.5 border rounded-xl text-xs h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Duration (mins)</label>
                  <input type="number" value={quizForm.duration} onChange={(e) => setQuizForm({...quizForm, duration: e.target.value})} placeholder="20" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Total Marks</label>
                  <input type="number" value={quizForm.marks} onChange={(e) => setQuizForm({...quizForm, marks: e.target.value})} placeholder="20" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => handleSaveQuiz('Draft')} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200">Save Draft</button>
                <button onClick={() => handleSaveQuiz('Published')} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-700">Publish</button>
              </div>
            </div>

            {/* Right Column: Add/Edit Question */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-3">
                {editingQuestionId ? 'Edit Question' : 'Add Question'}
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-600">Question Statement</label>
                <input type="text" value={newQuestion.text} onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})} placeholder="Which data structure follows FIFO?" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Option A</label>
                  <input type="text" value={newQuestion.optionA} onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})} placeholder="Stack" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Option B</label>
                  <input type="text" value={newQuestion.optionB} onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})} placeholder="Queue" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Option C</label>
                  <input type="text" value={newQuestion.optionC} onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})} placeholder="Tree" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Option D</label>
                  <input type="text" value={newQuestion.optionD} onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})} placeholder="Graph" className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Correct Answer</label>
                  <select value={newQuestion.correct} onChange={(e) => setNewQuestion({...newQuestion, correct: e.target.value})} className="w-full mt-1 p-2.5 border rounded-xl text-xs">
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Marks</label>
                  <input type="number" value={newQuestion.marks} onChange={(e) => setNewQuestion({...newQuestion, marks: Number(e.target.value)})} className="w-full mt-1 p-2.5 border rounded-xl text-xs" />
                </div>
              </div>

              <button onClick={handleAddOrUpdateQuestion} className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-900">
                {editingQuestionId ? 'Update Question' : '+ Add Question'}
              </button>

              {/* Added Questions List */}
              <div className="pt-4 border-t space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Quiz Questions List ({questions.length})</h3>
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{idx + 1}. {q.text}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Correct: <span className="font-semibold text-emerald-600">Option {q.correct}</span> | Marks: {q.marks}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditQuestion(q)} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-xs text-red-600 font-semibold hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. RESULTS DASHBOARD */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Quick Analytics Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Average Score</p>
                <p className="text-xl font-bold text-slate-800 mt-1">75%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Highest Score</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">90%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Lowest Score</p>
                <p className="text-xl font-bold text-red-500 mt-1">60%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold uppercase">Total Attempted</p>
                <p className="text-xl font-bold text-blue-600 mt-1">3 Students</p>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Student Scores</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.student}</td>
                      <td className="py-3 px-4 text-slate-600">{r.score}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">{r.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}