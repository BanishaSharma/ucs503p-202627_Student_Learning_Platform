import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, language, changeLanguage, t } = useAuth();

  // Mode: 'login' | 'register_student' | 'verify_email' | 'accept_invite' | 'forgot_password' | 'reset_password'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('gurleen.class8@punjab.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [selectedRole, setSelectedRole] = useState('student');

  // Student registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClassId, setRegClassId] = useState(2);
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regSection, setRegSection] = useState('A');

  // Token operations state
  const [tokenInput, setTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resendEmailInput, setResendEmailInput] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRoleSelect = (roleKey, defaultEmail) => {
    setSelectedRole(roleKey);
    setEmail(defaultEmail);
    setPassword('Password@123');
    clearMessages();
  };

  // Standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
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

  // Student Self-Registration
  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          classId: Number(regClassId),
          rollNumber: regRollNumber,
          section: regSection
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Student registration failed');
      }

      setSuccessMsg(`Registration successful! Your email verification token is: ${data.data.verificationToken}`);
      setTokenInput(data.data.verificationToken || '');
      setMode('verify_email');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMsg('Email verified successfully! You may now sign in.');
      setMode('login');
      setTokenInput('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Email Verification
  const handleResendVerification = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmailInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setSuccessMsg(`New verification token generated: ${data.data.verificationToken}`);
      setTokenInput(data.data.verificationToken || '');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept Teacher Invitation
  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/teacher/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          password: newPasswordInput
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccessMsg('Account activated! You can now log in with your new password.');
      setMode('login');
      setTokenInput('');
      setNewPasswordInput('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmailInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password reset request failed');
      }

      setSuccessMsg(`Reset token generated: ${data.data.resetToken}`);
      setTokenInput(data.data.resetToken || '');
      setMode('reset_password');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Action
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          newPassword: newPasswordInput
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccessMsg('Password reset successfully! Please sign in with your new password.');
      setMode('login');
      setTokenInput('');
      setNewPasswordInput('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col justify-between font-sans">
      {/* Top Bar with Language Selector */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl w-full mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
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

      {/* Main Container Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'login' && t('login')}
              {mode === 'register_student' && 'Student Registration'}
              {mode === 'verify_email' && 'Verify Student Email'}
              {mode === 'accept_invite' && 'Activate Teacher Account'}
              {mode === 'forgot_password' && 'Forgot Password'}
              {mode === 'reset_password' && 'Set New Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'login' && t('signInPrompt')}
              {mode === 'register_student' && 'Register with official Punjab School pre-enrolled credentials'}
              {mode === 'verify_email' && 'Enter the verification token received during registration'}
              {mode === 'accept_invite' && 'Enter your administrative invitation token and choose a password'}
              {mode === 'forgot_password' && 'Enter your government registered email to receive a reset token'}
              {mode === 'reset_password' && 'Enter your reset token and new secure password'}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <span className="text-sm leading-none">⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start space-x-2">
              <span className="text-sm leading-none">✅</span>
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <div>
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

              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {t('password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setMode('forgot_password'); }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  </div>
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
                  {isLoading ? <span>Signing in...</span> : <span>{t('login')} →</span>}
                </button>
              </form>

              {/* Navigation Links */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('register_student'); }}
                  className="text-blue-600 hover:underline"
                >
                  New Student? Register
                </button>
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('accept_invite'); }}
                  className="text-purple-600 hover:underline"
                >
                  Teacher Invite?
                </button>
              </div>

              {/* Quick Demo Logins Pill Box */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
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
          )}

          {/* 2. STUDENT SELF-REGISTRATION FORM */}
          {mode === 'register_student' && (
            <form onSubmit={handleRegisterStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Harmanpreet Singh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Student Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="harman.class9@punjab.gov.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                />
                <span className="text-[10px] text-slate-400">Must be authorized domain (@punjab.gov.in, etc.)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class</label>
                  <select
                    value={regClassId}
                    onChange={(e) => setRegClassId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={1}>Class 8</option>
                    <option value={2}>Class 9</option>
                    <option value={3}>Class 10</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={regRollNumber}
                    onChange={(e) => setRegRollNumber(e.target.value)}
                    placeholder="e.g. 201"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section</label>
                <select
                  value={regSection}
                  onChange={(e) => setRegSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Registering...' : 'Register Student Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('login'); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 3. VERIFY EMAIL FORM */}
          {mode === 'verify_email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Token</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste 64-character token"
                  className="w-full px-3 py-2.5 font-mono text-[11px] rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Email Address'}
              </button>

              <div className="pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-600 mb-1">Need a new token?</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmailInput}
                    onChange={(e) => setResendEmailInput(e.target.value)}
                    placeholder="Enter student email"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700"
                  >
                    Resend
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('login'); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 4. ACCEPT TEACHER INVITATION FORM */}
          {mode === 'accept_invite' && (
            <form onSubmit={handleAcceptInvite} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invitation Token</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter token from admin invitation"
                  className="w-full px-3 py-2 font-mono text-[11px] rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Account Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Activating...' : 'Activate Teacher Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('login'); }}
                  className="text-purple-600 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 5. FORGOT PASSWORD FORM */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Account Email</label>
                <input
                  type="email"
                  required
                  value={resendEmailInput}
                  onChange={(e) => setResendEmailInput(e.target.value)}
                  placeholder="name@punjab.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Request Password Reset'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('login'); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 6. RESET PASSWORD FORM */}
          {mode === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password Reset Token</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste reset token"
                  className="w-full px-3 py-2 font-mono text-[11px] rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Saving...' : 'Update Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { clearMessages(); setMode('login'); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        ShikshaSetu • Government of Punjab Department of School Education
      </footer>
    </div>
  );
}