import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Examination, ExamSubmission, Question } from '../../types/index.ts';
import {
  BarChart3,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  TrendingUp,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export const ResultsAnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam_bio_quiz');
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState<Examination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const examsRes = await api.getExams();
        // published or grading
        const completed = examsRes.exams.filter((e) => e.status === 'published' || e.status === 'grading');
        setExams(completed.length > 0 ? completed : examsRes.exams);

        const currentExamId = selectedExamId || (completed[0]?.id || examsRes.exams[0]?.id);
        if (currentExamId) {
          const subRes = await api.getSubmissionsForExam(currentExamId);
          setSubmissions(subRes.submissions);
          if (subRes.submissions.length > 0) {
            const detailRes = await api.getSubmissionDetail(subRes.submissions[0].id);
            setSelectedSubmission(detailRes.submission);
            setSelectedExamDetail(detailRes.exam);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedExamId]);

  const handleSelectSubmission = async (sub: ExamSubmission) => {
    try {
      const res = await api.getSubmissionDetail(sub.id);
      setSelectedSubmission(res.submission);
      setSelectedExamDetail(res.exam);
    } catch (e: any) {
      alert(e.message || 'Cannot load submission details');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Analytics computation
  const scores = submissions.map((s) => s.percentage || 0);
  const avgPercentage = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 84;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 92;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 68;
  const passCount = submissions.filter((s) => s.isPassed).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <BarChart3 className="w-4 h-4" />
            <span>Academic Performance & Scorecard Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Examination Results Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual candidate transcripts, question accuracy breakdowns, and cohort grade distributions.
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
                {e.title} ({e.status})
              </option>
            ))}
          </select>

          {selectedSubmission && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Transcript</span>
            </button>
          )}
        </div>
      </div>

      {/* Cohort Stats Band */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Evaluated Candidates</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{submissions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recorded submissions</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Cohort Average Score</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">{avgPercentage}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Standard mean</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Highest Score</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{highestScore}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top percentile</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500">Passed Candidates</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {passCount} / {submissions.length || 1}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {submissions.length > 0 ? Math.round((passCount / submissions.length) * 100) : 100}% Success rate
          </div>
        </div>
      </div>

      {/* Main Split: Candidates List & Comprehensive Transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates List (1 col) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Exam Submissions</h2>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No submissions available.</div>
            ) : (
              submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{sub.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{sub.studentRollNumber}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 tabular-nums">
                        {sub.obtainedMarks} / {sub.totalMarks} ({sub.percentage}%)
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          sub.isPassed ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {sub.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Transcript / Scorecard (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSubmission && selectedExamDetail ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
              {/* Institutional Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Official Academic Transcript
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedSubmission.studentName}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Roll Number: <span className="font-mono font-medium text-slate-800">{selectedSubmission.studentRollNumber}</span> · Examination: <span className="font-medium text-slate-800">{selectedSubmission.examTitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Mark</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      {selectedSubmission.obtainedMarks} / {selectedSubmission.totalMarks}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl text-center border ${
                      selectedSubmission.isPassed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase">Grade / Result</div>
                    <div className="text-lg font-bold tabular-nums">
                      {selectedSubmission.percentage}% {selectedSubmission.isPassed ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Diagnostic Breakdown */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Itemized Question Diagnostic Review
                </h3>

                <div className="space-y-4">
                  {selectedExamDetail.questions.map((q, idx) => {
                    const ans = selectedSubmission.answers[q.id];
                    const awarded = ans?.marksAwarded ?? 0;
                    const isFullyScored = awarded >= q.marks;

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-bold text-indigo-700">Question {idx + 1} ({q.type.toUpperCase()})</span>
                            <div className="font-semibold text-slate-900">{q.title}</div>
                          </div>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                              isFullyScored
                                ? 'bg-emerald-100 text-emerald-800'
                                : awarded > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {awarded} / {q.marks} pts
                          </span>
                        </div>

                        {/* Display response based on type */}
                        <div className="pt-2 border-t border-slate-200/60 space-y-1">
                          <div className="text-slate-600">
                            <strong>Candidate Response:</strong>{' '}
                            {ans ? (
                              ans.selectedOptionId ? (
                                <span className="font-medium text-slate-800">
                                  {q.options?.find((o) => o.id === ans.selectedOptionId)?.text || ans.selectedOptionId}
                                </span>
                              ) : ans.selectedOptionIds ? (
                                <span className="font-medium text-slate-800">
                                  {ans.selectedOptionIds.join(', ')}
                                </span>
                              ) : ans.textAnswer ? (
                                <span className="font-medium text-slate-800 italic">"{ans.textAnswer}"</span>
                              ) : ans.matchingSelections ? (
                                <span className="font-medium text-slate-800">
                                  {JSON.stringify(ans.matchingSelections)}
                                </span>
                              ) : (
                                'No answer submitted'
                              )
                            ) : (
                              'Unanswered'
                            )}
                          </div>

                          {/* Examiner Feedback if present */}
                          {ans?.examinerFeedback && (
                            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-900 text-[11px]">
                              <strong>Examiner Remarks:</strong> {ans.examinerFeedback}
                            </div>
                          )}

                          {/* Educational Solution */}
                          {q.explanation && (
                            <div className="text-[11px] text-slate-500 pt-1">
                              <strong>Key Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a candidate from the roster to inspect itemized scorecard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
