import React from 'react';

export default function LanguageSelector({ currentLang, onLanguageChange }) {
  return (
    <div className="flex justify-end p-4">
      <select 
        value={currentLang}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select Language"
        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </select>
    </div>
  );
}