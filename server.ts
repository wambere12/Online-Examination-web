import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import type {
  University,
  Faculty,
  Department,
  AcademicProgram,
  Course,
  AcademicYear,
  Semester,
  ClassCohort,
  UserProfile,
  Question,
  Examination,
  ExamSession,
  ExamSubmission,
  InvigilationIncident,
  AuditLog,
  SystemAnnouncement,
  StudentAnswer,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'exampro-enterprise-jwt-token-secret-key-2026';

app.use(express.json({ limit: '25mb' }));

// In-Memory University Relational Database Store
class ExamProUniversityDatabase {
  universities: University[] = [];
  faculties: Faculty[] = [];
  departments: Department[] = [];
  programs: AcademicProgram[] = [];
  courses: Course[] = [];
  academicYears: AcademicYear[] = [];
  semesters: Semester[] = [];
  cohorts: ClassCohort[] = [];
  users: (UserProfile & { passwordHash: string })[] = [];
  questions: Question[] = [];
  examinations: Examination[] = [];
  sessions: Map<string, ExamSession> = new Map();
  submissions: Map<string, ExamSubmission> = new Map();
  incidents: InvigilationIncident[] = [];
  auditLogs: AuditLog[] = [];
  announcements: SystemAnnouncement[] = [];

  constructor() {
    this.seedUniversityData();
  }

  private seedUniversityData() {
    // 1. Universities
    this.universities = [
      {
        id: 'univ_oakridge',
        name: 'Oakridge Apex University',
        code: 'OAU-1892',
        logo: '/src/assets/images/oakridge_academy_crest_1794398618229.jpg',
        domain: 'oau.edu',
        email: 'chancellor@oau.edu',
        phone: '+1 (555) 234-8900',
        address: '742 University Avenue, Academic District, Boston, MA',
        status: 'active',
        createdAt: '2024-01-15T08:00:00Z',
        facultiesCount: 4,
        studentCount: 12400,
        lecturerCount: 480,
        examCount: 68,
      },
      {
        id: 'univ_metrotech',
        name: 'Metropolitan Polytechnic University',
        code: 'MPU-2024',
        logo: '/src/assets/images/metro_tech_crest_1794398619079.jpg',
        domain: 'mpu.edu',
        email: 'registrar@mpu.edu',
        phone: '+1 (555) 890-4321',
        address: '100 Innovation Boulevard, Tech Park, Austin, TX',
        status: 'active',
        createdAt: '2024-03-01T09:00:00Z',
        facultiesCount: 5,
        studentCount: 18500,
        lecturerCount: 620,
        examCount: 84,
      },
    ];

    // 2. Faculties
    this.faculties = [
      {
        id: 'fac_ict',
        universityId: 'univ_oakridge',
        name: 'Faculty of Information & Communication Technology',
        code: 'FICT',
        deanName: 'Prof. Eleanor Vance, Ph.D.',
        departmentsCount: 2,
      },
      {
        id: 'fac_business',
        universityId: 'univ_oakridge',
        name: 'Faculty of Business & Economic Sciences',
        code: 'FBES',
        deanName: 'Dr. Gregory Sterling, MBA',
        departmentsCount: 2,
      },
    ];

    // 3. Departments
    this.departments = [
      {
        id: 'dept_csse',
        facultyId: 'fac_ict',
        universityId: 'univ_oakridge',
        name: 'Department of Computer Science & Software Engineering',
        code: 'CSSE',
        headOfDepartment: 'Dr. Alan Turing Wright',
        programsCount: 2,
      },
      {
        id: 'dept_is',
        facultyId: 'fac_ict',
        universityId: 'univ_oakridge',
        name: 'Department of Information Systems & Cyber Security',
        code: 'ISCS',
        headOfDepartment: 'Dr. Katherine Bell',
        programsCount: 1,
      },
      {
        id: 'dept_finc',
        facultyId: 'fac_business',
        universityId: 'univ_oakridge',
        name: 'Department of Accounting, Finance & Economics',
        code: 'AFE',
        headOfDepartment: 'Prof. Simon Hayes',
        programsCount: 1,
      },
    ];

    // 4. Academic Programs
    this.programs = [
      {
        id: 'prog_bsc_cs',
        departmentId: 'dept_csse',
        universityId: 'univ_oakridge',
        name: 'B.Sc. (Hons) in Computer Science',
        code: 'BSC-CS',
        degreeLevel: 'undergraduate',
        durationYears: 4,
      },
      {
        id: 'prog_bsc_se',
        departmentId: 'dept_csse',
        universityId: 'univ_oakridge',
        name: 'B.Sc. in Software Engineering',
        code: 'BSC-SE',
        degreeLevel: 'undergraduate',
        durationYears: 4,
      },
      {
        id: 'prog_bba',
        departmentId: 'dept_finc',
        universityId: 'univ_oakridge',
        name: 'Bachelor of Business Administration (BBA)',
        code: 'BBA',
        degreeLevel: 'undergraduate',
        durationYears: 3,
      },
    ];

    // 5. Courses
    this.courses = [
      {
        id: 'crs_cs201',
        departmentId: 'dept_csse',
        universityId: 'univ_oakridge',
        name: 'Advanced Data Structures & Algorithms',
        code: 'CS-201',
        creditUnits: 4,
        departmentName: 'Computer Science',
        description: 'Comprehensive study of asymptotic complexity, balanced trees, graph theory, and algorithmic design.',
      },
      {
        id: 'crs_cs305',
        departmentId: 'dept_csse',
        universityId: 'univ_oakridge',
        name: 'Relational Database Systems & SQL Optimization',
        code: 'CS-305',
        creditUnits: 3,
        departmentName: 'Computer Science',
        description: 'PostgreSQL schema modeling, normal forms, transaction isolation levels, indexing, and query tuning.',
      },
      {
        id: 'crs_se401',
        departmentId: 'dept_csse',
        universityId: 'univ_oakridge',
        name: 'Distributed Cloud Systems & Microservices',
        code: 'SE-401',
        creditUnits: 4,
        departmentName: 'Software Engineering',
        description: 'Event-driven architectures, consensus protocols, REST/gRPC services, and resilient deployments.',
      },
      {
        id: 'crs_finc101',
        departmentId: 'dept_finc',
        universityId: 'univ_oakridge',
        name: 'Principles of Financial Accounting & Auditing',
        code: 'ACC-101',
        creditUnits: 3,
        departmentName: 'Finance',
        description: 'Balance sheets, income statements, GAAP standards, and university internal control systems.',
      },
    ];

    // 6. Academic Years & Semesters
    this.academicYears = [
      {
        id: 'ay_2025_2026',
        universityId: 'univ_oakridge',
        name: '2025/2026 Academic Session',
        isCurrent: true,
        startDate: '2025-09-01',
        endDate: '2026-06-30',
      },
    ];

    this.semesters = [
      {
        id: 'sem_1_2025',
        academicYearId: 'ay_2025_2026',
        universityId: 'univ_oakridge',
        name: 'Semester 1 (Autumn Term)',
        semesterNumber: 1,
        isCurrent: true,
      },
      {
        id: 'sem_2_2026',
        academicYearId: 'ay_2025_2026',
        universityId: 'univ_oakridge',
        name: 'Semester 2 (Spring Term)',
        semesterNumber: 2,
        isCurrent: false,
      },
    ];

    // 7. Class Cohorts
    this.cohorts = [
      {
        id: 'coh_cs_year2_alpha',
        universityId: 'univ_oakridge',
        programId: 'prog_bsc_cs',
        semesterId: 'sem_1_2025',
        name: 'CS Year 2 — Cohort Alpha',
        level: '200 Level',
        studentCount: 42,
      },
      {
        id: 'coh_cs_year2_beta',
        universityId: 'univ_oakridge',
        programId: 'prog_bsc_cs',
        semesterId: 'sem_1_2025',
        name: 'CS Year 2 — Cohort Beta',
        level: '200 Level',
        studentCount: 38,
      },
      {
        id: 'coh_se_year3',
        universityId: 'univ_oakridge',
        programId: 'prog_bsc_se',
        semesterId: 'sem_1_2025',
        name: 'Software Engineering Year 3 Scholars',
        level: '300 Level',
        studentCount: 35,
      },
    ];

    // 8. 6 Demo Users across all required university roles
    const defaultHash = bcrypt.hashSync('Password123!', 8);
    this.users = [
      {
        id: 'usr_superadmin',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'super_admin',
        name: 'Dr. Arthur Vance',
        email: 'superadmin@exampro.edu',
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_uniadmin',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'university_admin',
        name: 'Elena Rostova, M.Ed.',
        email: 'admin@oau.edu',
        employeeId: 'ADM-101',
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_lecturer',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'lecturer',
        name: 'Prof. Marcus Sterling, D.Sc.',
        email: 'm.sterling@oau.edu',
        employeeId: 'LEC-409',
        departmentId: 'dept_csse',
        coursesTaught: ['crs_cs201', 'crs_cs305'],
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_student',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'student',
        name: 'Liam Chen',
        email: 'liam.chen@student.oau.edu',
        studentId: 'STU-2026-081',
        programId: 'prog_bsc_cs',
        programName: 'B.Sc. Computer Science',
        classCohortId: 'coh_cs_year2_alpha',
        classCohortName: 'CS Year 2 — Cohort Alpha',
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_invigilator',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'invigilator',
        name: 'Officer Sarah Jenkins',
        email: 'invigilator@oau.edu',
        employeeId: 'INV-305',
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'usr_resultsofficer',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        role: 'results_officer',
        name: 'Dean Robert Thorne, Ph.D.',
        email: 'results.officer@oau.edu',
        employeeId: 'RO-202',
        facultyId: 'fac_ict',
        passwordHash: defaultHash,
        lastLogin: new Date().toISOString(),
      },
      // Additional student candidates for live monitoring
      {
        id: 'usr_student_2',
        universityId: 'univ_oakridge',
        role: 'student',
        name: 'Sophia Martinez',
        email: 'sophia.m@student.oau.edu',
        studentId: 'STU-2026-082',
        programId: 'prog_bsc_cs',
        classCohortId: 'coh_cs_year2_alpha',
        classCohortName: 'CS Year 2 — Cohort Alpha',
        passwordHash: defaultHash,
      },
      {
        id: 'usr_student_3',
        universityId: 'univ_oakridge',
        role: 'student',
        name: 'Aiden Patel',
        email: 'aiden.p@student.oau.edu',
        studentId: 'STU-2026-083',
        programId: 'prog_bsc_cs',
        classCohortId: 'coh_cs_year2_alpha',
        classCohortName: 'CS Year 2 — Cohort Alpha',
        passwordHash: defaultHash,
      },
    ];

    // 9. All 8 Examination Question Types
    this.questions = [
      {
        id: 'q_cs_1',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Complexity Analysis',
        type: 'mcq',
        title: 'What is the worst-case asymptotic time complexity of QuickSort when using a naive leftmost pivot selection on an already-sorted sequence?',
        marks: 5,
        negativeMarks: 1,
        difficulty: 'medium',
        options: [
          { id: 'opt_1_a', text: 'O(N log N)' },
          { id: 'opt_1_b', text: 'O(N²)', isCorrect: true },
          { id: 'opt_1_c', text: 'O(N)' },
          { id: 'opt_1_d', text: 'O(log N)' },
        ],
        correctAnswer: 'opt_1_b',
        explanation: 'In sorted arrays with leftmost pivot selection, the partitioning is maximally unbalanced (sizes 0 and N-1), resulting in O(N²) quadratic recurrence.',
      },
      {
        id: 'q_cs_2',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Graph Algorithms',
        type: 'multiple_select',
        title: 'Which of the following algorithm designs can correctly calculate the shortest path in an unweighted directed graph? (Select all that apply)',
        marks: 5,
        negativeMarks: 1,
        difficulty: 'medium',
        options: [
          { id: 'opt_2_a', text: 'Breadth-First Search (BFS)', isCorrect: true },
          { id: 'opt_2_b', text: 'Dijkstra\'s Algorithm with uniform unit weights (w=1)', isCorrect: true },
          { id: 'opt_2_c', text: 'Depth-First Search (DFS) standard traversal' },
          { id: 'opt_2_d', text: 'Bellman-Ford Algorithm', isCorrect: true },
        ],
        correctAnswer: ['opt_2_a', 'opt_2_b', 'opt_2_d'],
        explanation: 'BFS, Dijkstra with uniform edges, and Bellman-Ford compute shortest paths. Depth-First Search does not guarantee shortest path traversal in arbitrary graphs.',
      },
      {
        id: 'q_cs_3',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Self-Balancing Trees',
        type: 'true_false',
        title: 'In an AVL Tree, the height difference between the left and right subtrees of any node is guaranteed to never exceed 1.',
        marks: 3,
        negativeMarks: 0.5,
        difficulty: 'easy',
        options: [
          { id: 'opt_3_true', text: 'True', isCorrect: true },
          { id: 'opt_3_false', text: 'False' },
        ],
        correctAnswer: 'opt_3_true',
        explanation: 'AVL trees strictly enforce the balance factor criterion: BalanceFactor(N) = Height(Left) - Height(Right) ∈ {-1, 0, 1}.',
      },
      {
        id: 'q_cs_4',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Hash Structures',
        type: 'short_answer',
        title: 'Explain why a B-Tree or B+ Tree is preferred over an in-memory Red-Black Tree for disk-based database indexes.',
        marks: 6,
        difficulty: 'hard',
        rubric: 'Full marks (6 pts): Mentions high branching factor/fanout matching disk block page size, minimizing costly random disk I/O seek operations.',
        fillBlanks: ['fanout', 'disk io', 'branching factor', 'disk blocks'],
        explanation: 'B-Trees have wide nodes matching physical filesystem pages (4KB-16KB), drastically reducing tree height and mechanical disk head seeks.',
      },
      {
        id: 'q_cs_5',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Applied Security & Cryptography',
        type: 'essay',
        title: 'Critically analyze how asymmetric public-key cryptography (e.g. RSA and ECDHE) provides confidentiality, authentication, and forward secrecy in modern TLS 1.3 university portals. Discuss potential quantum threats posed by Shor\'s algorithm.',
        marks: 15,
        difficulty: 'hard',
        rubric: 'Grading Rubric (15 pts): 5 pts for Diffie-Hellman ephemeral key exchange and forward secrecy; 5 pts for X.509 PKI certificate chain of trust; 5 pts for quantum threat analysis and lattice-based post-quantum cryptography (e.g., ML-KEM/Kyber).',
        explanation: 'Examiners evaluate mathematical precision, TLS 1.3 zero-RTT handshake security, and post-quantum cryptographic transition awareness.',
      },
      {
        id: 'q_cs_6',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Hash Tables',
        type: 'fill_blank',
        title: 'The collision resolution scheme that maintains a linked list or auxiliary bucket array for every hash slot is called separate ________.',
        marks: 4,
        difficulty: 'easy',
        fillBlanks: ['chaining', 'chain'],
        explanation: 'Separate chaining delegates colliding items to linked lists or balanced red-black trees anchored at each hash table bucket.',
      },
      {
        id: 'q_cs_7',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        topic: 'Algorithmic Paradigms',
        type: 'matching',
        title: 'Match each algorithm with its primary design paradigm:',
        marks: 6,
        difficulty: 'medium',
        matchingPairs: [
          { id: 'm_1', left: 'Merge Sort', right: 'Divide and Conquer' },
          { id: 'm_2', left: 'Kruskal\'s Minimum Spanning Tree', right: 'Greedy Algorithm' },
          { id: 'm_3', left: '0/1 Knapsack Problem', right: 'Dynamic Programming' },
        ],
        explanation: 'Merge Sort recursively splits arrays; Kruskal greedily adds minimum weight acyclic edges; 0/1 Knapsack memoizes optimal overlapping subproblems.',
      },
      {
        id: 'q_cs_8',
        universityId: 'univ_oakridge',
        courseId: 'crs_cs305',
        courseCode: 'CS-305',
        courseName: 'Relational Database Systems & SQL Optimization',
        topic: 'Database Schema & Architecture',
        type: 'file_upload',
        title: 'Database Architecture Artifact Submission: Upload your third normal form (3NF) Entity-Relationship Diagram (ERD) or SQL DDL script (.pdf, .png, .sql, .zip) for the university examination management database.',
        marks: 10,
        difficulty: 'hard',
        rubric: 'Evaluation Criteria (10 pts): Schema correctness, primary/foreign key integrity constraints, 3NF normalization compliance, and index definitions for foreign keys.',
        fileUploadConstraint: {
          allowedExtensions: ['.pdf', '.png', '.sql', '.zip'],
          maxFileSizeMB: 15,
          instructions: 'Upload a single document (.pdf, .png, .sql, or .zip) under 15MB. Ensure candidate student ID is noted on the title block.',
        },
        explanation: 'Examiner verifies relational integrity, primary/foreign keys, and non-transitive dependency compliance in 3NF.',
      },
    ];

    // 10. Examinations
    this.examinations = [
      {
        id: 'exam_cs_midterm',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        facultyId: 'fac_ict',
        departmentId: 'dept_csse',
        courseId: 'crs_cs201',
        courseCode: 'CS-201',
        courseName: 'Advanced Data Structures & Algorithms',
        title: 'Midterm Examination: Algorithms, Data Structures & System Architecture',
        code: 'EXAM-CS201-MID',
        cohortIds: ['coh_cs_year2_alpha', 'coh_cs_year2_beta'],
        cohortNames: ['CS Year 2 — Cohort Alpha', 'CS Year 2 — Cohort Beta'],
        createdById: 'usr_lecturer',
        createdByName: 'Prof. Marcus Sterling',
        durationMinutes: 45,
        totalMarks: 54,
        passingMarks: 27,
        startTime: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        status: 'active',
        questions: this.questions.slice(0, 8), // ALL 8 QUESTION TYPES
        rules: [
          'Calculators, unauthorized reference aids, and external browser tabs are strictly prohibited.',
          'Anti-Cheat Page Lock Active: Do not leave or switch browser tabs. Unauthorized page navigation triggers immediate session lock.',
          'Answers and uploaded files are synchronized continuously with the university server.',
          'Exam solutions and rubrics remain strictly hidden until formal approval by the Results Officer.',
        ],
        shuffleQuestions: false,
        shuffleOptions: false,
        negativeMarking: true,
        allowReview: true,
        strictTabLockout: true, // Strict Page Lock enforcement!
        maxAllowedTabSwitches: 2,
        resultsPublished: false,
        totalCandidates: 42,
        submittedCount: 8,
        pendingGradingCount: 6,
      },
      {
        id: 'exam_db_final',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        courseId: 'crs_cs305',
        courseCode: 'CS-305',
        courseName: 'Relational Database Systems & SQL Optimization',
        title: 'Semester 1 Final Examination: Database Design & Query Tuning',
        code: 'EXAM-CS305-FIN',
        cohortIds: ['coh_cs_year2_alpha'],
        cohortNames: ['CS Year 2 — Cohort Alpha'],
        createdById: 'usr_lecturer',
        createdByName: 'Prof. Marcus Sterling',
        durationMinutes: 60,
        totalMarks: 25,
        passingMarks: 13,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: 'pending_approval', // Pending Results Officer approval!
        questions: [this.questions[4], this.questions[7]],
        rules: ['Ensure ERDs and normalization steps are fully documented.'],
        shuffleQuestions: false,
        shuffleOptions: false,
        negativeMarking: false,
        allowReview: true,
        strictTabLockout: true,
        maxAllowedTabSwitches: 2,
        resultsPublished: false,
        totalCandidates: 38,
        submittedCount: 38,
        pendingGradingCount: 0,
      },
      {
        id: 'exam_finc_quiz',
        universityId: 'univ_oakridge',
        universityName: 'Oakridge Apex University',
        courseId: 'crs_finc101',
        courseCode: 'ACC-101',
        courseName: 'Principles of Financial Accounting & Auditing',
        title: 'Diagnostic Evaluation: Auditing & Internal Balance Controls',
        code: 'EXAM-ACC101-D1',
        cohortIds: ['coh_cs_year2_alpha'],
        cohortNames: ['CS Year 2 — Cohort Alpha'],
        createdById: 'usr_lecturer',
        createdByName: 'Prof. Marcus Sterling',
        durationMinutes: 30,
        totalMarks: 20,
        passingMarks: 10,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        status: 'published',
        questions: [this.questions[0], this.questions[2]],
        rules: ['Standard diagnostic test.'],
        shuffleQuestions: true,
        shuffleOptions: true,
        negativeMarking: false,
        allowReview: true,
        strictTabLockout: false,
        maxAllowedTabSwitches: 5,
        resultsPublished: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        resultsApprovedBy: 'Dean Robert Thorne',
        resultsApprovedAt: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
        resultsApprovalNotes: 'Senate curriculum committee ratified results and grade distributions.',
        totalCandidates: 40,
        submittedCount: 40,
        pendingGradingCount: 0,
      },
    ];

    // 11. Pre-seed active sessions for live invigilator
    this.sessions.set('sess_student_2', {
      id: 'sess_student_2',
      examId: 'exam_cs_midterm',
      studentId: 'usr_student_2',
      studentName: 'Sophia Martinez',
      studentRollNumber: 'STU-2026-082',
      universityId: 'univ_oakridge',
      status: 'in_progress',
      startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      endsAt: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
      timeRemainingSeconds: 25 * 60,
      answers: {
        q_cs_1: { questionId: 'q_cs_1', type: 'mcq', selectedOptionId: 'opt_1_b', savedAt: new Date().toISOString() },
        q_cs_2: { questionId: 'q_cs_2', type: 'multiple_select', selectedOptionIds: ['opt_2_a', 'opt_2_b'], savedAt: new Date().toISOString() },
        q_cs_3: { questionId: 'q_cs_3', type: 'true_false', selectedOptionId: 'opt_3_true', savedAt: new Date().toISOString() },
      },
      tabSwitches: 0,
      isLockedOutDueToTabSwitch: false,
      extraTimeMinutes: 0,
      ipAddress: '192.168.10.45',
      lastHeartbeat: new Date().toISOString(),
    });

    this.sessions.set('sess_student_3', {
      id: 'sess_student_3',
      examId: 'exam_cs_midterm',
      studentId: 'usr_student_3',
      studentName: 'Aiden Patel',
      studentRollNumber: 'STU-2026-083',
      universityId: 'univ_oakridge',
      status: 'locked_out',
      startedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      endsAt: new Date(Date.now() + 1000 * 60 * 27).toISOString(),
      timeRemainingSeconds: 27 * 60,
      answers: {
        q_cs_1: { questionId: 'q_cs_1', type: 'mcq', selectedOptionId: 'opt_1_b', savedAt: new Date().toISOString() },
      },
      tabSwitches: 2,
      isLockedOutDueToTabSwitch: true,
      lockoutReason: 'Candidate attempted unauthorized window/tab navigation during locked examination mode.',
      extraTimeMinutes: 0,
      ipAddress: '192.168.10.78',
      lastHeartbeat: new Date().toISOString(),
    });

    // 12. Pre-seed submission awaiting Results Officer approval
    this.submissions.set('sub_db_sophia', {
      id: 'sub_db_sophia',
      sessionId: 'sess_db_sophia',
      examId: 'exam_db_final',
      examTitle: 'Semester 1 Final Examination: Database Design & Query Tuning',
      courseCode: 'CS-305',
      courseName: 'Relational Database Systems & SQL Optimization',
      studentId: 'usr_student_2',
      studentName: 'Sophia Martinez',
      studentRollNumber: 'STU-2026-082',
      universityId: 'univ_oakridge',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      totalMarks: 25,
      obtainedMarks: 23,
      passingMarks: 13,
      isPassed: true,
      autoGradedMarks: 0,
      subjectiveMarks: 23,
      requiresManualGrading: false,
      isFullyGraded: true,
      approvedByResultsOfficer: false, // Ready for Results Officer to approve!
      resultsPublished: false,
      percentage: 92,
      letterGrade: 'A+',
      gpaPoints: 4.0,
      answers: {
        q_cs_5: {
          questionId: 'q_cs_5',
          type: 'essay',
          textAnswer:
            'TLS 1.3 deprecates static RSA key transport in favor of ephemeral Diffie-Hellman (ECDHE), guaranteeing Perfect Forward Secrecy. X.509 Certificate Authorities sign public keys using SHA-384 and ECDSA to prevent Man-in-the-Middle attacks. Regarding quantum threats, Shor\'s algorithm computes discrete logarithms in polynomial time; hence migration to lattice-based post-quantum algorithms (ML-KEM/Kyber) is vital.',
          savedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          marksAwarded: 14,
          examinerFeedback: 'Rigorous analysis of forward secrecy and post-quantum migration.',
          isManuallyGraded: true,
        },
        q_cs_8: {
          questionId: 'q_cs_8',
          type: 'file_upload',
          uploadedFile: {
            fileName: 'OAU_Database_3NF_Schema.sql',
            fileSize: 18452,
            fileType: 'text/x-sql',
            dataUrl: 'data:text/plain;base64,LS0gT0FVIFVuaXZlcnNpdHkgM05GIFNjaGVtYQpDUkVBVEUgVEFCTEUgdW5pdmVyc2l0aWVzICguLi4pOw==',
            uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          },
          savedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
          marksAwarded: 9,
          examinerFeedback: 'Well structured SQL DDL with proper foreign key cascades.',
          isManuallyGraded: true,
        },
      },
    });

    // 13. Pre-seed published submission for Liam Chen so he can inspect full solution & scorecard
    this.submissions.set('sub_finc_liam', {
      id: 'sub_finc_liam',
      sessionId: 'sess_finc_liam',
      examId: 'exam_finc_quiz',
      examTitle: 'Diagnostic Evaluation: Auditing & Internal Balance Controls',
      courseCode: 'ACC-101',
      courseName: 'Principles of Financial Accounting & Auditing',
      studentId: 'usr_student',
      studentName: 'Liam Chen',
      studentRollNumber: 'STU-2026-081',
      universityId: 'univ_oakridge',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      totalMarks: 20,
      obtainedMarks: 18,
      passingMarks: 10,
      isPassed: true,
      autoGradedMarks: 18,
      subjectiveMarks: 0,
      requiresManualGrading: false,
      isFullyGraded: true,
      approvedByResultsOfficer: true,
      resultsPublished: true, // Results published -> Solutions unlocked!
      percentage: 90,
      letterGrade: 'A+',
      gpaPoints: 4.0,
      rank: 2,
      answers: {
        q_cs_1: {
          questionId: 'q_cs_1',
          type: 'mcq',
          selectedOptionId: 'opt_1_b',
          savedAt: new Date().toISOString(),
          marksAwarded: 5,
        },
        q_cs_3: {
          questionId: 'q_cs_3',
          type: 'true_false',
          selectedOptionId: 'opt_3_true',
          savedAt: new Date().toISOString(),
          marksAwarded: 3,
        },
      },
    });

    // 14. Incidents
    this.incidents = [
      {
        id: 'inc_1',
        examId: 'exam_cs_midterm',
        sessionId: 'sess_student_3',
        studentName: 'Aiden Patel',
        incidentType: 'lockout_triggered',
        description: 'Candidate switched away from examination window twice. Anti-cheat locked out session.',
        severity: 'high',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ];

    // 15. Audit Logs
    this.auditLogs = [
      {
        id: 'log_1',
        universityId: 'univ_oakridge',
        userId: 'usr_lecturer',
        userName: 'Prof. Marcus Sterling',
        action: 'SCHEDULED_UNIVERSITY_EXAMINATION',
        category: 'exam',
        details: 'Configured CS-201 Midterm with strict anti-cheat tab-switch lockout.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        ipAddress: '10.0.1.4',
      },
      {
        id: 'log_2',
        universityId: 'univ_oakridge',
        userId: 'usr_resultsofficer',
        userName: 'Dean Robert Thorne',
        action: 'APPROVED_OFFICIAL_RESULTS',
        category: 'approval',
        details: 'Approved ACC-101 Diagnostic final scores and verified grade distributions.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
        ipAddress: '10.0.1.2',
      },
    ];

    // 16. Announcements
    this.announcements = [
      {
        id: 'anc_1',
        universityId: 'univ_oakridge',
        title: 'Midterm Examination Digital Proctoring & Browser Lock Protocol',
        content: 'Candidates are required to remain in the active exam window. Window blurring or opening background tabs triggers automated lockout.',
        priority: 'urgent',
        targetRole: 'all',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
    ];
  }
}

const db = new ExamProUniversityDatabase();

// ----------------------------------------------------
// Authentication Helpers & Middleware
// ----------------------------------------------------

interface AuthRequest extends express.Request {
  user?: UserProfile;
}

const authenticateJWT = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserProfile;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
};

const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient university privileges for this operation' });
    }
    next();
  };
};

function calculateGradeAndGPA(percentage: number): { letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'; gpaPoints: number } {
  if (percentage >= 90) return { letterGrade: 'A+', gpaPoints: 4.0 };
  if (percentage >= 80) return { letterGrade: 'A', gpaPoints: 3.7 };
  if (percentage >= 75) return { letterGrade: 'B+', gpaPoints: 3.3 };
  if (percentage >= 70) return { letterGrade: 'B', gpaPoints: 3.0 };
  if (percentage >= 65) return { letterGrade: 'C+', gpaPoints: 2.5 };
  if (percentage >= 60) return { letterGrade: 'C', gpaPoints: 2.0 };
  if (percentage >= 50) return { letterGrade: 'D', gpaPoints: 1.0 };
  return { letterGrade: 'F', gpaPoints: 0.0 };
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 1. Auth & University Personas
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user && role) {
    user = db.users.find((u) => u.role === role);
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const token = jwt.sign(
    {
      id: user.id,
      universityId: user.universityId,
      universityName: user.universityName || 'Oakridge Apex University',
      role: user.role,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      employeeId: user.employeeId,
      programId: user.programId,
      programName: user.programName,
      classCohortId: user.classCohortId,
      classCohortName: user.classCohortName,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { passwordHash, ...profile } = user;
  res.json({ token, user: profile });
});

app.get('/api/auth/me', authenticateJWT, (req: AuthRequest, res) => {
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...profile } = user;
  res.json({ user: profile });
});

app.get('/api/auth/demo-users', (req, res) => {
  const demoProfiles = db.users.map(({ passwordHash, ...u }) => u);
  res.json({ users: demoProfiles });
});

// 2. Universities & Multi-Tenancy (Super Admin)
app.get('/api/universities', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ universities: db.universities, schools: db.universities });
});

app.post('/api/universities', authenticateJWT, requireRoles('super_admin'), (req: AuthRequest, res) => {
  const { name, code, domain, email, phone, address } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

  const newUni: University = {
    id: `univ_${Date.now()}`,
    name,
    code,
    logo: '/src/assets/images/oakridge_academy_crest_1794398618229.jpg',
    domain: domain || `${code.toLowerCase()}.edu`,
    email: email || `contact@${code.toLowerCase()}.edu`,
    phone: phone || '+1 (555) 000-0000',
    address: address || 'Campus Main Boulevard',
    status: 'active',
    createdAt: new Date().toISOString(),
    facultiesCount: 2,
    studentCount: 0,
    lecturerCount: 0,
    examCount: 0,
  };

  db.universities.push(newUni);
  res.status(201).json({ university: newUni, school: newUni });
});

// Backward-compat aliases
app.get('/api/schools', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ schools: db.universities });
});
app.patch('/api/schools/:id/status', authenticateJWT, requireRoles('super_admin'), (req: AuthRequest, res) => {
  const uni = db.universities.find((u) => u.id === req.params.id);
  if (!uni) return res.status(404).json({ error: 'University not found' });
  const { status } = req.body;
  if (['active', 'suspended', 'trial'].includes(status)) {
    uni.status = status;
    return res.json({ school: uni, university: uni });
  }
  res.status(400).json({ error: 'Invalid status' });
});

// 3. University Academic Hierarchy (Faculties, Departments, Programs, Courses)
app.get('/api/faculties', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ faculties: db.faculties });
});

app.get('/api/departments', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ departments: db.departments });
});

app.get('/api/programs', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ programs: db.programs });
});

app.get('/api/courses', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ courses: db.courses, subjects: db.courses });
});

app.post('/api/courses', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer'), (req: AuthRequest, res) => {
  const { name, code, creditUnits, departmentId, description } = req.body;
  const newCourse: Course = {
    id: `crs_${Date.now()}`,
    departmentId: departmentId || 'dept_csse',
    universityId: req.user?.universityId || 'univ_oakridge',
    name,
    code,
    creditUnits: Number(creditUnits) || 3,
    departmentName: 'Computer Science',
    description,
  };
  db.courses.push(newCourse);
  res.status(201).json({ course: newCourse, subject: newCourse });
});

app.get('/api/subjects', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ subjects: db.courses });
});
app.post('/api/subjects', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer'), (req: AuthRequest, res) => {
  const { name, code, department } = req.body;
  const newCourse: Course = {
    id: `crs_${Date.now()}`,
    departmentId: 'dept_csse',
    universityId: req.user?.universityId || 'univ_oakridge',
    name,
    code,
    creditUnits: 3,
    departmentName: department || 'Computer Science',
  };
  db.courses.push(newCourse);
  res.status(201).json({ subject: newCourse, course: newCourse });
});

app.get('/api/classes', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ classes: db.cohorts, cohorts: db.cohorts });
});

app.post('/api/classes', authenticateJWT, requireRoles('super_admin', 'university_admin'), (req: AuthRequest, res) => {
  const { name, gradeLevel } = req.body;
  const newCohort: ClassCohort = {
    id: `coh_${Date.now()}`,
    universityId: req.user?.universityId || 'univ_oakridge',
    programId: 'prog_bsc_cs',
    semesterId: 'sem_1_2025',
    name,
    level: gradeLevel ? `${gradeLevel} Level` : '200 Level',
    studentCount: 30,
  };
  db.cohorts.push(newCohort);
  res.status(201).json({ classRoom: newCohort, cohort: newCohort });
});

// 4. User Rosters (Lecturers, Students, Admins)
app.get('/api/users', authenticateJWT, (req: AuthRequest, res) => {
  const { role } = req.query;
  let list = db.users.map(({ passwordHash, ...u }) => u);
  if (role) list = list.filter((u) => u.role === role);
  res.json({ users: list });
});

app.post('/api/users', authenticateJWT, requireRoles('super_admin', 'university_admin'), (req: AuthRequest, res) => {
  const { name, email, role, classId, className, employeeId, studentId, programId, programName } = req.body;
  if (!name || !email || !role) return res.status(400).json({ error: 'Name, email, and role are required' });

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const newUser: UserProfile & { passwordHash: string } = {
    id: `usr_${Date.now()}`,
    universityId: req.user?.universityId || 'univ_oakridge',
    universityName: 'Oakridge Apex University',
    name,
    email,
    role,
    classCohortId: classId,
    classCohortName: className,
    employeeId,
    studentId,
    programId,
    programName,
    passwordHash: bcrypt.hashSync('Password123!', 8),
    lastLogin: undefined,
  };

  db.users.push(newUser);
  const { passwordHash, ...profile } = newUser;
  res.status(201).json({ user: profile });
});

// 5. Question Bank (Supports all 8 Question Types including File Upload)
app.get('/api/questions', authenticateJWT, (req: AuthRequest, res) => {
  const { courseId, type, difficulty } = req.query;
  let list = db.questions;
  if (courseId) list = list.filter((q) => q.courseId === courseId);
  if (type) list = list.filter((q) => q.type === type);
  if (difficulty) list = list.filter((q) => q.difficulty === difficulty);

  // CRITICAL SECURITY: If student requests questions, scrub correct answers, rubrics, and explanations!
  if (req.user?.role === 'student') {
    list = list.map(({ correctAnswer, rubric, explanation, ...rest }) => ({
      ...rest,
      options: rest.options?.map(({ isCorrect, ...opt }) => opt),
    }));
  }

  res.json({ questions: list });
});

app.post('/api/questions', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer'), (req: AuthRequest, res) => {
  const qData = req.body;
  const newQuestion: Question = {
    id: `q_${Date.now()}`,
    universityId: req.user?.universityId || 'univ_oakridge',
    courseId: qData.courseId || qData.subjectId || 'crs_cs201',
    courseCode: qData.courseCode || 'CS-201',
    courseName: qData.courseName || qData.subjectName || 'Computer Science',
    topic: qData.topic || 'General',
    type: qData.type || 'mcq',
    title: qData.title,
    marks: Number(qData.marks) || 5,
    negativeMarks: Number(qData.negativeMarks) || 0,
    difficulty: qData.difficulty || 'medium',
    imageUrl: qData.imageUrl,
    options: qData.options,
    correctAnswer: qData.correctAnswer,
    rubric: qData.rubric,
    explanation: qData.explanation,
    matchingPairs: qData.matchingPairs,
    fillBlanks: qData.fillBlanks,
    fileUploadConstraint: qData.fileUploadConstraint,
  };

  db.questions.push(newQuestion);
  res.status(201).json({ question: newQuestion });
});

// 6. Examination Lifecycle & Security
app.get('/api/exams', authenticateJWT, (req: AuthRequest, res) => {
  let list = db.examinations;

  if (req.user?.role === 'student') {
    // Scrub solutions completely for students
    list = list.map((e) => ({
      ...e,
      questions: e.questions.map(({ correctAnswer, rubric, explanation, ...qRest }) => ({
        ...qRest,
        options: qRest.options?.map(({ isCorrect, ...opt }) => opt),
      })),
    }));
  }

  res.json({ exams: list });
});

app.get('/api/exams/:id', authenticateJWT, (req: AuthRequest, res) => {
  const exam = db.examinations.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Examination not found' });

  if (req.user?.role === 'student') {
    const safeQuestions = exam.questions.map(({ correctAnswer, rubric, explanation, ...rest }) => ({
      ...rest,
      options: rest.options?.map(({ isCorrect, ...opt }) => opt),
    }));
    return res.json({ exam: { ...exam, questions: safeQuestions } });
  }

  res.json({ exam });
});

app.post('/api/exams', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer'), (req: AuthRequest, res) => {
  const examData = req.body;
  const questions = examData.questions && examData.questions.length > 0 ? examData.questions : db.questions.slice(0, 8);
  const totalMarks = questions.reduce((acc: number, q: Question) => acc + (q.marks || 0), 0);

  const newExam: Examination = {
    id: `exam_${Date.now()}`,
    universityId: req.user?.universityId || 'univ_oakridge',
    universityName: 'Oakridge Apex University',
    facultyId: 'fac_ict',
    departmentId: 'dept_csse',
    courseId: examData.courseId || examData.subjectId || 'crs_cs201',
    courseCode: examData.courseCode || 'CS-201',
    courseName: examData.courseName || examData.subjectName || 'Advanced Data Structures & Algorithms',
    title: examData.title,
    code: examData.code || `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
    cohortIds: examData.cohortIds || examData.classIds || ['coh_cs_year2_alpha'],
    cohortNames: examData.cohortNames || examData.classNames || ['CS Year 2 — Cohort Alpha'],
    createdById: req.user!.id,
    createdByName: req.user!.name,
    durationMinutes: Number(examData.durationMinutes) || 60,
    totalMarks: totalMarks || 50,
    passingMarks: Math.round(totalMarks * 0.5) || 25,
    startTime: examData.startTime || new Date().toISOString(),
    endTime: examData.endTime || new Date(Date.now() + 86400000).toISOString(),
    status: examData.status || 'scheduled',
    questions: questions,
    rules: examData.rules || [
      'Maintain full-screen focus throughout the session.',
      'Anti-cheat lock: Any tab switch will trigger session lockdown.',
      'Answers are saved automatically.',
    ],
    shuffleQuestions: Boolean(examData.shuffleQuestions),
    shuffleOptions: Boolean(examData.shuffleOptions),
    negativeMarking: Boolean(examData.negativeMarking),
    allowReview: Boolean(examData.allowReview !== false),
    strictTabLockout: Boolean(examData.strictTabLockout !== false),
    maxAllowedTabSwitches: Number(examData.maxAllowedTabSwitches) || 2,
    resultsPublished: false,
    totalCandidates: 42,
    submittedCount: 0,
    pendingGradingCount: 0,
  };

  db.examinations.unshift(newExam);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    universityId: newExam.universityId,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CREATE_UNIVERSITY_EXAMINATION',
    category: 'exam',
    details: `Lecturer scheduled "${newExam.title}" (${newExam.code}). Strict tab lockout: ${newExam.strictTabLockout}.`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ exam: newExam });
});

// 7. Results Officer: Approval & Publication Workflow
app.post('/api/exams/:id/approve-results', authenticateJWT, requireRoles('super_admin', 'university_admin', 'results_officer'), (req: AuthRequest, res) => {
  const exam = db.examinations.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const { notes } = req.body;
  exam.status = 'published';
  exam.resultsPublished = true;
  exam.publishedAt = new Date().toISOString();
  exam.resultsApprovedBy = req.user!.name;
  exam.resultsApprovedAt = new Date().toISOString();
  exam.resultsApprovalNotes = notes || 'Formally approved by University Examination Senate & Results Officer.';

  // Mark submissions as approved and published
  for (const sub of db.submissions.values()) {
    if (sub.examId === exam.id) {
      sub.approvedByResultsOfficer = true;
      sub.resultsPublished = true;
    }
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    universityId: exam.universityId,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'RESULTS_OFFICER_APPROVAL',
    category: 'approval',
    details: `Official results ratified and published for examination "${exam.title}". Solutions now accessible to candidates.`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Examination results formally approved and published.', exam });
});

app.patch('/api/exams/:id/publish-results', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer', 'results_officer'), (req: AuthRequest, res) => {
  const exam = db.examinations.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  exam.resultsPublished = true;
  exam.status = 'published';
  exam.publishedAt = new Date().toISOString();
  exam.resultsApprovedBy = req.user!.name;

  for (const sub of db.submissions.values()) {
    if (sub.examId === exam.id) {
      sub.approvedByResultsOfficer = true;
      sub.resultsPublished = true;
    }
  }

  res.json({ message: 'Results published successfully', exam });
});

// 8. Student Examination Session (Start, Auto-Save, Anti-Cheat Tab Lock, Submit)
app.post('/api/exam-sessions/start', authenticateJWT, (req: AuthRequest, res) => {
  const { examId } = req.body;
  const student = req.user;
  if (!student) return res.status(401).json({ error: 'Unauthorized' });

  const exam = db.examinations.find((e) => e.id === examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  for (const sub of db.submissions.values()) {
    if (sub.examId === examId && sub.studentId === student.id) {
      return res.status(400).json({ error: 'You have already submitted this examination.', submissionId: sub.id });
    }
  }

  // Check for existing active or locked session
  let existingSession: ExamSession | undefined;
  for (const sess of db.sessions.values()) {
    if (sess.examId === examId && sess.studentId === student.id) {
      existingSession = sess;
      break;
    }
  }

  if (existingSession) {
    if (existingSession.status === 'locked_out') {
      return res.status(403).json({
        error: 'Your examination session has been LOCKED OUT due to unauthorized tab switching. Contact your invigilator.',
        isLockedOut: true,
        session: existingSession,
      });
    }

    const elapsedSecs = Math.floor((Date.now() - new Date(existingSession.startedAt).getTime()) / 1000);
    const totalAllowedSecs = (exam.durationMinutes + existingSession.extraTimeMinutes) * 60;
    existingSession.timeRemainingSeconds = Math.max(0, totalAllowedSecs - elapsedSecs);

    return res.json({ session: existingSession, exam: prepareSafeExam(exam) });
  }

  // Create new session
  const durationSecs = exam.durationMinutes * 60;
  const startedAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + durationSecs * 1000).toISOString();

  const session: ExamSession = {
    id: `sess_${student.id}_${Date.now()}`,
    examId: exam.id,
    studentId: student.id,
    studentName: student.name,
    studentRollNumber: student.studentId || 'STU-DEFAULT',
    universityId: student.universityId || 'univ_oakridge',
    status: 'in_progress',
    startedAt,
    endsAt,
    timeRemainingSeconds: durationSecs,
    answers: {},
    tabSwitches: 0,
    isLockedOutDueToTabSwitch: false,
    extraTimeMinutes: 0,
    ipAddress: req.ip || '127.0.0.1',
    lastHeartbeat: new Date().toISOString(),
  };

  db.sessions.set(session.id, session);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    universityId: session.universityId,
    userId: student.id,
    userName: student.name,
    action: 'START_EXAMINATION_SESSION',
    category: 'exam',
    details: `Candidate started examination "${exam.title}". Anti-cheat monitoring engaged.`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ session, exam: prepareSafeExam(exam) });
});

function prepareSafeExam(exam: Examination) {
  return {
    ...exam,
    questions: exam.questions.map(({ correctAnswer, rubric, explanation, ...rest }) => ({
      ...rest,
      options: rest.options?.map(({ isCorrect, ...opt }) => opt),
    })),
  };
}

// Auto-save individual answer (including file upload)
app.post('/api/exam-sessions/:sessionId/save-answer', authenticateJWT, (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (session.status === 'locked_out') {
    return res.status(403).json({ error: 'Session is locked out due to tab switching.' });
  }
  if (session.status !== 'in_progress') {
    return res.status(400).json({ error: 'Session is no longer active' });
  }

  const { questionId, answer } = req.body;
  if (!questionId || !answer) return res.status(400).json({ error: 'Missing questionId or answer data' });

  session.answers[questionId] = {
    ...answer,
    savedAt: new Date().toISOString(),
  };
  session.lastHeartbeat = new Date().toISOString();

  res.json({ success: true, savedAt: session.answers[questionId].savedAt });
});

// Anti-Cheat Tab Switch & Window Blur Detection
app.post('/api/exam-sessions/:sessionId/tab-switch', authenticateJWT, (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const exam = db.examinations.find((e) => e.id === session.examId);
  session.tabSwitches += 1;
  session.lastHeartbeat = new Date().toISOString();

  const maxAllowed = exam?.maxAllowedTabSwitches ?? 2;
  let isNowLocked = false;

  if (exam?.strictTabLockout && session.tabSwitches >= maxAllowed) {
    session.status = 'locked_out';
    session.isLockedOutDueToTabSwitch = true;
    session.lockoutReason = `Exceeded permissible window switches (${session.tabSwitches} / ${maxAllowed}). Anti-cheat policy triggered.`;
    isNowLocked = true;
  }

  // Log security incident
  const incident: InvigilationIncident = {
    id: `inc_${Date.now()}`,
    examId: session.examId,
    sessionId: session.id,
    studentName: session.studentName,
    incidentType: isNowLocked ? 'lockout_triggered' : 'tab_switch',
    description: isNowLocked
      ? `Candidate was AUTOMATICALLY LOCKED OUT after ${session.tabSwitches} tab switches.`
      : `Unauthorized page blur / tab switch detected (${session.tabSwitches} count).`,
    severity: isNowLocked ? 'high' : 'medium',
    createdAt: new Date().toISOString(),
  };

  db.incidents.unshift(incident);

  res.json({
    tabSwitches: session.tabSwitches,
    maxAllowed,
    isLockedOut: session.isLockedOutDueToTabSwitch,
    status: session.status,
  });
});

// Invigilator Unlock Session
app.post('/api/exam-sessions/:sessionId/unlock', authenticateJWT, requireRoles('super_admin', 'university_admin', 'invigilator', 'lecturer'), (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.status = 'in_progress';
  session.isLockedOutDueToTabSwitch = false;
  session.tabSwitches = 0; // reset switch counter on authorized pardon

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    universityId: session.universityId,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'INVIGILATOR_UNLOCKED_SESSION',
    category: 'security',
    details: `Invigilator pardoned and unlocked session for candidate ${session.studentName}.`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Session unlocked successfully', session });
});

// Periodic heartbeat
app.post('/api/exam-sessions/:sessionId/heartbeat', authenticateJWT, (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  session.lastHeartbeat = new Date().toISOString();

  const exam = db.examinations.find((e) => e.id === session.examId);
  if (exam) {
    const elapsedSecs = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const totalAllowedSecs = (exam.durationMinutes + session.extraTimeMinutes) * 60;
    session.timeRemainingSeconds = Math.max(0, totalAllowedSecs - elapsedSecs);
  }

  res.json({
    status: session.status,
    isLockedOut: session.isLockedOutDueToTabSwitch,
    timeRemainingSeconds: session.timeRemainingSeconds,
    tabSwitches: session.tabSwitches,
  });
});

// Submit Examination & Automatic Marking Engine
app.post('/api/exam-sessions/:sessionId/submit', authenticateJWT, (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status === 'submitted') return res.status(400).json({ error: 'Already submitted' });

  const exam = db.examinations.find((e) => e.id === session.examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  session.status = 'submitted';
  session.submittedAt = new Date().toISOString();

  // Run Automatic Marking on Objective Questions
  let autoGradedMarks = 0;
  let requiresManualGrading = false;
  const processedAnswers: Record<string, StudentAnswer> = {};

  for (const q of exam.questions) {
    const ans = session.answers[q.id];
    if (!ans) {
      processedAnswers[q.id] = {
        questionId: q.id,
        type: q.type,
        savedAt: session.submittedAt,
        marksAwarded: 0,
      };
      continue;
    }

    let awarded = 0;

    if (q.type === 'mcq' || q.type === 'true_false') {
      if (ans.selectedOptionId && ans.selectedOptionId === q.correctAnswer) {
        awarded = q.marks;
      } else if (ans.selectedOptionId && exam.negativeMarking && q.negativeMarks) {
        awarded = -q.negativeMarks;
      }
    } else if (q.type === 'multiple_select') {
      const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      const studentArr = ans.selectedOptionIds || [];
      const isExact =
        correctArr.length === studentArr.length &&
        correctArr.every((id) => studentArr.includes(id));

      if (isExact) {
        awarded = q.marks;
      } else if (studentArr.length > 0 && exam.negativeMarking && q.negativeMarks) {
        awarded = -q.negativeMarks;
      }
    } else if (q.type === 'fill_blank') {
      const studentText = (ans.textAnswer || '').trim().toLowerCase();
      const acceptable = (q.fillBlanks || []).map((b) => b.trim().toLowerCase());
      if (studentText && acceptable.includes(studentText)) {
        awarded = q.marks;
      }
    } else if (q.type === 'matching') {
      const pairs = q.matchingPairs || [];
      const studentMatches = ans.matchingSelections || {};
      let matchedCount = 0;
      for (const p of pairs) {
        if (studentMatches[p.id] === p.right) matchedCount++;
      }
      if (pairs.length > 0) {
        awarded = Math.round((matchedCount / pairs.length) * q.marks * 10) / 10;
      }
    } else if (q.type === 'short_answer' || q.type === 'essay' || q.type === 'file_upload') {
      requiresManualGrading = true;
      awarded = 0; // Marked manually by examiner
    }

    autoGradedMarks += awarded;
    processedAnswers[q.id] = {
      ...ans,
      marksAwarded: awarded,
      isManuallyGraded: !(q.type === 'short_answer' || q.type === 'essay' || q.type === 'file_upload'),
    };
  }

  autoGradedMarks = Math.max(0, autoGradedMarks);
  const percentage = Math.round((autoGradedMarks / exam.totalMarks) * 100);
  const { letterGrade, gpaPoints } = calculateGradeAndGPA(percentage);

  const submission: ExamSubmission = {
    id: `sub_${Date.now()}`,
    sessionId: session.id,
    examId: exam.id,
    examTitle: exam.title,
    courseCode: exam.courseCode,
    courseName: exam.courseName,
    studentId: session.studentId,
    studentName: session.studentName,
    studentRollNumber: session.studentRollNumber,
    universityId: session.universityId,
    submittedAt: session.submittedAt,
    totalMarks: exam.totalMarks,
    obtainedMarks: autoGradedMarks,
    passingMarks: exam.passingMarks,
    isPassed: autoGradedMarks >= exam.passingMarks,
    autoGradedMarks,
    subjectiveMarks: 0,
    requiresManualGrading,
    isFullyGraded: !requiresManualGrading,
    approvedByResultsOfficer: false,
    resultsPublished: exam.resultsPublished,
    percentage,
    letterGrade,
    gpaPoints,
    answers: processedAnswers,
  };

  db.submissions.set(submission.id, submission);

  exam.submittedCount += 1;
  if (requiresManualGrading) {
    exam.pendingGradingCount += 1;
    if (exam.status !== 'grading') exam.status = 'grading';
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    universityId: session.universityId,
    userId: session.studentId,
    userName: session.studentName,
    action: 'SUBMIT_EXAMINATION',
    category: 'exam',
    details: `Candidate submitted exam "${exam.title}". Auto-graded score: ${autoGradedMarks}/${exam.totalMarks}.`,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    message: 'Examination submitted successfully and locked.',
    submissionId: submission.id,
    submission: {
      id: submission.id,
      examTitle: submission.examTitle,
      submittedAt: submission.submittedAt,
      autoGradedMarks: submission.autoGradedMarks,
      totalMarks: submission.totalMarks,
      requiresManualGrading: submission.requiresManualGrading,
      isFullyGraded: submission.isFullyGraded,
    },
  });
});

// 9. Invigilation & Live Monitoring
app.get('/api/invigilation/:examId', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer', 'invigilator', 'results_officer'), (req: AuthRequest, res) => {
  const { examId } = req.params;
  const sessions = Array.from(db.sessions.values()).filter((s) => s.examId === examId);
  const incidents = db.incidents.filter((i) => i.examId === examId);
  res.json({ sessions, incidents });
});

app.post('/api/invigilation/:sessionId/incident', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer', 'invigilator'), (req: AuthRequest, res) => {
  const session = db.sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { incidentType, description, severity, extraTimeMinutes } = req.body;

  if (extraTimeMinutes && Number(extraTimeMinutes) > 0) {
    session.extraTimeMinutes += Number(extraTimeMinutes);
    session.timeRemainingSeconds += Number(extraTimeMinutes) * 60;
  }

  const incident: InvigilationIncident = {
    id: `inc_${Date.now()}`,
    examId: session.examId,
    sessionId: session.id,
    studentName: session.studentName,
    incidentType: incidentType || 'suspicious_behavior',
    description: description || 'Flagged by invigilator during live examination.',
    severity: severity || 'medium',
    createdAt: new Date().toISOString(),
  };

  db.incidents.unshift(incident);
  res.status(201).json({ incident, session });
});

// 10. Grading & Submissions
app.get('/api/submissions/:examId', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer', 'results_officer'), (req: AuthRequest, res) => {
  const { examId } = req.params;
  const submissions = Array.from(db.submissions.values()).filter((s) => s.examId === examId);
  res.json({ submissions });
});

app.get('/api/submission-detail/:id', authenticateJWT, (req: AuthRequest, res) => {
  const sub = db.submissions.get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  // STRICT SECURITY: A student CANNOT inspect details or solutions until Results Officer has published results!
  if (req.user?.role === 'student') {
    if (sub.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to inspect other candidate records' });
    }
    if (!sub.resultsPublished) {
      return res.status(403).json({ error: 'Examination solutions remain strictly classified until formal ratification by the University Results Officer.' });
    }
  }

  const exam = db.examinations.find((e) => e.id === sub.examId);
  res.json({ submission: sub, exam });
});

app.post('/api/submissions/:submissionId/mark-question', authenticateJWT, requireRoles('super_admin', 'university_admin', 'lecturer'), (req: AuthRequest, res) => {
  const sub = db.submissions.get(req.params.submissionId);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  const { questionId, marksAwarded, feedback } = req.body;
  if (!sub.answers[questionId]) {
    sub.answers[questionId] = {
      questionId,
      type: 'essay',
      savedAt: new Date().toISOString(),
    };
  }

  sub.answers[questionId].marksAwarded = Number(marksAwarded);
  sub.answers[questionId].examinerFeedback = feedback;
  sub.answers[questionId].isManuallyGraded = true;

  // Recalculate total obtained marks
  let totalScore = 0;
  let hasPendingSubjective = false;

  const exam = db.examinations.find((e) => e.id === sub.examId);
  if (exam) {
    for (const q of exam.questions) {
      const ans = sub.answers[q.id];
      if (ans && typeof ans.marksAwarded === 'number') {
        totalScore += ans.marksAwarded;
      }
      if ((q.type === 'essay' || q.type === 'short_answer' || q.type === 'file_upload') && !ans?.isManuallyGraded) {
        hasPendingSubjective = true;
      }
    }
  }

  sub.obtainedMarks = Math.max(0, totalScore);
  sub.isPassed = sub.obtainedMarks >= sub.passingMarks;
  sub.percentage = Math.round((sub.obtainedMarks / sub.totalMarks) * 100);
  const { letterGrade, gpaPoints } = calculateGradeAndGPA(sub.percentage);
  sub.letterGrade = letterGrade;
  sub.gpaPoints = gpaPoints;
  sub.isFullyGraded = !hasPendingSubjective;

  if (exam && sub.isFullyGraded && exam.pendingGradingCount > 0) {
    exam.pendingGradingCount = Math.max(0, exam.pendingGradingCount - 1);
    if (exam.pendingGradingCount === 0 && exam.status === 'grading') {
      exam.status = 'pending_approval'; // Ready for Results Officer!
    }
  }

  res.json({ success: true, submission: sub });
});

// 11. Student Results History
app.get('/api/student/my-results', authenticateJWT, (req: AuthRequest, res) => {
  const studentId = req.user?.id;
  // Student can only see results that have been officially approved and published!
  const list = Array.from(db.submissions.values()).filter(
    (s) => s.studentId === studentId && s.resultsPublished
  );
  res.json({ results: list });
});

// 12. Dashboard Statistics & Overview
app.get('/api/dashboard/stats', authenticateJWT, (req: AuthRequest, res) => {
  const uniId = req.user?.universityId || 'univ_oakridge';
  const isSuperAdmin = req.user?.role === 'super_admin';

  const students = db.users.filter((u) => u.role === 'student' && (isSuperAdmin || u.universityId === uniId));
  const lecturers = db.users.filter((u) => u.role === 'lecturer' && (isSuperAdmin || u.universityId === uniId));
  const exams = db.examinations.filter((e) => isSuperAdmin || e.universityId === uniId);
  const activeExams = exams.filter((e) => e.status === 'active');
  const completedExams = exams.filter((e) => e.status === 'published' || e.status === 'grading' || e.status === 'pending_approval');
  const submissions = Array.from(db.submissions.values()).filter((s) => isSuperAdmin || s.universityId === uniId);

  const totalPassed = submissions.filter((s) => s.isPassed).length;
  const passRate = submissions.length > 0 ? Math.round((totalPassed / submissions.length) * 100) : 88;
  const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((a, b) => a + (b.percentage || 78), 0) / submissions.length) : 82;

  res.json({
    totalUniversities: db.universities.length,
    totalFaculties: db.faculties.length,
    totalDepartments: db.departments.length,
    totalPrograms: db.programs.length,
    totalStudents: students.length,
    totalLecturers: lecturers.length,
    totalExams: exams.length,
    activeExamsCount: activeExams.length,
    completedExamsCount: completedExams.length,
    pendingGradingCount: exams.reduce((acc, e) => acc + (e.pendingGradingCount || 0), 0),
    pendingApprovalCount: exams.filter((e) => e.status === 'pending_approval').length,
    passRate,
    avgScore,
    recentExams: exams.slice(0, 5),
    recentIncidents: db.incidents.slice(0, 5),
    announcements: db.announcements.slice(0, 3),
  });
});

// 13. Audit Logs & Announcements
app.get('/api/audit-logs', authenticateJWT, requireRoles('super_admin', 'university_admin', 'results_officer'), (req: AuthRequest, res) => {
  res.json({ logs: db.auditLogs.slice(0, 30) });
});

app.get('/api/announcements', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ announcements: db.announcements });
});

app.post('/api/announcements', authenticateJWT, requireRoles('super_admin', 'university_admin'), (req: AuthRequest, res) => {
  const { title, content, priority, targetRole } = req.body;
  const announcement: SystemAnnouncement = {
    id: `anc_${Date.now()}`,
    universityId: req.user?.universityId || 'univ_oakridge',
    title,
    content,
    priority: priority || 'normal',
    targetRole: targetRole || 'all',
    createdAt: new Date().toISOString(),
  };
  db.announcements.unshift(announcement);
  res.status(201).json({ announcement });
});

// ----------------------------------------------------
// Mounting Dev Vite or Static
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExamPro University Engine] Server listening on port ${PORT}`);
  });
}

startServer();
