import React from 'react';

export default function RoleToggle({ role, onRoleChange }) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
      <button
        type="button"
        onClick={() => onRoleChange('student')}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          role === 'student'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Student
      </button>
      <button
        type="button"
        onClick={() => onRoleChange('teacher')}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          role === 'teacher'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Teacher
      </button>
    </div>
  );
}