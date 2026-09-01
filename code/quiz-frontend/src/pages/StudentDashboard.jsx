import React, { useState } from 'react';
import LanguageSelector from '../components/LanguageSelector';

export default function StudentDashboard() {
  const [language, setLanguage] = useState('en');

  // Dummy Student Data
  const student = {
    name: "Rahul",
    stats: {
      attempted: 12,
      avgScore: "76%",
      streak: "5 Days",
      pending: 3
    },
    continueQuiz: {
      subject: "Mathematics",
      chapter: "Polynomials",
      progress: "60%"
    }
  };

  const translations = {
    en: {
      welcome: `Hello, ${student.name}! 👋`,
      subtitle: "Ready to continue learning today?",
      stats: {
        attempted: "Quizzes Attempted",
        avgScore: "Average Score",
        streak: "Current Streak",
        pending: "Pending Quizzes"
      },
      continueHeader: "Continue Learning",
      continueSub: "Continue where you left off",
      continueBtn: "Continue Quiz",
      subjectsHeader: "Available Subjects",
      selectSubject: "Select a subject to start practicing chapter-wise quizzes",
      subjects: [
        { id: 'math', name: 'Mathematics', icon: '📘', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { id: 'sci', name: 'Science', icon: '🔬', color: 'bg-green-50 text-green-700 border-green-200' },
        { id: 'eng', name: 'English', icon: '📕', color: 'bg-red-50 text-red-700 border-red-200' },
        { id: 'sst', name: 'Social Science', icon: '🌍', color: 'bg-amber-50 text-amber-700 border-amber-200' }
      ]
    },
    hi: {
      welcome: `नमस्ते, ${student.name}! 👋`,
      subtitle: "क्या आप आज अपनी पढ़ाई जारी रखने के लिए तैयार हैं?",
      stats: {
        attempted: "प्रयास की गई क्विज़",
        avgScore: "औसत स्कोर",
        streak: "लगातार दिन (Streak)",
        pending: "लंबित क्विज़"
      },
      continueHeader: "पढ़ाई जारी रखें",
      continueSub: "जहाँ से आपने छोड़ा था वहाँ से शुरू करें",
      continueBtn: "क्विज़ जारी रखें",
      subjectsHeader: "उपलब्ध विषय",
      selectSubject: "अध्याय-वार क्विज़ शुरू करने के लिए एक विषय चुनें",
      subjects: [
        { id: 'math', name: 'गणित (Mathematics)', icon: '📘', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { id: 'sci', name: 'विज्ञान (Science)', icon: '🔬', color: 'bg-green-50 text-green-700 border-green-200' },
        { id: 'eng', name: 'अंग्रेज़ी (English)', icon: '📕', color: 'bg-red-50 text-red-700 border-red-200' },
        { id: 'sst', name: 'सामाजिक विज्ञान (Social Science)', icon: '🌍', color: 'bg-amber-50 text-amber-700 border-amber-200' }
      ]
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LanguageSelector currentLang={language} onLanguageChange={setLanguage} />

      <main className="max-w-6xl mx-auto px-4 py-6 w-full space-y-8 flex-grow">
        {/* Welcome Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.welcome}</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">{t.subtitle}</p>
          </div>
          <span className="text-4xl hidden sm:inline">🎓</span>
        </div>

        {/* Quick Statistics Grid */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl mb-2 block">📚</span>
              <p className="text-xs font-medium text-gray-500">{t.stats.attempted}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{student.stats.attempted}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl mb-2 block">🎯</span>
              <p className="text-xs font-medium text-gray-500">{t.stats.avgScore}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{student.stats.avgScore}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl mb-2 block">🔥</span>
              <p className="text-xs font-medium text-gray-500">{t.stats.streak}</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{student.stats.streak}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl mb-2 block">⏳</span>
              <p className="text-xs font-medium text-gray-500">{t.stats.pending}</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{student.stats.pending}</p>
            </div>
          </div>
        </section>

        {/* Continue Learning Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-semibold mb-2">
                {t.continueSub}
              </span>
              <h2 className="text-xl font-bold">{student.continueQuiz.subject}</h2>
              <p className="text-blue-100 text-sm mt-0.5">Chapter: {student.continueQuiz.chapter}</p>
            </div>
            <button className="bg-white text-blue-700 font-semibold px-6 py-2.5 rounded-xl shadow hover:bg-blue-50 transition text-sm">
              {t.continueBtn}
            </button>
          </div>
        </section>

        {/* Available Subjects Grid */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.subjectsHeader}</h2>
            <p className="text-xs text-gray-500">{t.selectSubject}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {t.subjects.map((subj) => (
              <div
                key={subj.id}
                className={`p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col items-start ${subj.color}`}
              >
                <span className="text-3xl mb-3">{subj.icon}</span>
                <h3 className="font-semibold text-gray-900">{subj.name}</h3>
                <span className="text-xs text-gray-500 mt-4">Classes 8th - 10th</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}