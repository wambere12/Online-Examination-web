import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Examination, InvigilationIncident, SystemAnnouncement } from '../../types/index.ts';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Play,
  FileEdit,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  totalUniversities?: number;
  totalSchools?: number;
  totalStudents: number;
  totalLecturers?: number;
  totalTeachers?: number;
  totalExams: number;
  activeExamsCount: number;
  completedExamsCount: number;
  pendingGradingCount: number;
  pendingApprovalCount?: number;
  passRate: number;
  avgScore: number;
  recentExams: Examination[];
  recentIncidents: InvigilationIncident[];
  announcements: SystemAnnouncement[];
}

export const DashboardOverview: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { user, activeSchool, switchDemoRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner with institutional identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 lg:p-8 border border-slate-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <span>{activeSchool?.name || 'Oakridge International Academy'}</span>
              <span aria-hidden="true">·</span>
              <span>Academic Year 2025–2026</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Online Examination Command Center
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Logged in as <span className="font-semibold text-white">{user?.name}</span> ({user?.role.replace('_', ' ')}).
              Monitor active proctored examinations, schedule assessments, and evaluate subjective submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'student' ? (
              <button
                onClick={() => setActiveTab('student_portal')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Go to Active Exams</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Create Examination</span>
                </button>
                <button
                  onClick={() => setActiveTab('invigilation')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Proctoring ({stats.activeExamsCount})</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (8 Key metrics with tabular numerals) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Enrolled Students</span>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.totalStudents > 4 ? stats.totalStudents : activeSchool?.studentCount || 1420}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across 3 enrolled grade cohorts
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Exams Now</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 uppercase">Live</span>
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
            {stats.activeExamsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            CS-201 Midterm currently ongoing
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Manual Grading</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
            {stats.pendingGradingCount} Submissions
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Subjective essays needing marking
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Institutional Pass Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.passRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Average score: <span className="font-semibold text-slate-800 tabular-nums">{stats.avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent Examinations & Live Incident Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Examination Schedule & Status (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Current & Scheduled Examinations</h2>
            <button
              onClick={() => setActiveTab('exams')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Candidates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{exam.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{exam.code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {exam.courseName || exam.subjectName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                        {exam.durationMinutes} mins · {exam.totalMarks} pts
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <span className="font-medium text-slate-900">{exam.submittedCount}</span>
                        <span className="text-slate-400">/{exam.totalCandidates}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {exam.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Session
                          </span>
                        )}
                        {exam.status === 'grading' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Grading Queue
                          </span>
                        )}
                        {exam.status === 'published' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Published
                          </span>
                        )}
                        {exam.status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {user?.role === 'student' && exam.status === 'active' ? (
                          <button
                            onClick={() => setActiveTab('student_portal')}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                          >
                            Enter Exam
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab(exam.status === 'grading' ? 'grading' : 'invigilation')}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium"
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Persona Tester Guide */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between mb-2">
              <span>Quick Test Guide: Recommended User Journeys</span>
              <span className="text-[11px] text-slate-500 font-normal">Select persona in top bar</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <button
                onClick={() => {
                  switchDemoRole('student');
                  setActiveTab('student_portal');
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <div className="font-semibold text-slate-900">1. Student Journey</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Start CS-201 Midterm with timed autosave, 8 question formats, and submission.
                </div>
              </button>

              <button
                onClick={() => {
                  switchDemoRole('lecturer');
                  setActiveTab('grading');
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <div className="font-semibold text-slate-900">2. Examiner Grading</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Review subjective essays and file uploads, then send to Results Officer.
                </div>
              </button>

              <button
                onClick={() => {
                  switchDemoRole('invigilator');
                  setActiveTab('invigilation');
                }}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <div className="font-semibold text-slate-900">3. Live Proctoring</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Monitor active candidates, grant extra time, and audit tab-switch incidents.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Proctored Incidents & Announcements (1 col) */}
        <div className="space-y-6">
          {/* Active Proctored Incidents */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900">Live Proctoring Incidents</h3>
              </div>
              <button
                onClick={() => setActiveTab('invigilation')}
                className="text-[11px] text-indigo-600 font-semibold hover:underline"
              >
                Open Console
              </button>
            </div>

            {stats.recentIncidents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active security incidents flagged.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{inc.studentName}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          inc.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inc.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px]">{inc.description}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(inc.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Institutional Announcements */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Academic Announcements</h3>
            </div>

            <div className="space-y-2.5">
              {stats.announcements.map((anc) => (
                <div key={anc.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                  <div className="font-semibold text-slate-900">{anc.title}</div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">{anc.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
