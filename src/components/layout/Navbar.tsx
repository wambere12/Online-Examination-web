import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';
import {
  Bell,
  ChevronDown,
  Building2,
  UserCheck,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, universities, activeUniversity, setActiveUniversity, switchDemoRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUniMenu, setShowUniMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles: { role: UserRole; label: string; desc: string; icon: string }[] = [
    { role: 'lecturer', label: 'Lecturer / Examiner', desc: 'Author exams, question bank, mark essays & files', icon: '📝' },
    { role: 'student', label: 'Student Candidate', desc: 'Take timed tests, anti-cheat lock & scorecards', icon: '🎓' },
    { role: 'results_officer', label: 'Results Officer', desc: 'Ratify marking, approve results & release solutions', icon: '⚖️' },
    { role: 'invigilator', label: 'Exam Invigilator', desc: 'Live proctoring, session telemetry & pardons', icon: '🛡️' },
    { role: 'university_admin', label: 'University Admin', desc: 'Faculties, departments, courses & enrollments', icon: '🏫' },
    { role: 'super_admin', label: 'Super Administrator', desc: 'Multi-university controls & immutable audit trail', icon: '🌐' },
  ];

  const roleLabelMap: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    university_admin: 'University Admin',
    school_admin: 'University Admin',
    lecturer: 'Lecturer / Examiner',
    teacher: 'Lecturer / Examiner',
    student: 'Student',
    invigilator: 'Invigilator',
    results_officer: 'Results Officer',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 h-16 px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            EP
          </div>
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              ExamPro
            </span>
            <span className="block text-[11px] font-medium text-slate-500">
              University Examination System
            </span>
          </div>
        </button>

        {activeUniversity && (
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-600">
            <img
              src={activeUniversity.logo}
              alt={activeUniversity.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <span className="font-medium text-slate-800 max-w-[200px] truncate">{activeUniversity.name}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation controls & Quick Multi-Role Switcher */}
      <div className="hidden md:flex items-center gap-3">
        {/* University Switcher */}
        {universities.length > 1 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowUniMenu(!showUniMenu);
                setShowRoleMenu(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[140px]">{activeUniversity?.code || 'University'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUniMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select University Institution
                </div>
                {universities.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => {
                      setActiveUniversity(uni);
                      setShowUniMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg text-xs transition-colors ${
                      activeUniversity?.id === uni.id
                        ? 'bg-indigo-50 text-indigo-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={uni.logo}
                      alt={uni.name}
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <div className="font-medium truncate">{uni.name}</div>
                      <div className="text-[10px] text-slate-400">{uni.code} · {uni.facultiesCount} Faculties</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowUniMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap shrink-0"
            title="Switch testing persona between all 6 university roles"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role: {user ? roleLabelMap[user.role] : 'Guest'}</span>
            <ChevronDown className="w-3 h-3 text-indigo-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Switch University Persona</span>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    6 Roles Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test Lecturers, Students, Results Officers, Invigilators, and Administrators.
                </p>
              </div>

              <div className="py-1 space-y-1">
                {roles.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => {
                      switchDemoRole(item.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-lg transition-colors ${
                      user?.role === item.role
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold flex items-center justify-between">
                        <span>{item.label}</span>
                        {user?.role === item.role && (
                          <span className="text-[10px] text-indigo-600 font-bold">Active</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Notifications & User Card */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-40">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">University Bulletin</span>
                <span className="text-[11px] text-indigo-600 font-medium">Mark read</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div className="font-semibold text-indigo-950">CS-305 Awaiting Results Approval</div>
                  <div className="text-indigo-800 text-[11px] mt-0.5">
                    Dean Robert Thorne (Results Officer) has final scores pending ratification.
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="font-semibold text-amber-900">Anti-Cheat Browser Lock Active</div>
                  <div className="text-amber-800 text-[11px] mt-0.5">
                    Candidate window switching will automatically freeze test sessions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-900 truncate max-w-[120px]">{user.name}</div>
              <div className="text-[11px] text-slate-500 capitalize">{roleLabelMap[user.role]}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
