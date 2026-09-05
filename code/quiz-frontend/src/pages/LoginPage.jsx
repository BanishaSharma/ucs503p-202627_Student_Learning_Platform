import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, language, changeLanguage, t } = useAuth();

  const [email, setEmail] = useState('gurleen.class8@punjab.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [selectedRole, setSelectedRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSelect = (roleKey, defaultEmail) => {
    setSelectedRole(roleKey);
    setEmail(defaultEmail);
    setPassword('Password@123');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setErrorMsg(err.message || t('invalidCreds'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col justify-between font-sans">
      {/* Top Bar with Language Selector */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl w-full mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-lg">
            ਸ
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-none">
              {t('appTitle')}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {t('govtPunjab')}
            </div>
          </div>
        </div>

        <div className="flex bg-white/80 backdrop-blur-xs p-1 rounded-lg border border-slate-200 text-xs shadow-xs">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              language === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('pa')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              language === 'pa' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ਪੰਜਾਬੀ
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('login')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('signInPrompt')}
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleSelect('student', 'gurleen.class8@punjab.gov.in')}
              className={`py-2 rounded-lg transition ${
                selectedRole === 'student'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👨‍🎓 {t('studentRole')}
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('teacher', 'harpreet.math@punjab.gov.in')}
              className={`py-2 rounded-lg transition ${
                selectedRole === 'teacher'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👩‍🏫 {t('teacherRole')}
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin', 'admin@shikshasetu.gov.in')}
              className={`py-2 rounded-lg transition ${
                selectedRole === 'admin'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ {t('adminRole')}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <span className="text-sm leading-none">⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@punjab.gov.in"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <span>{t('login')} →</span>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Pill Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              {t('demoAccounts')} (Password: Password@123)
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleRoleSelect('student', 'gurleen.class8@punjab.gov.in')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-slate-600 flex justify-between items-center transition border border-slate-100"
              >
                <span>👨‍🎓 Class 8: gurleen.class8@punjab.gov.in</span>
                <span className="text-[10px] text-blue-600 font-bold">Use</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('teacher', 'harpreet.math@punjab.gov.in')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-slate-600 flex justify-between items-center transition border border-slate-100"
              >
                <span>👩‍🏫 Math Teacher: harpreet.math@punjab.gov.in</span>
                <span className="text-[10px] text-emerald-600 font-bold">Use</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin', 'admin@shikshasetu.gov.in')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-slate-600 flex justify-between items-center transition border border-slate-100"
              >
                <span>🛡️ State Admin: admin@shikshasetu.gov.in</span>
                <span className="text-[10px] text-purple-600 font-bold">Use</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        ShikshaSetu • Government of Punjab Department of School Education
      </footer>
    </div>
  );
}