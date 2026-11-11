import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { Question, QuestionType, Subject } from '../../types/index.ts';
import { QuestionCreateModal } from './QuestionCreateModal.tsx';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const QuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        api.getQuestions({
          subjectId: selectedSubject || undefined,
          type: selectedType || undefined,
          difficulty: selectedDifficulty || undefined,
        }),
        api.getSubjects(),
      ]);
      setQuestions(qRes.questions);
      setSubjects(sRes.subjects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSubject, selectedType, selectedDifficulty]);

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <FileQuestion className="w-4 h-4" />
            <span>Master Assessment Repository</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Institutional Question Bank</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate and categorize standardized questions across all subject disciplines and formats.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, question text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Question Types</option>
            <option value="mcq">MCQ (Single Choice)</option>
            <option value="multiple_select">Multiple Select</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Subjective Essay</option>
            <option value="fill_blank">Fill in Blank</option>
            <option value="matching">Matching Pairs</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="text-slate-500 tabular-nums">
          Showing <strong className="text-slate-900">{filteredQuestions.length}</strong> questions
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
            No questions found matching your filter criteria.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Zero-Pill Unboxed Metadata separated by · */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-indigo-700">{q.subjectName || 'General'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{q.type.replace('_', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{q.difficulty} difficulty</span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">{q.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                      {q.marks} Marks {q.negativeMarks ? `(-${q.negativeMarks})` : ''}
                    </span>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Options, Rubrics, Solution */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 text-xs space-y-3">
                    {/* Options if MCQ / Multiple Select */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-700">Answer Options:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                opt.isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{opt.text}</span>
                              {opt.isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Pairs */}
                    {q.matchingPairs && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-700">Matching Pairs:</span>
                        <div className="space-y-1">
                          {q.matchingPairs.map((p) => (
                            <div key={p.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                              <span className="font-medium text-slate-800">{p.left}</span>
                              <span className="text-slate-400">⟶</span>
                              <span className="font-medium text-indigo-700">{p.right}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rubric for subjective */}
                    {q.rubric && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                        <span className="font-bold text-amber-900">Marking Rubric:</span>
                        <p className="text-amber-800 text-[11px] leading-relaxed">{q.rubric}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                        <span className="font-bold text-indigo-900">Educational Explanation:</span>
                        <p className="text-indigo-800 text-[11px] leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <QuestionCreateModal
          subjects={subjects}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newQ) => {
            setQuestions((prev) => [newQ, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};
