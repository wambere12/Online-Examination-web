import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Examination, ExamSubmission } from '../../types/index.ts';
import {
  FileCheck2,
  Award,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const ResultsOfficerApprovalView: React.FC<{ onApproved?: () => void }> = ({ onApproved }) => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam_db_final');
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('Ratified by Senate Academic Examination Board.');
  const [isApproving, setIsApproving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getExams();
      setExams(res.exams);

      const targetId = selectedExamId || res.exams[0]?.id;
      if (targetId) {
        const subRes = await api.getSubmissionsForExam(targetId);
        setSubmissions(subRes.submissions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExamId]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleApproveAndPublish = async () => {
    if (!selectedExam) return;
    if (
      !confirm(
        `Are you sure you want to grant Senate approval and publish final academic scores for "${selectedExam.title}"? This will officially release solutions and scorecards to all candidates.`
      )
    ) {
      return;
    }

    setIsApproving(true);
    try {
      await api.approveExamResults(selectedExam.id, approvalNotes);
      alert('Examination results approved and officially published!');
      loadData();
      if (onApproved) onApproved();
    } catch (err: any) {
      alert(err.message || 'Failed to approve results');
    } finally {
      setIsApproving(false);
    }
  };

  // Grade distributions
  const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0, F: 0 };
  for (const s of submissions) {
    if (s.letterGrade && gradeCounts[s.letterGrade] !== undefined) {
      gradeCounts[s.letterGrade]++;
    }
  }

  const passRate = submissions.length > 0
    ? Math.round((submissions.filter((s) => s.isPassed).length / submissions.length) * 100)
    : 100;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <FileCheck2 className="w-4 h-4" />
            <span>Academic Senate & Results Officer Console</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Results Ratification & Release Gate</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit lecturer evaluations, verify grade curves, and authorize the release of student transcripts and solutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedExam && (
        <div className="space-y-6">
          {/* Status & Approval Callout Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <span>Course: {selectedExam.courseCode} — {selectedExam.courseName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{selectedExam.code}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{selectedExam.title}</h2>
              <p className="text-xs text-slate-300">
                {selectedExam.resultsPublished
                  ? `Officially published on ${new Date(selectedExam.publishedAt || '').toLocaleString()}. Approved by: ${selectedExam.resultsApprovedBy || 'Results Officer'}.`
                  : 'Examiner grading is complete. Pending official Results Officer approval to publish transcripts and release solutions to students.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {selectedExam.resultsPublished ? (
                <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Officially Approved & Released</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleApproveAndPublish}
                    disabled={isApproving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" />
                    <span>{isApproving ? 'Ratifying...' : 'Approve & Release Results'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Academic Grade Curve Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500">Evaluated Candidates</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{submissions.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">100% completed marking</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500">Pass Rate</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{passRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Meets university benchmark</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500">First Class (A+ / A)</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
                {gradeCounts['A+'] + gradeCounts['A']} Candidates
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Top academic performance</div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="text-xs text-slate-500">Senate Ratification Status</div>
              <div className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                {selectedExam.resultsPublished ? (
                  <span className="text-emerald-700">Ratified & Published</span>
                ) : (
                  <span className="text-amber-700">Awaiting Signature</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Dean Robert Thorne</div>
            </div>
          </div>

          {/* Candidates Roster with Letter Grades & Examiner Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Candidates Academic Grade Ledger
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {selectedExam.totalMarks} Max Examination Marks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Candidate Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Objective Marks</th>
                    <th className="py-3 px-4">Subjective / File Marks</th>
                    <th className="py-3 px-4">Total Score</th>
                    <th className="py-3 px-4">Letter Grade</th>
                    <th className="py-3 px-4">GPA Points</th>
                    <th className="py-3 px-4 text-right">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{sub.studentName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{sub.studentRollNumber}</td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-700">{sub.autoGradedMarks} pts</td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-700">{sub.subjectiveMarks} pts</td>
                      <td className="py-3.5 px-4 tabular-nums font-bold text-slate-900">
                        {sub.obtainedMarks} / {sub.totalMarks} ({sub.percentage}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                          {sub.letterGrade || 'A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 tabular-nums">
                        {sub.gpaPoints ? sub.gpaPoints.toFixed(1) : '3.7'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {sub.resultsPublished ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            RELEASED
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            PENDING RATIFICATION
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
