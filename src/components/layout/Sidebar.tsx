import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  Eye,
  CheckSquare,
  BarChart3,
  Building2,
  Users,
  ShieldCheck,
  GraduationCap,
  Award,
  FileCheck2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'lecturer';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      roles: ['super_admin', 'university_admin', 'lecturer', 'student', 'invigilator', 'results_officer'],
    },
    {
      id: 'student_portal',
      label: 'Student Exam Center',
      icon: GraduationCap,
      roles: ['student', 'lecturer', 'university_admin', 'super_admin'],
      badge: role === 'student' ? 'Active' : undefined,
    },
    {
      id: 'exams',
      label: 'Examinations',
      icon: BookOpen,
      roles: ['super_admin', 'university_admin', 'lecturer', 'invigilator', 'results_officer'],
    },
    {
      id: 'questions',
      label: 'Question Bank (8 Types)',
      icon: FileQuestion,
      roles: ['super_admin', 'university_admin', 'lecturer'],
    },
    {
      id: 'invigilation',
      label: 'Live Proctoring Room',
      icon: Eye,
      roles: ['super_admin', 'university_admin', 'lecturer', 'invigilator'],
      badge: 'Live',
    },
    {
      id: 'grading',
      label: 'Examiner Grading Studio',
      icon: CheckSquare,
      roles: ['super_admin', 'university_admin', 'lecturer'],
    },
    {
      id: 'approval',
      label: 'Results Officer Approval',
      icon: FileCheck2,
      roles: ['super_admin', 'university_admin', 'results_officer'],
      badge: role === 'results_officer' ? 'Pending' : undefined,
    },
    {
      id: 'results',
      label: 'Transcripts & Analytics',
      icon: BarChart3,
      roles: ['super_admin', 'university_admin', 'lecturer', 'student', 'results_officer'],
    },
    {
      id: 'academic',
      label: 'Faculties & Programs',
      icon: Users,
      roles: ['super_admin', 'university_admin'],
    },
    {
      id: 'schools',
      label: 'Universities Registry',
      icon: Building2,
      roles: ['super_admin'],
    },
    {
      id: 'audit',
      label: 'Security & Audit Ledger',
      icon: ShieldCheck,
      roles: ['super_admin', 'university_admin', 'results_officer'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          University Console
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
          <div className="text-xs font-semibold text-white flex items-center justify-between">
            <span className="truncate">{user?.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 capitalize mt-0.5">
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.badge === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.badge === 'Pending'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-indigo-400/20 text-indigo-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Institutional Compliance Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-400">ExamPro Core</span>
          <span className="font-mono text-[10px] text-emerald-400 font-bold">Supabase RLS</span>
        </div>
        <div>Anti-Cheat Window Lock Active.</div>
      </div>
    </aside>
  );
};
