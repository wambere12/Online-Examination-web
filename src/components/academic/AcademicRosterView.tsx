import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { ClassRoom, Subject, UserProfile } from '../../types/index.ts';
import {
  Users,
  Plus,
  BookOpen,
  GraduationCap,
  Briefcase,
  X,
  Search,
} from 'lucide-react';

export const AcademicRosterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes' | 'subjects'>('students');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'lecturer' | 'teacher'>('student');
  const [userRoll, setUserRoll] = useState('');
  const [userClassId, setUserClassId] = useState('');

  const [classNameInput, setClassNameInput] = useState('');
  const [gradeLevelInput, setGradeLevelInput] = useState('200 Level');

  const [subjNameInput, setSubjNameInput] = useState('');
  const [subjCodeInput, setSubjCodeInput] = useState('');
  const [subjDeptInput, setSubjDeptInput] = useState('Science & Math');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, cRes, sRes] = await Promise.all([
        api.getUsers(),
        api.getClasses(),
        api.getSubjects(),
      ]);
      setStudents(uRes.users.filter((u) => u.role === 'student'));
      setTeachers(uRes.users.filter((u) => u.role === 'lecturer' || u.role === 'teacher'));
      setClasses(cRes.classes);
      setSubjects(sRes.subjects);
      if (cRes.classes.length > 0) setUserClassId(cRes.classes[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedClass = classes.find((c) => c.id === userClassId);
      const res = await api.createUser({
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        studentId: userRole === 'student' ? userRoll.trim() : undefined,
        employeeId: (userRole === 'lecturer' || userRole === 'teacher') ? userRoll.trim() : undefined,
        classCohortId: userRole === 'student' ? userClassId : undefined,
        classCohortName: userRole === 'student' ? selectedClass?.name : undefined,
      });

      if (userRole === 'student') setStudents((prev) => [...prev, res.user]);
      else setTeachers((prev) => [...prev, res.user]);

      setShowAddUserModal(false);
      setUserName('');
      setUserEmail('');
      setUserRoll('');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createClass({
        name: classNameInput.trim(),
        level: gradeLevelInput.trim(),
      });
      setClasses((prev) => [...prev, res.classRoom]);
      setShowAddClassModal(false);
      setClassNameInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubject({
        name: subjNameInput.trim(),
        code: subjCodeInput.trim().toUpperCase(),
        department: subjDeptInput.trim(),
      });
      setSubjects((prev) => [...prev, res.subject]);
      setShowAddSubjectModal(false);
      setSubjNameInput('');
      setSubjCodeInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Users className="w-4 h-4" />
            <span>Academic Registry & Enrollment Controller</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Institutional Rosters</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer students, teaching faculty, curriculum disciplines, and grade cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {activeTab === 'students' || activeTab === 'teachers' ? (
            <button
              onClick={() => {
                setUserRole(activeTab === 'teachers' ? 'teacher' : 'student');
                setShowAddUserModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll {activeTab === 'teachers' ? 'Teacher' : 'Student'}</span>
            </button>
          ) : activeTab === 'classes' ? (
            <button
              onClick={() => setShowAddClassModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Tab Bar (§1.A allowed for interactive buttons) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'students'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'teachers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Teachers ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'classes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Cohorts ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'subjects'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* Content Rendering based on Tab */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {activeTab === 'students' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Identifier</th>
                <th className="py-3 px-4">Assigned Cohort</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{stu.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 tabular-nums">{stu.studentId}</td>
                  <td className="py-3.5 px-4 text-slate-600">{stu.classCohortName || stu.className || 'General'}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{stu.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'teachers' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Privileges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((tch) => (
                <tr key={tch.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{tch.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{tch.employeeId || 'TCH-409'}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{tch.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Examiner & Author
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'classes' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Class Name</th>
                <th className="py-3 px-4">Academic Level</th>
                <th className="py-3 px-4">Enrolled Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{cls.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{cls.level || (cls.gradeLevel ? `Grade ${cls.gradeLevel}` : '200 Level')}</td>
                  <td className="py-3.5 px-4 tabular-nums font-medium text-slate-800">
                    {cls.studentCount || 30} Students
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'subjects' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{sub.name}</td>
                  <td className="py-3.5 px-4 font-mono text-indigo-700 font-bold">{sub.code}</td>
                  <td className="py-3.5 px-4 text-slate-600">{sub.departmentName || sub.department || 'General'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Enroll New {userRole === 'teacher' || userRole === 'lecturer' ? 'Faculty Member' : 'Student'}
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="E.g. Alexander Hayes"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Institutional Email *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="alex.h@oakridge.edu"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {userRole === 'teacher' || userRole === 'lecturer' ? 'Employee ID' : 'Roll Identifier'}
                  </label>
                  <input
                    type="text"
                    value={userRoll}
                    onChange={(e) => setUserRoll(e.target.value)}
                    placeholder={userRole === 'teacher' || userRole === 'lecturer' ? 'TCH-550' : 'STU-2026-112'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                {userRole === 'student' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Class Cohort</label>
                    <select
                      value={userClassId}
                      onChange={(e) => setUserClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Academic Cohort</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Cohort Name</label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Grade 12 - Honors Gamma"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Grade Level</label>
                <input
                  type="text"
                  value={gradeLevelInput}
                  onChange={(e) => setGradeLevelInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Subject / Discipline</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject Title</label>
                <input
                  type="text"
                  value={subjNameInput}
                  onChange={(e) => setSubjNameInput(e.target.value)}
                  placeholder="Organic Chemistry"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  value={subjCodeInput}
                  onChange={(e) => setSubjCodeInput(e.target.value)}
                  placeholder="CHEM-302"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={subjDeptInput}
                  onChange={(e) => setSubjDeptInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
