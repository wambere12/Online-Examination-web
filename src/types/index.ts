export type UserRole =
  | 'super_admin'
  | 'university_admin'
  | 'school_admin'
  | 'lecturer'
  | 'teacher'
  | 'student'
  | 'invigilator'
  | 'results_officer';

export type QuestionType =
  | 'mcq'
  | 'multiple_select'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'fill_blank'
  | 'matching'
  | 'file_upload';

export type ExamStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'grading'
  | 'pending_approval'
  | 'published';

export type SessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'locked_out'
  | 'submitted'
  | 'timed_out'
  | 'abandoned';

export interface University {
  id: string;
  name: string;
  code: string;
  logo: string;
  domain: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  facultiesCount: number;
  studentCount: number;
  lecturerCount: number;
  teacherCount?: number;
  examCount: number;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
  code: string;
  deanName: string;
  departmentsCount: number;
}

export interface Department {
  id: string;
  facultyId: string;
  universityId: string;
  name: string;
  code: string;
  headOfDepartment: string;
  programsCount: number;
}

export interface AcademicProgram {
  id: string;
  departmentId: string;
  universityId: string;
  name: string;
  code: string;
  degreeLevel: 'undergraduate' | 'postgraduate' | 'diploma';
  durationYears: number;
}

export interface Course {
  id: string;
  departmentId: string;
  universityId: string;
  name: string;
  code: string;
  creditUnits: number;
  departmentName?: string;
  department?: string;
  description?: string;
}

export interface AcademicYear {
  id: string;
  universityId: string;
  name: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface Semester {
  id: string;
  academicYearId: string;
  universityId: string;
  name: string;
  semesterNumber: number;
  isCurrent: boolean;
}

export interface ClassCohort {
  id: string;
  universityId: string;
  programId: string;
  semesterId: string;
  name: string;
  level: string;
  gradeLevel?: string;
  studentCount: number;
}

export interface UserProfile {
  id: string;
  universityId: string;
  universityName?: string;
  schoolId?: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  studentId?: string;
  employeeId?: string;
  facultyId?: string;
  departmentId?: string;
  programId?: string;
  programName?: string;
  classCohortId?: string;
  classCohortName?: string;
  classId?: string;
  className?: string;
  coursesTaught?: string[];
  subjects?: string[];
  lastLogin?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface FileUploadConstraint {
  allowedExtensions: string[];
  maxFileSizeMB: number;
  instructions?: string;
}

export interface Question {
  id: string;
  universityId: string;
  schoolId?: string;
  courseId: string;
  subjectId?: string;
  courseName?: string;
  subjectName?: string;
  courseCode?: string;
  topic: string;
  type: QuestionType;
  title: string;
  marks: number;
  negativeMarks?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  rubric?: string;
  explanation?: string;
  matchingPairs?: MatchingPair[];
  fillBlanks?: string[];
  fileUploadConstraint?: FileUploadConstraint;
}

export interface Examination {
  id: string;
  universityId: string;
  schoolId?: string;
  universityName?: string;
  schoolName?: string;
  facultyId?: string;
  departmentId?: string;
  courseId: string;
  subjectId?: string;
  courseCode: string;
  courseName: string;
  subjectName?: string;
  title: string;
  code: string;
  cohortIds: string[];
  classIds?: string[];
  cohortNames?: string[];
  classNames?: string[];
  createdById: string;
  createdByName: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  questions: Question[];
  rules: string[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarking: boolean;
  allowReview: boolean;
  strictTabLockout: boolean;
  maxAllowedTabSwitches: number;
  resultsPublished: boolean;
  publishedAt?: string;
  resultsApprovedBy?: string;
  resultsApprovedAt?: string;
  resultsApprovalNotes?: string;
  totalCandidates: number;
  submittedCount: number;
  pendingGradingCount: number;
}

export interface UploadedFileSubmission {
  fileName: string;
  fileSize: number;
  fileType: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  matchingSelections?: Record<string, string>;
  uploadedFile?: UploadedFileSubmission;
  isFlaggedForReview?: boolean;
  savedAt: string;
  marksAwarded?: number;
  examinerFeedback?: string;
  isManuallyGraded?: boolean;
}

export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  universityId: string;
  status: SessionStatus;
  startedAt: string;
  endsAt: string;
  submittedAt?: string;
  timeRemainingSeconds: number;
  answers: Record<string, StudentAnswer>;
  tabSwitches: number;
  isLockedOutDueToTabSwitch: boolean;
  lockoutReason?: string;
  extraTimeMinutes: number;
  ipAddress?: string;
  lastHeartbeat: string;
}

export interface ExamSubmission {
  id: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  courseCode: string;
  courseName: string;
  subjectName?: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  universityId: string;
  submittedAt: string;
  totalMarks: number;
  obtainedMarks: number;
  passingMarks: number;
  isPassed: boolean;
  autoGradedMarks: number;
  subjectiveMarks: number;
  requiresManualGrading: boolean;
  isFullyGraded: boolean;
  approvedByResultsOfficer: boolean;
  resultsPublished: boolean;
  percentage?: number;
  letterGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  gpaPoints?: number;
  rank?: number;
  answers: Record<string, StudentAnswer>;
}

export interface InvigilationIncident {
  id: string;
  examId: string;
  sessionId: string;
  studentName: string;
  incidentType:
    | 'tab_switch'
    | 'window_blurred'
    | 'connectivity_loss'
    | 'extra_time_granted'
    | 'suspicious_behavior'
    | 'lockout_triggered'
    | 'timeout';
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  universityId: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'exam' | 'marking' | 'approval' | 'admin' | 'security';
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface SystemAnnouncement {
  id: string;
  universityId: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  targetRole: 'all' | 'students' | 'lecturers' | 'teachers' | 'invigilators';
  createdAt: string;
}

export type School = University;
export type ClassRoom = ClassCohort;
export type Subject = Course;
