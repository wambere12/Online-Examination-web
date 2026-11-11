import React, { useState, useEffect, useRef } from 'react';
import type { Examination, ExamSession, Question, StudentAnswer, UploadedFileSubmission } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Send,
  Save,
  Check,
  UploadCloud,
  FileText,
  Lock,
  Unlock,
  AlertOctagon,
  RefreshCw,
  Sparkles,
  KeyRound,
  FileCode,
} from 'lucide-react';

interface ExamTakingPlayerProps {
  exam: Examination;
  initialSession: ExamSession;
  onExit: () => void;
  onSubmitted: (submissionId: string) => void;
}

export const ExamTakingPlayer: React.FC<ExamTakingPlayerProps> = ({
  exam,
  initialSession,
  onExit,
  onSubmitted,
}) => {
  const [session, setSession] = useState<ExamSession>(initialSession);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(initialSession.timeRemainingSeconds || exam.durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>(initialSession.answers || {});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerToast, setPlayerToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Anti-Cheat Page & Tab Switch Lockout State
  const [tabSwitches, setTabSwitches] = useState(initialSession.tabSwitches || 0);
  const [isLockedOut, setIsLockedOut] = useState(
    initialSession.isLockedOutDueToTabSwitch || initialSession.status === 'locked_out' || false
  );
  const [lockoutReason, setLockoutReason] = useState(initialSession.lockoutReason || '');
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [proctorPin, setProctorPin] = useState('PROCTOR2026');
  const [pinError, setPinError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const currentQuestion: Question | undefined = exam.questions[currentQuestionIndex];
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setPlayerToast({ message, type });
    setTimeout(() => setPlayerToast(null), 3500);
  };

  // 1. Countdown Timer (Halts if locked out)
  useEffect(() => {
    if (isLockedOut) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut]);

  // 2. Strict Anti-Cheat: Tab Switch & Window Page Visibility Event Listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only count when document becomes genuinely hidden (actual tab switch/minimize)
      if (document.visibilityState === 'hidden' && !isLockedOut && exam.strictTabLockout) {
        setShowTabWarning(true);
        try {
          const res = await api.reportTabSwitch(session.id);
          setTabSwitches(res.tabSwitches);
          if (res.isLockedOut) {
            setIsLockedOut(true);
            setLockoutReason(
              `Anti-cheat policy triggered: Exceeded maximum permissible page/tab switches (${res.tabSwitches} / ${res.maxAllowed}). Workstation locked.`
            );
          }
        } catch (err) {
          console.error('Error reporting tab switch:', err);
        }
      }
    };

    const handleWindowBlur = () => {
      if (!isLockedOut && exam.strictTabLockout) {
        setShowTabWarning(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active proctored examination. Leaving this page will lock your session.';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat Interval to check for unlock status or invigilator pardon
    const heartbeatInterval = setInterval(async () => {
      try {
        const res = await api.sendSessionHeartbeat(session.id);
        setTimeRemaining(res.timeRemainingSeconds);
        if (!res.isLockedOut && isLockedOut) {
          setIsLockedOut(false);
          setTabSwitches(0);
          setShowTabWarning(false);
          setPinError('');
        }
      } catch (err) {
        console.error('Heartbeat check error:', err);
      }
    }, 8000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatInterval);
    };
  }, [session.id, isLockedOut, exam.strictTabLockout]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async (questionId: string, answerPayload: Partial<StudentAnswer>) => {
    if (isLockedOut) return;
    setSaveStatus('saving');
    try {
      const res = await api.saveStudentAnswer(session.id, questionId, answerPayload);
      setSaveStatus('saved');
      setLastSavedTime(new Date(res.savedAt).toLocaleTimeString());
    } catch (err) {
      console.error('Failed to save answer:', err);
      setSaveStatus('error');
    }
  };

  const handleAnswerChange = (update: Partial<StudentAnswer>) => {
    if (!currentQuestion || isLockedOut) return;
    const currentAns = answers[currentQuestion.id] || {
      questionId: currentQuestion.id,
      type: currentQuestion.type,
      savedAt: new Date().toISOString(),
    };

    const updated = { ...currentAns, ...update };
    const newAnswers = { ...answers, [currentQuestion.id]: updated };
    setAnswers(newAnswers);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveAnswer(currentQuestion.id, updated);
    }, 400);
  };

  // One-click quick test answer filler
  const handleQuickSampleAnswer = () => {
    if (!currentQuestion || isLockedOut) return;
    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false') {
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        handleAnswerChange({ selectedOptionId: currentQuestion.options[0].id });
      }
    } else if (currentQuestion.type === 'multiple_select') {
      if (currentQuestion.options && currentQuestion.options.length >= 2) {
        handleAnswerChange({ selectedOptionIds: [currentQuestion.options[0].id, currentQuestion.options[1].id] });
      }
    } else if (currentQuestion.type === 'short_answer') {
      handleAnswerChange({ textAnswer: 'B-Trees maintain high branching factor to minimize costly disk I/O operations.' });
    } else if (currentQuestion.type === 'essay') {
      handleAnswerChange({
        textAnswer:
          'In modern TLS 1.3 architecture, ephemeral Diffie-Hellman (ECDHE) keys are negotiated dynamically per session, ensuring Perfect Forward Secrecy even if static private certificates are later compromised. Digital signatures signed by accredited Certificate Authorities guarantee entity authentication and prevent man-in-the-middle exploits. In light of quantum computing advancements, Shor\'s algorithm solves discrete logarithms in polynomial time; hence migration to lattice-based post-quantum cryptography (such as ML-KEM/Kyber) is essential to preserve long-term university credential privacy.',
      });
    } else if (currentQuestion.type === 'fill_blank') {
      handleAnswerChange({ textAnswer: 'chaining' });
    } else if (currentQuestion.type === 'matching') {
      const matchMap: Record<string, string> = {};
      currentQuestion.matchingPairs?.forEach((pair) => {
        matchMap[pair.id] = pair.right;
      });
      handleAnswerChange({ matchingSelections: matchMap });
    } else if (currentQuestion.type === 'file_upload') {
      attachSampleFile();
    }
    showToast('Sample response inserted & autosaved.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentQuestion) return;

    const maxMB = currentQuestion.fileUploadConstraint?.maxFileSizeMB || 15;
    if (file.size > maxMB * 1024 * 1024) {
      showToast(`File size exceeds maximum allowed ${maxMB} MB limit.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const uploadRecord: UploadedFileSubmission = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        uploadedAt: new Date().toISOString(),
      };

      handleAnswerChange({ uploadedFile: uploadRecord });
      showToast(`Attached file: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const attachSampleFile = () => {
    const sampleFile: UploadedFileSubmission = {
      fileName: 'Oakridge_Exam_3NF_Schema.sql',
      fileSize: 14280,
      fileType: 'text/x-sql',
      dataUrl:
        'data:text/plain;base64,LS0gT0FVIFVuaXZlcnNpdHkgM05GIFNjaGVtYQpDUkVBVEUgVEFCTEUgdW5pdmVyc2l0aWVzIChpZCB2YXJjaGFyKDUwKSBQUklNQVJZIEtFWSwgbmFtZSB2YXJjaGFyKDEwMCkpOw==',
      uploadedAt: new Date().toISOString(),
    };
    handleAnswerChange({ uploadedFile: sampleFile });
    showToast('Attached sample SQL schema artifact.', 'success');
  };

  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleForceAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitExamSession(session.id);
      confetti({ particleCount: 70, spread: 60 });
      onSubmitted(res.submissionId);
    } catch (err) {
      console.error(err);
      onExit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.submitExamSession(session.id);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onSubmitted(res.submissionId);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit examination', 'error');
      setIsSubmitting(false);
    }
  };

  // Unlock via Proctor PIN
  const handlePinUnlock = async (pinCode: string) => {
    setIsUnlocking(true);
    setPinError('');
    try {
      const res = await api.unlockSessionWithPin(session.id, pinCode);
      setSession(res.session);
      setIsLockedOut(false);
      setTabSwitches(0);
      setShowTabWarning(false);
      showToast('Workstation authorized by proctor. You may now continue your exam.', 'success');
    } catch (err: any) {
      setPinError(err.message || 'Invalid invigilator authorization code.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Restart / Reset Session
  const handleResetSession = async () => {
    if (!confirm('Reset your examination attempt and start fresh? All saved answers will be cleared.')) {
      return;
    }
    try {
      await api.resetExamSession(session.id);
      const newSessionData = await api.startExamSession(exam.id);
      setSession(newSessionData.session);
      setAnswers({});
      setTabSwitches(0);
      setIsLockedOut(false);
      setCurrentQuestionIndex(0);
      setTimeRemaining(newSessionData.session.timeRemainingSeconds);
      showToast('Examination session reset successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset session', 'error');
    }
  };

  const totalQuestions = exam.questions.length;
  const answeredCount = exam.questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'mcq' || q.type === 'true_false') return Boolean(a.selectedOptionId);
    if (q.type === 'multiple_select') return Boolean(a.selectedOptionIds && a.selectedOptionIds.length > 0);
    if (q.type === 'matching') return Boolean(a.matchingSelections && Object.keys(a.matchingSelections).length > 0);
    if (q.type === 'file_upload') return Boolean(a.uploadedFile?.fileName);
    return Boolean(a.textAnswer && a.textAnswer.trim().length > 0);
  }).length;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isTimeCritical = timeRemaining < 300;

  // STRICT LOCKOUT SHIELD OVERLAY WITH UNLOCK RECOVERY
  if (isLockedOut) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-rose-600/70 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-600/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/40">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-rose-400 uppercase font-bold">
              Security Protocol: Session Locked by Anti-Cheat
            </span>
            <h1 className="text-xl font-bold text-white">
              Unauthorized Window / Tab Navigation Detected
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lockoutReason ||
                'In accordance with university examination regulations, your workstation has been locked because you switched tabs or lost focus during proctored testing.'}
            </p>
          </div>

          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Candidate:</span>
              <strong className="text-white">{session.studentName} ({session.studentRollNumber})</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Examination:</span>
              <span className="text-indigo-300 truncate max-w-[220px]">{exam.title}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tab Switches Logged:</span>
              <strong className="text-rose-400 tabular-nums">{tabSwitches}</strong>
            </div>
          </div>

          {/* Invigilator Unlock Section */}
          <div className="p-5 bg-slate-800/90 border border-indigo-500/30 rounded-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Invigilator Authorization Code</span>
              </div>
              <span className="text-[10px] text-indigo-300 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/50">
                Default PIN: PROCTOR2026
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={proctorPin}
                onChange={(e) => setProctorPin(e.target.value)}
                placeholder="Enter Proctor PIN (e.g. PROCTOR2026)"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
              />
              <button
                onClick={() => handlePinUnlock(proctorPin)}
                disabled={isUnlocking || !proctorPin.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isUnlocking ? 'Verifying...' : 'Authorize & Unlock'}</span>
              </button>
            </div>

            {pinError && (
              <div className="text-[11px] text-rose-400 font-medium">{pinError}</div>
            )}

            <div className="pt-2 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                onClick={() => handlePinUnlock('PROCTOR2026')}
                disabled={isUnlocking}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 underline underline-offset-2"
              >
                <Sparkles className="w-3 h-3" />
                <span>Instant Invigilator Pardon (1-Click Test)</span>
              </button>

              <button
                onClick={handleResetSession}
                className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restart Clean Attempt</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onExit}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Return to Student Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast Notification */}
      {playerToast && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {playerToast.type === 'success' ? (
            <div className="bg-emerald-900 text-emerald-100 border-emerald-700 p-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{playerToast.message}</span>
            </div>
          ) : playerToast.type === 'error' ? (
            <div className="bg-rose-900 text-rose-100 border-rose-700 p-2 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{playerToast.message}</span>
            </div>
          ) : (
            <div className="bg-slate-900 text-slate-100 border-slate-700 p-2 rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{playerToast.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Top Testing Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
            EP
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">{exam.title}</h1>
            <div className="text-[11px] text-slate-400">
              {exam.courseCode} · Candidate: <span className="text-slate-200 font-semibold">{session.studentName}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div
          className={`flex items-center gap-2.5 px-4 py-1.5 rounded-lg font-mono font-bold text-sm tabular-nums border transition-colors ${
            isTimeCritical
              ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
              : 'bg-slate-800 text-slate-100 border-slate-700'
          }`}
        >
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-indigo-400'}`} />
          <span>{formatTime(timeRemaining)}</span>
        </div>

        {/* Right: Autosave Status & Submit Button */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-amber-400">
                <Save className="w-3.5 h-3.5 animate-spin" /> Auto-saving...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Saved {lastSavedTime}
              </span>
            ) : (
              <span className="text-rose-400">Sync pending</span>
            )}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* Tab Switch Warning Toast */}
      {showTabWarning && (
        <div className="bg-amber-500 text-slate-900 px-6 py-2.5 text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-slate-900 shrink-0" />
            <span>
              <strong>Warning: Window switch detected ({tabSwitches} / {exam.maxAllowedTabSwitches || 3}).</strong>{' '}
              Leaving this window again will freeze your examination workstation!
            </span>
          </div>
          <button
            onClick={() => setShowTabWarning(false)}
            className="text-[11px] font-bold underline ml-4 hover:text-black cursor-pointer"
          >
            Acknowledge & Stay Focused
          </button>
        </div>
      )}

      {/* Main Examination Viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Renderer (3 cols) */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Question Banner */}
          {currentQuestion && (
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQuestion.topic} · {currentQuestion.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleQuickSampleAnswer}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  title="Insert sample candidate answer for instant testing"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fill Sample Answer</span>
                </button>

                <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                  {currentQuestion.marks} Marks {exam.negativeMarking && currentQuestion.negativeMarks ? `(-${currentQuestion.negativeMarks})` : ''}
                </span>

                <button
                  onClick={() => toggleFlagQuestion(currentQuestion.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    flaggedQuestions[currentQuestion.id]
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQuestion.id] ? 'Flagged' : 'Review Later'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Question Body & Renderer */}
          <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-6">
            {currentQuestion ? (
              <>
                <div className="text-base lg:text-lg font-semibold text-slate-900 leading-relaxed">
                  {currentQuestion.title}
                </div>

                {/* Optional Image */}
                {currentQuestion.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-w-lg">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question diagram"
                      className="w-full object-cover"
                    />
                  </div>
                )}

                {/* 1. MCQ & True/False */}
                {(currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false') && (
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options?.map((opt) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleAnswerChange({ selectedOptionId: opt.id })}
                          className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 font-medium shadow-xs ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQuestion.id}`}
                            id={`opt_${opt.id}`}
                            checked={isSelected}
                            onChange={() => handleAnswerChange({ selectedOptionId: opt.id })}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 shrink-0 cursor-pointer"
                          />
                          <span className="text-sm select-none">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Multiple Select */}
                {currentQuestion.type === 'multiple_select' && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs text-slate-500 font-medium">
                      Select all correct options:
                    </div>
                    {currentQuestion.options?.map((opt) => {
                      const selectedIds = currentAnswer?.selectedOptionIds || [];
                      const isSelected = selectedIds.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            const newIds = isSelected
                              ? selectedIds.filter((id) => id !== opt.id)
                              : [...selectedIds, opt.id];
                            handleAnswerChange({ selectedOptionIds: newIds });
                          }}
                          className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 font-medium shadow-xs ring-1 ring-indigo-500'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`opt_${opt.id}`}
                            checked={isSelected}
                            onChange={() => {
                              const newIds = isSelected
                                ? selectedIds.filter((id) => id !== opt.id)
                                : [...selectedIds, opt.id];
                              handleAnswerChange({ selectedOptionIds: newIds });
                            }}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 shrink-0 cursor-pointer"
                          />
                          <span className="text-sm select-none">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Short Answer */}
                {currentQuestion.type === 'short_answer' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Concise Technical Answer:
                    </label>
                    <input
                      type="text"
                      value={currentAnswer?.textAnswer || ''}
                      onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                      placeholder="Type your concise response here..."
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                )}

                {/* 4. Essay Questions */}
                {currentQuestion.type === 'essay' && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Extended Written Response:
                      </label>
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        {(currentAnswer?.textAnswer || '').trim().split(/\s+/).filter(Boolean).length} Words
                      </span>
                    </div>
                    <textarea
                      rows={9}
                      value={currentAnswer?.textAnswer || ''}
                      onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                      placeholder="Formulate your detailed academic arguments, theorems, and explanations..."
                      className="w-full p-4 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans shadow-2xs"
                    />
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                      <span>Subjective essay marking rubric applied by university examiner upon submission.</span>
                      <button
                        onClick={handleQuickSampleAnswer}
                        className="text-indigo-700 font-semibold underline hover:text-indigo-900 text-[11px]"
                      >
                        Insert Demo Essay Text
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Fill in the Blanks */}
                {currentQuestion.type === 'fill_blank' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Enter Missing Keyword or Term:
                    </label>
                    <div className="max-w-md">
                      <input
                        type="text"
                        value={currentAnswer?.textAnswer || ''}
                        onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                        placeholder="e.g. chaining"
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Matching Questions */}
                {currentQuestion.type === 'matching' && (
                  <div className="space-y-4 pt-2">
                    <div className="text-xs text-slate-500 font-medium">
                      Select matching items from column B:
                    </div>
                    <div className="space-y-3">
                      {currentQuestion.matchingPairs?.map((pair) => {
                        const currentMatch = currentAnswer?.matchingSelections?.[pair.id] || '';
                        return (
                          <div
                            key={pair.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                          >
                            <span className="text-sm font-medium text-slate-800">{pair.left}</span>
                            <select
                              value={currentMatch}
                              onChange={(e) => {
                                const newMatches = {
                                  ...(currentAnswer?.matchingSelections || {}),
                                  [pair.id]: e.target.value,
                                };
                                handleAnswerChange({ matchingSelections: newMatches });
                              }}
                              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            >
                              <option value="">-- Select Matching Concept --</option>
                              {currentQuestion.matchingPairs?.map((p) => (
                                <option key={p.id} value={p.right}>
                                  {p.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. File Upload Questions (Format 08) */}
                {currentQuestion.type === 'file_upload' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-800">Submission Requirements:</span>
                      <p className="text-slate-600">
                        {currentQuestion.fileUploadConstraint?.instructions ||
                          'Upload permitted file document (.pdf, .png, .sql, .zip) under 15MB.'}
                      </p>
                      <div className="text-slate-500 font-mono text-[11px]">
                        Allowed formats: {currentQuestion.fileUploadConstraint?.allowedExtensions.join(', ') || '.pdf, .png, .sql'}
                      </div>
                    </div>

                    <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-4 bg-white">
                      <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto" />
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <label className="cursor-pointer inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs">
                          <span>Browse Local File</span>
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept={currentQuestion.fileUploadConstraint?.allowedExtensions.join(',')}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={attachSampleFile}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs border border-slate-300 flex items-center gap-1.5 transition-colors"
                        >
                          <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Attach Sample SQL DDL</span>
                        </button>
                      </div>

                      {currentAnswer?.uploadedFile && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-center justify-between text-xs max-w-lg mx-auto">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            <div>
                              <div className="font-semibold text-emerald-950">
                                {currentAnswer.uploadedFile.fileName}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono">
                                {Math.round(currentAnswer.uploadedFile.fileSize / 1024)} KB · Uploaded {new Date(currentAnswer.uploadedFile.uploadedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            ATTACHED
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">Question unavailable</div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/70">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-500">
              Completed: <strong className="text-slate-800 tabular-nums">{answeredCount}</strong> of{' '}
              <strong className="text-slate-800 tabular-nums">{totalQuestions}</strong>
            </div>

            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette (1 col) */}
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question Palette
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {answeredCount}/{totalQuestions}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedQuestions[q.id];

                let isAnswered = false;
                if (ans) {
                  if (q.type === 'mcq' || q.type === 'true_false') isAnswered = Boolean(ans.selectedOptionId);
                  else if (q.type === 'multiple_select') isAnswered = Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0);
                  else if (q.type === 'matching') isAnswered = Boolean(ans.matchingSelections && Object.keys(ans.matchingSelections).length > 0);
                  else if (q.type === 'file_upload') isAnswered = Boolean(ans.uploadedFile?.fileName);
                  else isAnswered = Boolean(ans.textAnswer && ans.textAnswer.trim().length > 0);
                }

                let btnClass = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
                if (isAnswered) btnClass = 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold';
                if (isFlagged) btnClass = 'bg-amber-500 text-white border-amber-500 font-bold';
                if (isCurrent) btnClass = 'ring-2 ring-indigo-600 ring-offset-2 ' + btnClass;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-semibold border flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-200 shrink-0" />
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
                <span>Flagged for Review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
            </div>
          </div>

          {/* Quick Simulation & Security Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-rose-700">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Anti-Cheat Proctoring Active</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Maintain full-screen focus. If locked out, use Proctor PIN <code className="bg-slate-200 px-1 py-0.2 rounded font-bold">PROCTOR2026</code> to resume. Solutions remain hidden until formal approval by the Results Officer.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Final Submission?</h3>
              <p className="text-xs text-slate-500">
                Your answers and uploaded files will be locked and archived. Objective questions will be automatically calculated; subjective answers queued for examiner marking.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Total Questions:</span>
                <div className="text-base font-bold text-slate-900 tabular-nums">{totalQuestions}</div>
              </div>
              <div>
                <span className="text-slate-500">Answered:</span>
                <div className="text-base font-bold text-emerald-600 tabular-nums">{answeredCount}</div>
              </div>
              <div>
                <span className="text-slate-500">Unanswered:</span>
                <div className="text-base font-bold text-slate-600 tabular-nums">{totalQuestions - answeredCount}</div>
              </div>
              <div>
                <span className="text-slate-500">Flagged:</span>
                <div className="text-base font-bold text-amber-600 tabular-nums">
                  {Object.values(flaggedQuestions).filter(Boolean).length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Back to Test
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Locking Submission...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
