import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { apiFetch, t } = useAuth();

  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'teachers' | 'students'
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal forms
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    employeeId: '',
    qualification: 'B.Sc., B.Ed'
  });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    classId: 1,
    rollNumber: '',
    section: 'A'
  });

  // Assign class modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState(null);
  const [assignClassId, setAssignClassId] = useState(1);
  const [assignSubjectId, setAssignSubjectId] = useState(1);
  const [assignSubjects, setAssignSubjects] = useState([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Stats
      const sRes = await apiFetch('/api/admin/stats');
      const sJson = await sRes.json();
      if (sJson.success) setStats(sJson.data);

      // 2. Teachers
      const tRes = await apiFetch('/api/admin/teachers');
      const tJson = await tRes.json();
      if (tJson.success) setTeachers(tJson.data);

      // 3. Students
      const stRes = await apiFetch('/api/admin/students');
      const stJson = await stRes.json();
      if (stJson.success) setStudents(stJson.data);

      // 4. Classes
      const cRes = await apiFetch('/api/classes');
      const cJson = await cRes.json();
      if (cJson.success) setClassesList(cJson.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When assignClassId changes, load available subjects
  useEffect(() => {
    async function loadSubjects() {
      if (!assignClassId) return;
      try {
        const res = await apiFetch(`/api/classes/${assignClassId}/subjects`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setAssignSubjects(json.data);
          setAssignSubjectId(json.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects for class:', err);
      }
    }
    loadSubjects();
  }, [assignClassId]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('User status updated successfully');
        loadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(newTeacher)
      });
      const json = await res.json();
      if (json.success) {
        setShowTeacherModal(false);
        setNewTeacher({ name: '', email: '', password: 'Password@123', employeeId: '', qualification: 'B.Sc., B.Ed' });
        setStatusMessage('Teacher provisioned successfully');
        loadData();
      } else {
        alert(json.error || 'Failed to create teacher');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/students', {
        method: 'POST',
        body: JSON.stringify({
          ...newStudent,
          classId: Number(newStudent.classId)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowStudentModal(false);
        setNewStudent({ name: '', email: '', password: 'Password@123', classId: 1, rollNumber: '', section: 'A' });
        setStatusMessage('Student provisioned successfully');
        loadData();
      } else {
        alert(json.error || 'Failed to create student');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignClass = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForAssign) return;
    try {
      const res = await apiFetch(`/api/admin/teachers/${selectedTeacherForAssign.id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          classId: Number(assignClassId),
          subjectId: Number(assignSubjectId)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowAssignModal(false);
        setStatusMessage('Class and subject assigned successfully');
        loadData();
      } else {
        alert(json.error || 'Failed to assign class');
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
              {t('adminPortal')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Centralised provisioning and oversight for Punjab Government Schools
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'stats' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 {t('platformStats')}
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'teachers' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👩‍🏫 {t('manageTeachers')} ({teachers.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'students' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍🎓 {t('manageStudents')} ({students.length})
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

        {/* TAB 1: SYSTEM OVERVIEW / STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-black text-blue-600">{stats?.totalStudents ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('totalStudents')}</div>
                <div className="text-[10px] text-slate-400 mt-2">Classes 8, 9, 10 enrolled</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-black text-emerald-600">{stats?.totalTeachers ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('totalTeachers')}</div>
                <div className="text-[10px] text-slate-400 mt-2">Govt-appointed faculty</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-black text-amber-600">{stats?.totalQuizzes ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('activeQuizzes')}</div>
                <div className="text-[10px] text-slate-400 mt-2">Curriculum assessments</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-black text-purple-600">{stats?.totalAttempts ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('totalAttempts')}</div>
                <div className="text-[10px] text-slate-400 mt-2">Submitted examinations</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
                <div className="text-2xl font-black text-indigo-600">{stats?.activeUsers ?? 0}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{t('activeUsers')}</div>
                <div className="text-[10px] text-slate-400 mt-2">Enabled accounts</div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold">Administrative Operations</h3>
                <p className="text-xs text-purple-100 mt-1">
                  Provision authorized teachers and students. Only designated school personnel can access this platform.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="px-4 py-2.5 bg-white text-purple-900 rounded-xl text-xs font-bold shadow-md hover:bg-purple-50 transition cursor-pointer"
                >
                  + {t('addTeacher')}
                </button>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="px-4 py-2.5 bg-purple-900/60 border border-purple-400/40 text-white rounded-xl text-xs font-bold hover:bg-purple-900 transition cursor-pointer"
                >
                  + {t('addStudent')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEACHERS DIRECTORY */}
        {activeTab === 'teachers' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registered Teachers</h3>
                <p className="text-xs text-slate-400">Class assignments and active status controls</p>
              </div>
              <button
                onClick={() => setShowTeacherModal(true)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition"
              >
                + {t('addTeacher')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Teacher</th>
                    <th className="px-6 py-3">{t('employeeId')}</th>
                    <th className="px-6 py-3">{t('qualification')}</th>
                    <th className="px-6 py-3">{t('assignedClasses')}</th>
                    <th className="px-6 py-3">{t('status')}</th>
                    <th className="px-6 py-3 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{teacher.name}</div>
                        <div className="text-[11px] text-slate-400">{teacher.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {teacher.employeeId || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {teacher.qualification || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                            teacher.assignedClasses.map((ac, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-semibold"
                              >
                                {ac.className}: {ac.subjectName}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">No assignments</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            teacher.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {teacher.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTeacherForAssign(teacher);
                            setShowAssignModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-semibold transition"
                        >
                          Assign Class
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(teacher.userId, teacher.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            teacher.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {teacher.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS DIRECTORY */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Enrolled Students</h3>
                <p className="text-xs text-slate-400">Class 8, 9, and 10 state students</p>
              </div>
              <button
                onClick={() => setShowStudentModal(true)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition"
              >
                + {t('addStudent')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">{t('enrolledClass')}</th>
                    <th className="px-6 py-3">{t('rollNumber')}</th>
                    <th className="px-6 py-3">{t('section')}</th>
                    <th className="px-6 py-3">{t('status')}</th>
                    <th className="px-6 py-3 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs">
                          {student.className}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {student.rollNumber || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        Section {student.section || 'A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            student.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {student.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(student.userId, student.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            student.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: PROVISION TEACHER */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('addTeacher')}</h3>
            <p className="text-xs text-slate-400 mb-4">Create verified credentials for government school faculty</p>
            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="e.g. Jaswinder Kaur"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="e.g. jaswinder.math@punjab.gov.in"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={newTeacher.employeeId}
                    onChange={(e) => setNewTeacher({ ...newTeacher, employeeId: e.target.value })}
                    placeholder="PUN-T-2026"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={newTeacher.qualification}
                    onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  Create Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROVISION STUDENT */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('addStudent')}</h3>
            <p className="text-xs text-slate-400 mb-4">Enroll a student into Class 8, 9, or 10</p>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="e.g. Amanpreet Singh"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Student Email</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="e.g. amanpreet.class8@punjab.gov.in"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Enrolled Class</label>
                  <select
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({ ...newStudent, classId: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Roll No</label>
                  <input
                    type="text"
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    placeholder="101"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Section</label>
                  <input
                    type="text"
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    placeholder="A"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN CLASS TO TEACHER */}
      {showAssignModal && selectedTeacherForAssign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign Class & Subject</h3>
            <p className="text-xs text-slate-400 mb-4">
              Allocate teaching responsibility for <span className="font-bold text-slate-700">{selectedTeacherForAssign.name}</span>
            </p>
            <form onSubmit={handleAssignClass} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Select Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Select Subject</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  {assignSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  Assign Responsibility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
