import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import type { Question, QuestionType, Course } from '../../types/index.ts';
import { X, Plus, Trash2, UploadCloud } from 'lucide-react';

interface QuestionCreateModalProps {
  subjects: Course[];
  onClose: () => void;
  onCreated: (newQ: Question) => void;
}

export const QuestionCreateModal: React.FC<QuestionCreateModalProps> = ({
  subjects,
  onClose,
  onCreated,
}) => {
  const [type, setType] = useState<QuestionType>('mcq');
  const [courseId, setCourseId] = useState<string>(subjects[0]?.id || 'crs_cs201');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [marks, setMarks] = useState(5);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [imageUrl, setImageUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [rubric, setRubric] = useState('');

  // Options for MCQ & Multiple select
  const [options, setOptions] = useState([
    { id: 'opt_1', text: 'Option A', isCorrect: true },
    { id: 'opt_2', text: 'Option B', isCorrect: false },
    { id: 'opt_3', text: 'Option C', isCorrect: false },
    { id: 'opt_4', text: 'Option D', isCorrect: false },
  ]);

  // True/False
  const [tfCorrect, setTfCorrect] = useState<'opt_true' | 'opt_false'>('opt_true');

  // Fill in blanks
  const [fillBlankKeywords, setFillBlankKeywords] = useState('chaining, hash');

  // Matching pairs
  const [matchingPairs, setMatchingPairs] = useState([
    { id: 'm_1', left: 'Merge Sort', right: 'Divide and Conquer' },
    { id: 'm_2', left: 'Kruskal Algorithm', right: 'Greedy' },
  ]);

  // File Upload Constraint (Format 08)
  const [allowedExtensions, setAllowedExtensions] = useState('.pdf, .png, .sql, .zip');
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(15);
  const [fileInstructions, setFileInstructions] = useState('Upload your verified project artifact or diagram.');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Question title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCourse = subjects.find((s) => s.id === courseId);
      let payload: Partial<Question> = {
        courseId,
        courseCode: selectedCourse?.code || 'CS-201',
        courseName: selectedCourse?.name || 'Computer Science',
        topic: topic.trim() || 'General',
        type,
        title: title.trim(),
        marks: Number(marks),
        negativeMarks: Number(negativeMarks),
        difficulty,
        imageUrl: imageUrl.trim() || undefined,
        explanation: explanation.trim() || undefined,
        rubric: rubric.trim() || undefined,
      };

      if (type === 'mcq') {
        const correctOpt = options.find((o) => o.isCorrect);
        payload.options = options;
        payload.correctAnswer = correctOpt ? correctOpt.id : options[0].id;
      } else if (type === 'multiple_select') {
        payload.options = options;
        payload.correctAnswer = options.filter((o) => o.isCorrect).map((o) => o.id);
      } else if (type === 'true_false') {
        payload.options = [
          { id: 'opt_true', text: 'True', isCorrect: tfCorrect === 'opt_true' },
          { id: 'opt_false', text: 'False', isCorrect: tfCorrect === 'opt_false' },
        ];
        payload.correctAnswer = tfCorrect;
      } else if (type === 'fill_blank') {
        payload.fillBlanks = fillBlankKeywords.split(',').map((k) => k.trim().toLowerCase());
      } else if (type === 'matching') {
        payload.matchingPairs = matchingPairs;
      } else if (type === 'file_upload') {
        payload.fileUploadConstraint = {
          allowedExtensions: allowedExtensions.split(',').map((e) => e.trim().toLowerCase()),
          maxFileSizeMB: Number(maxFileSizeMB) || 15,
          instructions: fileInstructions.trim(),
        };
      }

      const res = await api.createQuestion(payload);
      onCreated(res.question);
    } catch (err: any) {
      alert(err.message || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Question to Bank</h2>
            <p className="text-xs text-slate-500">Supports all 8 university question formats</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Question Type & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Question Format</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="mcq">01. Multiple Choice Questions (MCQ)</option>
                <option value="multiple_select">02. Multiple Select Questions</option>
                <option value="true_false">03. True or False</option>
                <option value="short_answer">04. Short Answer</option>
                <option value="essay">05. Essay Questions (Subjective)</option>
                <option value="fill_blank">06. Fill in the Blanks</option>
                <option value="matching">07. Matching Questions</option>
                <option value="file_upload">08. File Upload Questions (Reports, ERDs, Code)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Course / Module</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Academic Topic / Unit</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g. Binary Search Trees, 3NF Normalization"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Question Prompt / Statement *</label>
            <textarea
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="State the academic question or problem clearly..."
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 leading-relaxed font-sans"
              required
            />
          </div>

          {/* Marks & Negative Marks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Allocated Marks</label>
              <input
                type="number"
                min="1"
                max="100"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Negative Marks</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>

          {/* FORMAT 08: FILE UPLOAD CONFIGURATION */}
          {type === 'file_upload' && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Format 08: File Upload Configuration</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Permitted File Extensions</label>
                  <input
                    type="text"
                    value={allowedExtensions}
                    onChange={(e) => setAllowedExtensions(e.target.value)}
                    placeholder=".pdf, .png, .sql, .zip"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxFileSizeMB}
                    onChange={(e) => setMaxFileSizeMB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload Instructions for Candidate</label>
                <input
                  type="text"
                  value={fileInstructions}
                  onChange={(e) => setFileInstructions(e.target.value)}
                  placeholder="E.g. Upload a single zipped folder containing your source code and documentation."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* MCQ Options */}
          {(type === 'mcq' || type === 'multiple_select') && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Options (Mark correct answer):</span>
                <button
                  type="button"
                  onClick={() =>
                    setOptions([
                      ...options,
                      { id: `opt_${Date.now()}`, text: `Option ${options.length + 1}`, isCorrect: false },
                    ])
                  }
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Choice
                </button>
              </div>

              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type={type === 'mcq' ? 'radio' : 'checkbox'}
                    name="correct-opt"
                    checked={opt.isCorrect}
                    onChange={() => {
                      if (type === 'mcq') {
                        setOptions(options.map((o) => ({ ...o, isCorrect: o.id === opt.id })));
                      } else {
                        setOptions(
                          options.map((o) => (o.id === opt.id ? { ...o, isCorrect: !o.isCorrect } : o))
                        );
                      }
                    }}
                    className="rounded text-indigo-600"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setOptions(options.map((o) => (o.id === opt.id ? { ...o, text } : o)));
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((o) => o.id !== opt.id))}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* True / False */}
          {type === 'true_false' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-slate-700 font-semibold">Correct Answer</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf"
                    checked={tfCorrect === 'opt_true'}
                    onChange={() => setTfCorrect('opt_true')}
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf"
                    checked={tfCorrect === 'opt_false'}
                    onChange={() => setTfCorrect('opt_false')}
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* Fill In Blank */}
          {type === 'fill_blank' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <label className="block text-slate-700 font-semibold">Acceptable Keywords (comma-separated)</label>
              <input
                type="text"
                value={fillBlankKeywords}
                onChange={(e) => setFillBlankKeywords(e.target.value)}
                placeholder="e.g. chaining, separate chaining"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
              />
            </div>
          )}

          {/* Rubrics for Subjective, Essay, Short Answer & File Upload */}
          {(type === 'essay' || type === 'short_answer' || type === 'file_upload') && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <label className="block text-slate-700 font-semibold">Examiner Evaluation Rubric</label>
              <textarea
                rows={2}
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Specific marking rubric criteria for manual grading..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md"
              />
            </div>
          )}

          {/* Educational Solution */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Solution Explanation (strictly hidden until Results Officer ratifies & publishes results)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Comprehensive academic explanation for post-publication student feedback..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-md"
            />
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
              {isSubmitting ? 'Saving...' : 'Add to Question Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
