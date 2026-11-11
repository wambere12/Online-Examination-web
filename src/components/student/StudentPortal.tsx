import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Examination, ExamSession, ExamSubmission } from '../../types/index.ts';
import { ExamTakingPlayer } from './ExamTakingPlayer.tsx';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Award,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FileText,
  Lock,
} from 'lucide-react';

export const StudentPortal: React.FC<{ onOpenResult?: (submissionId: string) => void }> = ({
  onOpenResult,
}) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Examination[]>([]);
  const [pastResults, setPastResults] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Active testing state
  const [selectedExamForBriefing, setSelectedExamForBriefing] = useState<Examination | null>(null);
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [activeSession, setActiveSession] = useState<{
    session: ExamSession;
    exam: Examination;
  } | null>(null);
  const [completedSubmissionId, setCompletedSubmissionId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsRes, resultsRes] = await Promise.all([
        api.getExams(),
        api.getStudentResults().catch(() => ({ results: [] })),
      ]);
      setExams(examsRes.exams || []);
      setPastResults(resultsRes.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleStartExam = async (exam: Examination) => {
    setPortalError(null);
    try {
      const data = await api.startExamSession(exam.id);
      setActiveSession(data);
      setSelectedExamForBriefing(null);
    } catch (err: any) {
      console.error('Error starting exam:', err);
      setPortalError(err.message || 'Unable to launch examination. Please check connection or proctor status.');
    }
  };

  if (activeSession) {
    return (
      <ExamTakingPlayer
        exam={activeSession.exam}
        initialSession={activeSession.session}
        onExit={() => {
          setActiveSession(null);
          loadData();
        }}
        onSubmitted={(subId) => {
          setActiveSession(null);
          setCompletedSubmissionId(subId);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Student Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600">Candidate Student Portal</div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
            <div className="text-xs text-slate-500 mt-0.5">
              Roll ID: <span className="font-mono font-medium text-slate-800">{user?.studentId || 'STU-2026-081'}</span> · Class: <span className="font-medium text-slate-800">{user?.classCohortName || user?.className || 'CS Year 2 — Cohort Alpha'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="text-xs text-slate-400 font-medium">Assigned Exams</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">{exams.length}</div>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
            <div className="text-xs text-emerald-600 font-medium">Completed / Published</div>
            <div className="text-lg font-bold text-emerald-700 tabular-nums">{pastResults.length}</div>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {portalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{portalError}</span>
          </div>
          <button
            onClick={() => setPortalError(null)}
            className="px-3 py-1 bg-white border border-rose-300 rounded text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Completion Receipt Banner if student just submitted */}
      {completedSubmissionId && (
        <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900">
                Examination Successfully Submitted & Locked!
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your responses have been securely archived. Objective sections were automatically graded, and subjective essays are queued for examiner review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCompletedSubmissionId(null)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap self-start sm:self-center cursor-pointer"
          >
            Dismiss Receipt
          </button>
        </div>
      )}

      {/* Section 1: Active & Scheduled Examinations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Examinations</h2>
            <p className="text-xs text-slate-500">Live assessments available for your enrolled academic program.</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading examination schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => {
              const isActive = exam.status === 'active';
              const isPublished = exam.status === 'published';
              const isGrading = exam.status === 'grading' || exam.status === 'pending_approval';
              const submittedRecord = pastResults.find((r) => r.examId === exam.id);

              return (
                <div
                  key={exam.id}
                  className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500">{exam.code}</span>
                      {submittedRecord ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Attempt Recorded
                        </span>
                      ) : isActive ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Ready to Take
                        </span>
                      ) : isPublished ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          Results Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {isGrading ? 'Under Moderation' : 'Scheduled'}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{exam.title}</h3>
                      <div className="text-xs text-slate-500 mt-1">
                        {exam.courseName || exam.subjectName || 'Computer Science & Software Engineering'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Duration</span>
                        <div className="font-semibold text-slate-800 tabular-nums">{exam.durationMinutes}m</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Total Marks</span>
                        <div className="font-semibold text-slate-800 tabular-nums">{exam.totalMarks}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Questions</span>
                        <div className="font-semibold text-slate-800 tabular-nums">{exam.questions.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 space-y-2">
                    {submittedRecord ? (
                      <button
                        onClick={() => onOpenResult && onOpenResult(submittedRecord.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Verified Scorecard</span>
                      </button>
                    ) : isActive ? (
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            setSelectedExamForBriefing(exam);
                            setAgreedToRules(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Examination</span>
                        </button>
                      </div>
                    ) : isPublished ? (
                      <button
                        onClick={() => onOpenResult && onOpenResult(exam.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Course Results</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedExamForBriefing(exam);
                          setAgreedToRules(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Preview Syllabus & Instructions</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Published Results & Performance History */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Official Examination Scorecards</h2>

        {pastResults.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 text-xs">
            No published results yet. Once examiners and the Results Officer ratify grades, your verified scorecards will appear here.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Examination Title</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Grade / Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastResults.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{res.examTitle}</td>
                      <td className="py-3.5 px-4 text-slate-600">{res.courseName || res.subjectName}</td>
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {new Date(res.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                        {res.obtainedMarks} / {res.totalMarks} ({res.percentage}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            res.isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {res.isPassed ? 'PASSED' : 'RETAKE REQUIRED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onOpenResult && onOpenResult(res.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pre-Exam Rules & Honor Code Briefing Modal */}
      {selectedExamForBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-indigo-600">Candidate Pre-Flight Briefing</div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedExamForBriefing.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please review examination instructions and acknowledge the academic honor code before starting.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200">
                <span>Duration Allowed:</span>
                <strong className="text-slate-900 tabular-nums">{selectedExamForBriefing.durationMinutes} Minutes</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200">
                <span>Total Questions:</span>
                <strong className="text-slate-900 tabular-nums">{selectedExamForBriefing.questions.length}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200">
                <span>Passing Mark:</span>
                <strong className="text-slate-900 tabular-nums">{selectedExamForBriefing.passingMarks} / {selectedExamForBriefing.totalMarks}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Negative Marking:</span>
                <strong className={selectedExamForBriefing.negativeMarking ? 'text-rose-600' : 'text-slate-900'}>
                  {selectedExamForBriefing.negativeMarking ? 'Active for incorrect objective answers' : 'Disabled'}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900">Examination Code of Conduct:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-xs">
                {selectedExamForBriefing.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-indigo-950 font-medium">
                I affirm on my honor that I will complete this examination independently without unauthorized materials or external assistance.
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedExamForBriefing(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartExam(selectedExamForBriefing)}
                disabled={!agreedToRules}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Proceed & Start Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
