import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardOverview } from './components/dashboard/DashboardOverview.tsx';
import { StudentPortal } from './components/student/StudentPortal.tsx';
import { ExamList } from './components/exams/ExamList.tsx';
import { QuestionBankView } from './components/questions/QuestionBankView.tsx';
import { LiveInvigilationConsole } from './components/invigilation/LiveInvigilationConsole.tsx';
import { TeacherGradingQueue } from './components/grading/TeacherGradingQueue.tsx';
import { ResultsOfficerApprovalView } from './components/results/ResultsOfficerApprovalView.tsx';
import { ResultsAnalyticsView } from './components/results/ResultsAnalyticsView.tsx';
import { SchoolManagementView } from './components/schools/SchoolManagementView.tsx';
import { AcademicRosterView } from './components/academic/AcademicRosterView.tsx';
import { AuditLogsView } from './components/audit/AuditLogsView.tsx';
import { Palette } from 'lucide-react';

interface BgTheme {
  id: string;
  name: string;
  containerClass: string;
  mainClass: string;
  isDark?: boolean;
}

const BG_THEMES: BgTheme[] = [
  {
    id: 'slate_light',
    name: 'Academic Slate (Default)',
    containerClass: 'bg-slate-100 text-slate-900',
    mainClass: 'bg-slate-100',
  },
  {
    id: 'parchment_warm',
    name: 'Scholarly Warm Parchment',
    containerClass: 'bg-stone-100 text-stone-900',
    mainClass: 'bg-stone-100',
  },
  {
    id: 'oxford_midnight',
    name: 'Oxford Midnight Dark',
    containerClass: 'bg-slate-950 text-slate-100',
    mainClass: 'bg-slate-950',
    isDark: true,
  },
  {
    id: 'cambridge_blue',
    name: 'Cambridge Azure Crisp',
    containerClass: 'bg-sky-50 text-slate-900',
    mainClass: 'bg-sky-50',
  },
  {
    id: 'pure_minimal',
    name: 'High-Contrast Studio Canvas',
    containerClass: 'bg-neutral-100 text-neutral-900',
    mainClass: 'bg-neutral-100',
  },
];

function MainLayout() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [themeIndex, setThemeIndex] = useState<number>(() => {
    const saved = localStorage.getItem('exampro_bg_theme_idx');
    return saved !== null ? Number(saved) % BG_THEMES.length : 0;
  });
  const [showToast, setShowToast] = useState(false);

  const currentTheme = BG_THEMES[themeIndex];

  const handleCycleBackground = () => {
    const nextIdx = (themeIndex + 1) % BG_THEMES.length;
    setThemeIndex(nextIdx);
    localStorage.setItem('exampro_bg_theme_idx', String(nextIdx));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  // Double-click listener on background
  const handleDoubleClick = (e: React.MouseEvent) => {
    // Only trigger if double-clicking on non-input, non-interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }
    handleCycleBackground();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-slate-600 tracking-wide">
            Initializing ExamPro University Edition...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${currentTheme.containerClass}`}
      title="Double-click background anytime to cycle themes"
    >
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className={`flex-1 overflow-y-auto transition-colors duration-300 ${currentTheme.mainClass}`}>
          {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
          {activeTab === 'student_portal' && (
            <StudentPortal onOpenResult={() => setActiveTab('results')} />
          )}
          {activeTab === 'exams' && <ExamList setActiveTab={setActiveTab} />}
          {activeTab === 'questions' && <QuestionBankView />}
          {activeTab === 'invigilation' && <LiveInvigilationConsole />}
          {activeTab === 'grading' && (
            <TeacherGradingQueue onResultsPublished={() => setActiveTab('results')} />
          )}
          {activeTab === 'approval' && (
            <ResultsOfficerApprovalView onApproved={() => setActiveTab('results')} />
          )}
          {activeTab === 'results' && <ResultsAnalyticsView />}
          {activeTab === 'schools' && <SchoolManagementView />}
          {activeTab === 'academic' && <AcademicRosterView />}
          {activeTab === 'audit' && <AuditLogsView />}
        </main>
      </div>

      {/* Floating Theme Switcher & Double Click Prompt */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={handleCycleBackground}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 text-white hover:bg-slate-900 text-xs font-semibold rounded-full shadow-lg border border-slate-700 backdrop-blur-xs transition-all hover:scale-105 active:scale-95"
          title="Double-click canvas or click here to change background"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Change Background (Double-Click)</span>
        </button>
      </div>

      {/* Temporary Toast Notification on Theme Switch */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Background changed to: <strong>{currentTheme.name}</strong> (Double-click anywhere to cycle)
          </span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
