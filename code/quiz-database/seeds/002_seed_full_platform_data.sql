-- ============================================================
-- ShikshaSetu Platform — Full Platform Seed Data (PostgreSQL)
-- Seed: 002_seed_full_platform_data.sql
-- All passwords default to: Password@123
-- Hash: $2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni
-- ============================================================

-- ---------- 1. USERS & PASSWORDS ----------
-- Update existing legacy seed users to real bcrypt hash
UPDATE users 
SET password_hash = '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', is_active = true 
WHERE email IN ('gurpreet.teacher@punjab.gov.in', 'amanpreet.student@punjab.gov.in', 'simran.student@punjab.gov.in');

-- Insert Admin, Teachers, and Students with bcrypt hash
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
(10, 'State Administrator', 'admin@shikshasetu.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'admin', true),
(11, 'Harpreet Kaur (Math/Sci Teacher)', 'harpreet.math@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'teacher', true),
(12, 'Manjit Singh (Class 9 Teacher)', 'manjit.math@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'teacher', true),
(13, 'Gurleen Kaur (Class 8)', 'gurleen.class8@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'student', true),
(14, 'Navjot Singh (Class 9)', 'navjot.class9@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'student', true),
(15, 'Simranjit Singh (Class 10)', 'simran.class10@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'student', true),
(16, 'Deactivated Student', 'inactive.student@punjab.gov.in', '$2b$10$VlYSKwdiin4yek3yYVn2OOgMzrqx0z01N6K.72zJZu3slhgnpKXni', 'student', false)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, 
    role = EXCLUDED.role, 
    is_active = EXCLUDED.is_active;

SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 20));

-- ---------- 2. TEACHER PROFILES ----------
INSERT INTO teachers (user_id, employee_id, qualification) VALUES
(11, 'EMP-2024-001', 'M.Sc. Mathematics, B.Ed.'),
(12, 'EMP-2024-002', 'M.Sc. Physics, B.Ed.')
ON CONFLICT (user_id) DO UPDATE 
SET employee_id = EXCLUDED.employee_id, qualification = EXCLUDED.qualification;

-- Also profile for legacy teacher (user id 1 if exists)
INSERT INTO teachers (user_id, employee_id, qualification)
SELECT id, 'EMP-2023-099', 'B.Sc., B.Ed.' FROM users WHERE email = 'gurpreet.teacher@punjab.gov.in'
ON CONFLICT (user_id) DO NOTHING;

-- ---------- 3. STUDENT PROFILES ----------
-- Gurleen -> Class 8
INSERT INTO students (user_id, class_id, roll_number, section) VALUES
(13, 1, '801', 'A')
ON CONFLICT (user_id) DO UPDATE SET class_id = EXCLUDED.class_id, roll_number = EXCLUDED.roll_number;

-- Amanpreet (legacy) -> Class 8
INSERT INTO students (user_id, class_id, roll_number, section)
SELECT id, 1, '802', 'A' FROM users WHERE email = 'amanpreet.student@punjab.gov.in'
ON CONFLICT (user_id) DO NOTHING;

-- Navjot -> Class 9
INSERT INTO students (user_id, class_id, roll_number, section) VALUES
(14, 2, '901', 'A')
ON CONFLICT (user_id) DO UPDATE SET class_id = EXCLUDED.class_id, roll_number = EXCLUDED.roll_number;

-- Simranjit -> Class 10
INSERT INTO students (user_id, class_id, roll_number, section) VALUES
(15, 3, '1001', 'B')
ON CONFLICT (user_id) DO UPDATE SET class_id = EXCLUDED.class_id, roll_number = EXCLUDED.roll_number;

-- Inactive Student -> Class 8
INSERT INTO students (user_id, class_id, roll_number, section) VALUES
(16, 1, '899', 'A')
ON CONFLICT (user_id) DO UPDATE SET class_id = EXCLUDED.class_id, roll_number = EXCLUDED.roll_number;

-- ---------- 4. TEACHER CLASS ASSIGNMENTS ----------
-- Harpreet (Teacher 11) -> Class 8 Mathematics & Science
INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
SELECT t.id, 1, 1 FROM teachers t WHERE t.user_id = 11
ON CONFLICT DO NOTHING;

INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
SELECT t.id, 1, 2 FROM teachers t WHERE t.user_id = 11
ON CONFLICT DO NOTHING;

-- Manjit (Teacher 12) -> Class 9 Mathematics & Science
INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
SELECT t.id, 2, 3 FROM teachers t WHERE t.user_id = 12
ON CONFLICT DO NOTHING;

INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
SELECT t.id, 2, 4 FROM teachers t WHERE t.user_id = 12
ON CONFLICT DO NOTHING;

-- ---------- 5. UPDATE QUIZZES WITH CREATOR & STATUS ----------
UPDATE quizzes 
SET created_by = 11, status = 'published'
WHERE chapter_id IN (1, 2, 3);

UPDATE quizzes 
SET created_by = 12, status = 'published'
WHERE chapter_id IN (4, 5, 6);

-- Insert a draft quiz for teacher 11
INSERT INTO quizzes (id, chapter_id, title, description, duration_minutes, total_marks, created_by, status) VALUES
(12, 1, 'Class 8 Rational Numbers - Teacher Draft Quiz', 'Draft test quiz not yet visible to students.', 15, 5, 11, 'draft')
ON CONFLICT (id) DO UPDATE 
SET status = EXCLUDED.status, created_by = EXCLUDED.created_by;

SELECT setval('quizzes_id_seq', GREATEST((SELECT MAX(id) FROM quizzes), 20));

-- ---------- 6. PUNJABI TRANSLATIONS FOR QUESTIONS ----------
-- Q1: Rational Numbers
UPDATE questions SET
    question_text_pa = 'ਸਭ ਤੋਂ ਛੋਟੀ ਪੂਰਨ ਸੰਖਿਆ (Whole Number) ਕਿਹੜੀ ਹੈ?',
    option_a_pa = '0',
    option_b_pa = '1',
    option_c_pa = '-1',
    option_d_pa = 'ਕੋਈ ਨਹੀਂ'
WHERE id = 1;

-- Q2: Rational Numbers
UPDATE questions SET
    question_text_pa = '3/4 + 1/4 ਦਾ ਮੁੱਲ ਕੀ ਹੈ?',
    option_a_pa = '1/2',
    option_b_pa = '3/8',
    option_c_pa = '1',
    option_d_pa = '4/8'
WHERE id = 2;

-- Q3: Rational Numbers
UPDATE questions SET
    question_text_pa = 'ਕਿਹੜੀ ਸੰਖਿਆ ਪਰਿਮੇਯ ਸੰਖਿਆ (Rational Number) ਨਹੀਂ ਹੈ?',
    option_a_pa = '5/0',
    option_b_pa = '2/3',
    option_c_pa = '0/1',
    option_d_pa = '-4/7'
WHERE id = 3;

-- Q4: Force & Pressure
UPDATE questions SET
    question_text_pa = 'ਬਲ (Force) ਦੀ SI ਇਕਾਈ ਕੀ ਹੈ?',
    option_a_pa = 'ਜੂਲ (Joule)',
    option_b_pa = 'ਨਿਊਟਨ (Newton)',
    option_c_pa = 'ਪਾਸਕਲ (Pascal)',
    option_d_pa = 'ਵਾਟ (Watt)'
WHERE id = 4;

-- Q5: Force & Pressure
UPDATE questions SET
    question_text_pa = 'ਪ੍ਰਤੀ ਇਕਾਈ ਖੇਤਰਫਲ ਉੱਤੇ ਲੱਗਣ ਵਾਲੇ ਬਲ ਨੂੰ ਕੀ ਕਿਹਾ ਜਾਂਦਾ ਹੈ?',
    option_a_pa = 'ਦਬਾਅ (Pressure)',
    option_b_pa = 'ਰਗੜ (Friction)',
    option_c_pa = 'ਗੁਰੂਤਾਕਰਸ਼ਣ (Gravity)',
    option_d_pa = 'ਜੜ੍ਹਤਾ (Inertia)'
WHERE id = 5;

-- ---------- 7. STUDENT QUERIES (DOUBTS) & RESPONSES ----------
INSERT INTO student_queries (student_id, class_id, subject_id, chapter_id, title, description, status)
SELECT s.id, 1, 1, 1, 'Why is division by zero undefined in rational numbers?', 
       'Madam, why can we not write a rational number with denominator zero like 5/0?', 'resolved'
FROM students s WHERE s.user_id = 13
AND NOT EXISTS (SELECT 1 FROM student_queries sq WHERE sq.title = 'Why is division by zero undefined in rational numbers?');

INSERT INTO query_responses (query_id, responder_id, response_text)
SELECT sq.id, 11, 'Because division by zero is mathematically undefined; any rational number p/q requires q != 0.'
FROM student_queries sq WHERE sq.title LIKE 'Why is division by zero%'
AND NOT EXISTS (SELECT 1 FROM query_responses qr WHERE qr.query_id = sq.id);

INSERT INTO student_queries (student_id, class_id, subject_id, chapter_id, title, description, status)
SELECT s.id, 1, 2, 3, 'Difference between contact and non-contact forces?', 
       'Can you explain why magnetic force acts without physical touch whereas friction requires surface contact?', 'open'
FROM students s WHERE s.user_id = 13
AND NOT EXISTS (SELECT 1 FROM student_queries sq WHERE sq.title = 'Difference between contact and non-contact forces?');

SELECT setval('student_queries_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM student_queries), 10));
SELECT setval('query_responses_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM query_responses), 10));
