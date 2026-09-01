import React, { useState } from 'react';
import LanguageSelector from '../components/LanguageSelector';
import RoleToggle from '../components/RoleToggle';

export default function LoginPage() {
  const [language, setLanguage] = useState('en');
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const translations = {
    en: {
      title: "Government School Portal",
      subtitle: role === 'student' ? "Access your chapter-wise practice quizzes" : "Monitor student progress & resolve queries",
      idLabel: role === 'student' ? "Student ID / Email" : "Teacher ID / Email",
      idPlaceholder: role === 'student' ? "Enter your Student ID or Email" : "Enter your Teacher ID or Email",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      submitBtn: role === 'student' ? "Login to Student Dashboard" : "Login to Teacher Dashboard",
      validationError: "Please fill in all fields before logging in."
    },
    hi: {
      title: "शासकीय विद्यालय पोर्टल",
      subtitle: role === 'student' ? "अपनी अध्याय-वार अभ्यास क्विज़ एक्सेस करें" : "छात्र प्रगति की निगरानी करें और प्रश्नों का समाधान करें",
      idLabel: role === 'student' ? "छात्र आईडी / ईमेल" : "शिक्षक आईडी / ईमेल",
      idPlaceholder: role === 'student' ? "अपनी छात्र आईडी या ईमेल दर्ज करें" : "अपनी शिक्षक आईडी या ईमेल दर्ज करें",
      passwordLabel: "पासवर्ड",
      passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
      submitBtn: role === 'student' ? "छात्र डैशबोर्ड में लॉगिन करें" : "शिक्षक डैशबोर्ड में लॉगिन करें",
      validationError: "कृपया लॉगिन करने से पहले सभी फ़ील्ड भरें।"
    }
  };

  const t = translations[language];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(t.validationError);
      return;
    }

    setError('');
    console.log("Logging in as:", { role, identifier, password, language });
    alert(`Success! Navigating to ${role === 'student' ? 'Student Quiz Dashboard' : 'Teacher Dashboard'}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <LanguageSelector currentLang={language} onLanguageChange={setLanguage} />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>

          <RoleToggle role={role} onRoleChange={setRole} />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.idLabel}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t.idPlaceholder}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm text-gray-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {t.submitBtn}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        Education Initiative for Government Schools • Classes 8th, 9th & 10th
      </footer>
    </div>
  );
}