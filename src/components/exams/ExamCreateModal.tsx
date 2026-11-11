import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Examination, Subject, ClassRoom, Question } from '../../types/index.ts';
import { X, BookOpen, Clock, Calendar, CheckSquare, Plus, Check } from 'lucide-react';

interface ExamCreateModalProps {
  onClose: () => void;
  onCreated: (newExam: Examination) => void;
}

export const ExamCreateModal: React.FC<ExamCreateModalProps> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`EXAM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [subjRes, clsRes, qRes] = await Promise.all([
        api.getSubjects(),
        api.getClasses(),
        api.getQuestions(),
      ]);
      setSubjects(subjRes.subjects);
      setClasses(clsRes.classes);
      setAvailableQuestions(qRes.questions);

      if (subjRes.subjects.length > 0) setSelectedSubjectId(subjRes.subjects[0].id);
      if (clsRes.classes.length > 0) setSelectedClassIds([clsRes.classes[0].id]);
      if (qRes.questions.length > 0) {
        // pre-select first 5 questions
        setSelectedQuestionIds(qRes.questions.slice(0, 5).map((q) => q.id));
      }
    }
    load();
  }, []);

  const selectedQuestions = availableQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  const totalCalculatedMarks = selectedQuestions.reduce((acc, q) => acc + q.marks, 0);
  const passingMarks = Math.round((totalCalculatedMarks * passingPercentage) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Examination title is required.');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      alert('Select at least one question from the question repository.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subj = subjects.find((s) => s.id === selectedSubjectId);
      const selectedClassObjs = classes.filter((c) => selectedClassIds.includes(c.id));

      const payload: Partial<Examination> = {
        title: title.trim(),
        code: code.trim(),
        subjectId: selectedSubjectId,
        subjectName: subj?.name || 'General',
        classIds: selectedClassIds,
        classNames: selectedClassObjs.map((c) => c.name),
        durationMinutes: Number(durationMinutes),
        totalMarks: totalCalculatedMarks,
        passingMarks,
        questions: selectedQuestions,
        status: 'scheduled',
        shuffleQuestions,
        shuffleOptions,
        negativeMarking,
        rules: [
          'Calculators and outside reference materials are strictly prohibited.',
          'Full-screen examination mode is monitored; unnecessary browser tab switches are recorded.',
          'Answers are saved automatically as you input them.',
          'All questions must be submitted before the countdown timer hits 00:00.',
        ],
      };

      const res = await api.createExam(payload);
      onCreated(res.exam);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule examination');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Schedule New Examination</h2>
            <p className="text-xs text-slate-500">Configure duration, assign target cohorts, and curate question items</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Title & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Examination Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Midterm Examination: Advanced Algorithms"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Exam Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>
          </div>

          {/* Subject & Classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Class Cohorts</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {classes.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClassIds((prev) =>
                          isChecked ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {cls.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timing, Marks, Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Passing Mark %</label>
              <input
                type="number"
                min="10"
                max="90"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Passing Score</label>
              <div className="py-2 text-slate-800 font-bold tabular-nums">
                {passingMarks} / {totalCalculatedMarks} pts
              </div>
            </div>
          </div>

          {/* Security & Randomization Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-slate-800 font-medium">Randomize Question Order</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-slate-800 font-medium">Randomize Option Choices</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="text-slate-800 font-medium">Negative Marking</span>
            </label>
          </div>

          {/* Question Selection from Question Bank */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-900 font-bold">
                Select Questions from Repository ({selectedQuestionIds.length} chosen · {totalCalculatedMarks} Total Marks)
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedQuestionIds(
                    selectedQuestionIds.length === availableQuestions.length
                      ? []
                      : availableQuestions.map((q) => q.id)
                  )
                }
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                {selectedQuestionIds.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {availableQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionIds((prev) =>
                        isSelected ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                      );
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs line-clamp-1">{q.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {q.topic} · {q.type.toUpperCase()} · <span className="tabular-nums font-semibold">{q.marks} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
            >
              {isSubmitting ? 'Creating Exam...' : 'Confirm & Schedule Examination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
