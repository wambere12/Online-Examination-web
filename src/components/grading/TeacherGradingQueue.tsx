import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Examination, ExamSubmission, Question } from '../../types/index.ts';
import {
  CheckSquare,
  Clock,
  Award,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ChevronRight,
  Sparkles,
  Download,
  FileCheck2,
} from 'lucide-react';

export const TeacherGradingQueue: React.FC<{ onResultsPublished?: () => void }> = ({
  onResultsPublished,
}) => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('exam_db_final');
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Grading form state for subjective questions
  const [marksInputs, setMarksInputs] = useState<Record<string, number>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [isSavingMark, setIsSavingMark] = useState(false);

  const fetchGradingData = async () => {
    try {
      setLoading(true);
      const examsRes = await api.getExams();
      setExams(examsRes.exams);

      if (selectedExamId) {
        const subRes = await api.getSubmissionsForExam(selectedExamId);
        setSubmissions(subRes.submissions);
        if (subRes.submissions.length > 0 && !selectedSubmission) {
          setSelectedSubmission(subRes.submissions[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradingData();
  }, [selectedExamId]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleSelectSubmission = (sub: ExamSubmission) => {
    setSelectedSubmission(sub);
    const initialMarks: Record<string, number> = {};
    const initialFeedback: Record<string, string> = {};
    for (const [qId, ans] of Object.entries(sub.answers)) {
      if (typeof ans.marksAwarded === 'number') {
        initialMarks[qId] = ans.marksAwarded;
      }
      if (ans.examinerFeedback) {
        initialFeedback[qId] = ans.examinerFeedback;
      }
    }
    setMarksInputs(initialMarks);
    setFeedbackInputs(initialFeedback);
  };

  const handleSaveQuestionMark = async (questionId: string) => {
    if (!selectedSubmission) return;
    setIsSavingMark(true);
    try {
      const awarded = marksInputs[questionId] ?? 0;
      const feedback = feedbackInputs[questionId] ?? '';
      const res = await api.markSubjectiveQuestion(selectedSubmission.id, {
        questionId,
        marksAwarded: awarded,
        feedback,
      });

      setSelectedSubmission(res.submission);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === res.submission.id ? res.submission : s))
      );
      alert('Question evaluation saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save marks');
    } finally {
      setIsSavingMark(false);
    }
  };

  const subjectiveQuestions = selectedExam?.questions.filter(
    (q) => q.type === 'essay' || q.type === 'short_answer' || q.type === 'file_upload'
  ) || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <CheckSquare className="w-4 h-4" />
            <span>Examiner Assessment & Marking Studio</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Written & File Evaluation Workbench</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate subjective essays and candidate uploaded artifacts (.pdf, .sql, .zip) against official academic rubrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedSubmission(null);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>

          {selectedExam?.status === 'pending_approval' && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>Awaiting Results Officer Ratification</span>
            </span>
          )}

          {selectedExam?.resultsPublished && (
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
              Results Published
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Submissions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Candidate Submissions ({submissions.length})
            </h2>
            <span className="text-[11px] text-slate-400">Select candidate</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No submissions for this examination yet.
              </div>
            ) : (
              submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full p-4 text-left transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 text-xs">{sub.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sub.studentRollNumber} · Score:{' '}
                        <strong className="text-slate-800 tabular-nums">
                          {sub.obtainedMarks}/{sub.totalMarks}
                        </strong>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      {sub.isFullyGraded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Graded ({sub.letterGrade || 'A'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" /> Needs Review
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Marking Workbench */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSubmission ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
              {/* Candidate Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-mono">Candidate Roll: {selectedSubmission.studentRollNumber}</div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedSubmission.studentName}</h2>
                  <div className="text-xs text-slate-500">{selectedSubmission.examTitle}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Auto-Marked</div>
                    <div className="text-sm font-bold text-slate-800 tabular-nums">
                      {selectedSubmission.autoGradedMarks} pts
                    </div>
                  </div>

                  <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <div className="text-[10px] text-indigo-600 font-semibold uppercase">Total Score & Grade</div>
                    <div className="text-sm font-bold text-indigo-900 tabular-nums">
                      {selectedSubmission.obtainedMarks} / {selectedSubmission.totalMarks} ({selectedSubmission.letterGrade || 'A'})
                    </div>
                  </div>
                </div>
              </div>

              {/* Subjective Questions & File Upload Questions */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Manual Examiner Evaluations (Essays, Short Answers, Uploaded Files)
                </h3>

                {subjectiveQuestions.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    This examination consists strictly of objective questions evaluated automatically.
                  </div>
                ) : (
                  subjectiveQuestions.map((q, idx) => {
                    const ans = selectedSubmission.answers[q.id];
                    const currentAwarded = marksInputs[q.id] ?? ans?.marksAwarded ?? 0;
                    const currentFeedback = feedbackInputs[q.id] ?? ans?.examinerFeedback ?? '';

                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-indigo-600">Question {idx + 1} ({q.type.toUpperCase()})</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{q.title}</h4>
                          </div>
                          <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs tabular-nums">
                            Max {q.marks} Marks
                          </span>
                        </div>

                        {/* Grading Rubric Callout */}
                        {q.rubric && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-amber-900">Examiner Rubric / Grading Criteria:</span>
                            <p className="text-amber-800 text-[11px] leading-relaxed">{q.rubric}</p>
                          </div>
                        )}

                        {/* If Format 08: File Upload Question */}
                        {q.type === 'file_upload' && (
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Candidate's Uploaded Artifact:
                            </label>
                            {ans?.uploadedFile ? (
                              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono font-bold text-xs">
                                    SQL
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {ans.uploadedFile.fileName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      {Math.round(ans.uploadedFile.fileSize / 1024)} KB · Uploaded {new Date(ans.uploadedFile.uploadedAt).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={ans.uploadedFile.dataUrl || '#'}
                                  download={ans.uploadedFile.fileName}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Submission</span>
                                </a>
                              </div>
                            ) : (
                              <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                                No file uploaded by candidate.
                              </div>
                            )}
                          </div>
                        )}

                        {/* If Essay or Short Answer */}
                        {q.type !== 'file_upload' && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                              Candidate's Written Response:
                            </label>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans whitespace-pre-wrap min-h-[80px]">
                              {ans?.textAnswer || <span className="text-slate-400 italic">No answer provided by candidate.</span>}
                            </div>
                          </div>
                        )}

                        {/* Examiner Scoring Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Awarded Marks (0 to {q.marks}):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={q.marks}
                              step="0.5"
                              value={currentAwarded}
                              onChange={(e) =>
                                setMarksInputs((prev) => ({
                                  ...prev,
                                  [q.id]: Math.min(q.marks, Math.max(0, Number(e.target.value))),
                                }))
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Examiner Feedback:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={currentFeedback}
                                onChange={(e) =>
                                  setFeedbackInputs((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder="E.g. Robust database schema, proper cascades..."
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => handleSaveQuestionMark(q.id)}
                                disabled={isSavingMark}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0"
                              >
                                Save Score
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              Select a candidate submission from the list to begin grading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
