import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, role, language, changeLanguage, logout, t } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
          🛡️ {t('adminRole')}
        </span>
      );
    }
    if (role === 'teacher') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
          👩‍🏫 {t('teacherRole')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        👨‍🎓 {t('studentRole')} • {user?.className || 'Class 8'}
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
            ਸ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                {t('appTitle')}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Punjab Ed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t('govtPunjab')}
            </p>
          </div>
        </div>

        {/* User profile & Controls */}
        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                language === 'en'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('pa')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                language === 'pa'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ਪੰਜਾਬੀ
            </button>
          </div>

          {/* User Details */}
          {user && (
            <div className="hidden md:flex items-center space-x-2">
              {getRoleBadge()}
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition flex items-center space-x-1"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
