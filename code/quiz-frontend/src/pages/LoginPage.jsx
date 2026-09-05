import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      alert('Please enter a valid email');
      return;
    }

    // Save user info locally for sessions
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);

    // Dynamic Route Navigation based on selected role
    if (role === 'teacher') {
      navigate('/teacher-dashboard', { 
        state: { userEmail: email, role: 'teacher' } 
      });
    } else {
      navigate('/student-dashboard', { 
        state: { userEmail: email, role: 'student' } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
          Learning Platform
        </h1>
        <p className="text-xs text-slate-500 text-center mb-6">
          Sign in to access your dashboard
        </p>

        {/* Role Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              role === 'student'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👨‍🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              role === 'teacher'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👩‍🏫 Teacher
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'teacher' ? 'teacher@school.com' : 'student@school.com'}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
          >
            Login as {role === 'teacher' ? 'Teacher' : 'Student'}
          </button>
        </form>
      </div>
    </div>
  );
}