import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Examination } from '../../types/index.ts';
import { ExamCreateModal } from './ExamCreateModal.tsx';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Eye,
  CheckSquare,
  Search,
} from 'lucide-react';

interface ExamListProps {
  setActiveTab: (tab: string) => void;
}

export const ExamList: React.FC<ExamListProps> = ({ setActiveTab }) => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.getExams({ status: statusFilter || undefined });
      setExams(res.exams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [statusFilter]);

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.courseName || e.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <BookOpen className="w-4 h-4" />
            <span>Curriculum & Assessment Controller</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Examinations Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination schedules, monitor participation metrics, and manage result publication.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Examination</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, subject or exam code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Now</option>
            <option value="scheduled">Scheduled</option>
            <option value="grading">Grading Queue</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="text-slate-500 tabular-nums">
          Total: <strong className="text-slate-900">{filteredExams.length}</strong> examinations
        </div>
      </div>

      {/* Examinations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3.5 px-4">Exam Title & Code</th>
                <th className="py-3.5 px-4">Subject & Cohort</th>
                <th className="py-3.5 px-4">Duration & Marks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submissions</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No examinations found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{exam.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{exam.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{exam.subjectName}</div>
                      <div className="text-[11px] text-slate-500">
                        {exam.classNames?.join(', ') || 'General'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="font-medium text-slate-800">{exam.durationMinutes} Minutes</div>
                      <div className="text-[11px] text-slate-500">
                        {exam.totalMarks} Marks · Pass: {exam.passingMarks}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {exam.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Session
                        </span>
                      )}
                      {exam.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Scheduled
                        </span>
                      )}
                      {exam.status === 'grading' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Grading Queue
                        </span>
                      )}
                      {exam.status === 'published' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Results Published
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="font-semibold text-slate-900">
                        {exam.submittedCount} / {exam.totalCandidates}
                      </div>
                      {exam.pendingGradingCount > 0 && (
                        <div className="text-[10px] text-amber-600 font-medium">
                          {exam.pendingGradingCount} pending marking
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exam.status === 'active' && (
                          <button
                            onClick={() => setActiveTab('invigilation')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
                            title="Monitor live candidates in exam room"
                          >
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Proctor</span>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab('grading')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                          title="Evaluate subjective questions"
                        >
                          <CheckSquare className="w-3 h-3 text-indigo-600" />
                          <span>Grade</span>
                        </button>
                        {exam.status === 'published' && (
                          <button
                            onClick={() => setActiveTab('results')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold"
                            title="View score reports & analytics"
                          >
                            <Award className="w-3 h-3" />
                            <span>Report</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <ExamCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newExam) => {
            setExams((prev) => [newExam, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};
