-- ====================================================================
-- EXAMPRO: University Online Examination Management System
-- PostgreSQL & Supabase Database Migration
-- Target Supabase Org: juxjidrscvkectddstvhd
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. UNIVERSITIES
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    domain VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FACULTIES
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    dean_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    head_of_department VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC PROGRAMS
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    degree_level VARCHAR(50) DEFAULT 'undergraduate',
    duration_years INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACADEMIC YEARS & SEMESTERS
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    semester_number INT NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COURSES / MODULES
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    credit_units INT NOT NULL DEFAULT 3,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CLASS COHORTS
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) DEFAULT '200 Level',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'university_admin', 'lecturer', 'student', 'invigilator', 'results_officer')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    student_id VARCHAR(100),
    employee_id VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    program_id UUID REFERENCES programs(id),
    class_id UUID REFERENCES classes(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. QUESTIONS (Supports all 8 Question Types)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'multiple_select', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching', 'file_upload')),
    title TEXT NOT NULL,
    marks NUMERIC(5,2) NOT NULL DEFAULT 5.0,
    negative_marks NUMERIC(5,2) DEFAULT 0.0,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url TEXT,
    options JSONB,
    matching_pairs JSONB,
    fill_blanks JSONB,
    file_upload_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ANSWER KEYS (Protected: Isolated from student reads)
CREATE TABLE IF NOT EXISTS answer_keys (
    question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
    correct_answer JSONB NOT NULL,
    rubric TEXT,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EXAMINATIONS
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    duration_minutes INT NOT NULL DEFAULT 60,
    total_marks NUMERIC(6,2) NOT NULL,
    passing_marks NUMERIC(6,2) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'grading', 'pending_approval', 'published')),
    rules JSONB,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    negative_marking BOOLEAN DEFAULT FALSE,
    strict_tab_lockout BOOLEAN DEFAULT TRUE,
    max_allowed_tab_switches INT DEFAULT 2,
    results_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. EXAM QUESTIONS JUNCTION
CREATE TABLE IF NOT EXISTS exam_questions (
    exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INT DEFAULT 0,
    PRIMARY KEY (exam_id, question_id)
);

-- 13. EXAMINATION SESSIONS
CREATE TABLE IF NOT EXISTS examination_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'locked_out', 'submitted', 'timed_out', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    tab_switches INT DEFAULT 0,
    is_locked_out BOOLEAN DEFAULT FALSE,
    lockout_reason TEXT,
    extra_time_minutes INT DEFAULT 0,
    ip_address VARCHAR(45),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);

-- 14. STUDENT SUBMITTED ANSWERS
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES examination_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_payload JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    marks_awarded NUMERIC(5,2),
    examiner_feedback TEXT,
    is_manually_graded BOOLEAN DEFAULT FALSE,
    UNIQUE (session_id, question_id)
);

-- 15. SUBMISSIONS & RATIFIED RESULTS
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES examination_sessions(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    total_marks NUMERIC(6,2) NOT NULL,
    obtained_marks NUMERIC(6,2) NOT NULL,
    passing_marks NUMERIC(6,2) NOT NULL,
    is_passed BOOLEAN NOT NULL,
    auto_graded_marks NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    subjective_marks NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    requires_manual_grading BOOLEAN DEFAULT FALSE,
    is_fully_graded BOOLEAN DEFAULT FALSE,
    approved_by_results_officer BOOLEAN DEFAULT FALSE,
    results_published BOOLEAN DEFAULT FALSE,
    percentage NUMERIC(5,2),
    letter_grade VARCHAR(5),
    gpa_points NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. INCIDENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS examination_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES examination_sessions(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Answer Keys Security: Students can NEVER directly SELECT answer keys!
CREATE POLICY "Answer keys hidden from students"
    ON answer_keys
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'university_admin', 'lecturer', 'results_officer')
        )
    );

-- Student Session Security: Students can only read/update their own exam session
CREATE POLICY "Student own session access"
    ON examination_sessions
    FOR ALL
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'university_admin', 'lecturer', 'invigilator', 'results_officer')
    ));
