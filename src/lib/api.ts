import type {
  UserProfile,
  University,
  Faculty,
  Department,
  AcademicProgram,
  Course,
  AcademicYear,
  Semester,
  ClassCohort,
  Question,
  Examination,
  ExamSession,
  ExamSubmission,
  InvigilationIncident,
  AuditLog,
  SystemAnnouncement,
  StudentAnswer,
} from '../types/index.ts';

const TOKEN_KEY = 'exampro_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(payload: { email?: string; password?: string; role?: string }) {
    const data = await request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    return data;
  },

  async getCurrentUser() {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async getDemoUsers() {
    return request<{ users: UserProfile[] }>('/api/auth/demo-users');
  },

  logout() {
    setStoredToken(null);
  },

  // Universities
  async getUniversities() {
    return request<{ universities: University[]; schools: University[] }>('/api/universities');
  },
  async getSchools() {
    return request<{ schools: University[] }>('/api/schools');
  },

  async createUniversity(payload: Partial<University>) {
    return request<{ university: University; school: University }>('/api/universities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async createSchool(payload: Partial<University>) {
    return this.createUniversity(payload);
  },

  async updateSchoolStatus(id: string, status: string) {
    return request<{ school: University }>(`/api/schools/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Academic Hierarchy
  async getFaculties() {
    return request<{ faculties: Faculty[] }>('/api/faculties');
  },

  async getDepartments() {
    return request<{ departments: Department[] }>('/api/departments');
  },

  async getPrograms() {
    return request<{ programs: AcademicProgram[] }>('/api/programs');
  },

  async getCourses() {
    return request<{ courses: Course[]; subjects: Course[] }>('/api/courses');
  },
  async getSubjects() {
    return request<{ subjects: Course[] }>('/api/subjects');
  },

  async createCourse(payload: Partial<Course>) {
    return request<{ course: Course; subject: Course }>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async createSubject(payload: Partial<Course>) {
    return this.createCourse(payload);
  },

  async getClasses() {
    return request<{ classes: ClassCohort[]; cohorts: ClassCohort[] }>('/api/classes');
  },

  async createClass(payload: Partial<ClassCohort>) {
    return request<{ classRoom: ClassCohort; cohort: ClassCohort }>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Users
  async getUsers(params: { role?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.append('role', params.role);
    return request<{ users: UserProfile[] }>(`/api/users?${searchParams.toString()}`);
  },

  async createUser(payload: Partial<UserProfile> & { password?: string }) {
    return request<{ user: UserProfile }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Questions (all 8 types)
  async getQuestions(params: { courseId?: string; subjectId?: string; type?: string; difficulty?: string } = {}) {
    const searchParams = new URLSearchParams();
    const cId = params.courseId || params.subjectId;
    if (cId) searchParams.append('courseId', cId);
    if (params.type) searchParams.append('type', params.type);
    if (params.difficulty) searchParams.append('difficulty', params.difficulty);
    return request<{ questions: Question[] }>(`/api/questions?${searchParams.toString()}`);
  },

  async createQuestion(payload: Partial<Question>) {
    return request<{ question: Question }>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Examinations
  async getExams(params: { status?: string; courseId?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.courseId) searchParams.append('courseId', params.courseId);
    return request<{ exams: Examination[] }>(`/api/exams?${searchParams.toString()}`);
  },

  async getExamById(id: string) {
    return request<{ exam: Examination }>(`/api/exams/${id}`);
  },

  async createExam(payload: Partial<Examination>) {
    return request<{ exam: Examination }>('/api/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async approveExamResults(id: string, notes?: string) {
    return request<{ message: string; exam: Examination }>(`/api/exams/${id}/approve-results`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async publishExamResults(id: string) {
    return request<{ message: string; exam: Examination }>(`/api/exams/${id}/publish-results`, {
      method: 'PATCH',
    });
  },

  // Student Test Taking Sessions
  async startExamSession(examId: string) {
    return request<{ session: ExamSession; exam: Examination }>('/api/exam-sessions/start', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    });
  },

  async saveStudentAnswer(sessionId: string, questionId: string, answer: Partial<StudentAnswer>) {
    return request<{ success: boolean; savedAt: string }>(`/api/exam-sessions/${sessionId}/save-answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  },

  async reportTabSwitch(sessionId: string) {
    return request<{ tabSwitches: number; maxAllowed: number; isLockedOut: boolean; status: string }>(
      `/api/exam-sessions/${sessionId}/tab-switch`,
      {
        method: 'POST',
      }
    );
  },

  async sendSessionHeartbeat(sessionId: string) {
    return request<{ status: string; isLockedOut: boolean; timeRemainingSeconds: number; tabSwitches: number }>(
      `/api/exam-sessions/${sessionId}/heartbeat`,
      {
        method: 'POST',
      }
    );
  },

  async unlockExamSession(sessionId: string) {
    return request<{ message: string; session: ExamSession }>(
      `/api/exam-sessions/${sessionId}/unlock`,
      {
        method: 'POST',
      }
    );
  },

  async submitExamSession(sessionId: string) {
    return request<{
      message: string;
      submissionId: string;
      submission: Partial<ExamSubmission>;
    }>(`/api/exam-sessions/${sessionId}/submit`, {
      method: 'POST',
    });
  },

  // Invigilation
  async getInvigilationData(examId: string) {
    return request<{ sessions: ExamSession[]; incidents: InvigilationIncident[] }>(
      `/api/invigilation/${examId}`
    );
  },

  async logInvigilationIncident(
    sessionId: string,
    payload: {
      incidentType: string;
      description: string;
      severity: string;
      extraTimeMinutes?: number;
    }
  ) {
    return request<{ incident: InvigilationIncident; session: ExamSession }>(
      `/api/invigilation/${sessionId}/incident`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Grading & Submissions
  async getSubmissionsForExam(examId: string) {
    return request<{ submissions: ExamSubmission[] }>(`/api/submissions/${examId}`);
  },

  async getSubmissionDetail(id: string) {
    return request<{ submission: ExamSubmission; exam: Examination }>(`/api/submission-detail/${id}`);
  },

  async markSubjectiveQuestion(
    submissionId: string,
    payload: { questionId: string; marksAwarded: number; feedback: string }
  ) {
    return request<{ success: boolean; submission: ExamSubmission }>(
      `/api/submissions/${submissionId}/mark-question`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Student Results History
  async getStudentResults() {
    return request<{ results: ExamSubmission[] }>('/api/student/my-results');
  },

  // Dashboard & Logs
  async getDashboardStats() {
    return request<{
      totalUniversities: number;
      totalFaculties: number;
      totalDepartments: number;
      totalPrograms: number;
      totalStudents: number;
      totalLecturers: number;
      totalExams: number;
      activeExamsCount: number;
      completedExamsCount: number;
      pendingGradingCount: number;
      pendingApprovalCount: number;
      passRate: number;
      avgScore: number;
      recentExams: Examination[];
      recentIncidents: InvigilationIncident[];
      announcements: SystemAnnouncement[];
    }>('/api/dashboard/stats');
  },

  async getAuditLogs() {
    return request<{ logs: AuditLog[] }>('/api/audit-logs');
  },

  async getAnnouncements() {
    return request<{ announcements: SystemAnnouncement[] }>('/api/announcements');
  },

  async createAnnouncement(payload: { title: string; content: string; priority: string; targetRole: string }) {
    return request<{ announcement: SystemAnnouncement }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
