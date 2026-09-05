-- ============================================================
-- ShikshaSetu Platform — Seed Data (PostgreSQL)
-- Seed: 001_seed_quiz_data.sql
-- ============================================================

-- ---------- USERS ----------
INSERT INTO users (name, email, password_hash, role) VALUES
('Gurpreet Singh (Teacher)', 'gurpreet.teacher@punjab.gov.in', 'demo_hash_teacher', 'teacher'),
('Amanpreet Kaur (Student)', 'amanpreet.student@punjab.gov.in', 'demo_hash_student', 'student'),
('Simranjit Singh (Student)', 'simran.student@punjab.gov.in', 'demo_hash_student', 'student')
ON CONFLICT (email) DO NOTHING;

-- ---------- CLASSES ----------
INSERT INTO classes (id, name) VALUES
(1, 'Class 8'),
(2, 'Class 9'),
(3, 'Class 10')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Reset sequence for classes
SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes));

-- ---------- SUBJECTS ----------
INSERT INTO subjects (id, class_id, name) VALUES
(1, 1, 'Mathematics'),
(2, 1, 'Science'),
(3, 2, 'Mathematics'),
(4, 2, 'Science'),
(5, 3, 'Mathematics'),
(6, 3, 'Science')
ON CONFLICT (id) DO UPDATE SET class_id = EXCLUDED.class_id, name = EXCLUDED.name;

SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));

-- ---------- CHAPTERS ----------
INSERT INTO chapters (id, subject_id, name) VALUES
-- Class 8 Mathematics
(1, 1, 'Rational Numbers'),
(2, 1, 'Linear Equations in One Variable'),
-- Class 8 Science
(3, 2, 'Force and Pressure'),
-- Class 9 Mathematics
(4, 3, 'Number Systems'),
(5, 3, 'Polynomials'),
-- Class 10 Mathematics
(6, 5, 'Real Numbers'),
-- Class 10 Science
(7, 6, 'Light - Reflection and Refraction')
ON CONFLICT (id) DO UPDATE SET subject_id = EXCLUDED.subject_id, name = EXCLUDED.name;

SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));

-- ---------- QUIZZES ----------
INSERT INTO quizzes (id, chapter_id, title, description, duration_minutes, total_marks) VALUES
(1, 1, 'Rational Numbers - Fundamentals', 'Test your understanding of rational numbers, closure, and commutativity properties.', 15, 3),
(2, 1, 'Rational Numbers - Advanced Problems', 'Practice representation on number line and finding rational numbers between two numbers.', 20, 2),
(3, 2, 'Linear Equations Basics', 'Solving simple linear equations with variables on one side.', 15, 2),
(4, 3, 'Force and Pressure Concepts', 'Identify types of forces, pressure in fluids, and atmospheric pressure.', 15, 2)
ON CONFLICT (id) DO UPDATE SET 
    chapter_id = EXCLUDED.chapter_id, 
    title = EXCLUDED.title, 
    description = EXCLUDED.description, 
    duration_minutes = EXCLUDED.duration_minutes, 
    total_marks = EXCLUDED.total_marks;

SELECT setval('quizzes_id_seq', (SELECT MAX(id) FROM quizzes));

-- ---------- QUESTIONS ----------
-- Questions for Quiz 1: Rational Numbers - Fundamentals
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order) VALUES
(1, 1, 'Which of the following numbers is the additive identity for rational numbers?', '1', '0', '-1', 'None of these', 'B', 1),
(2, 1, 'The reciprocal of a positive rational number is always:', 'Negative', 'Zero', 'Positive', 'Not defined', 'C', 2),
(3, 1, 'Which of the following rational numbers lies between 1/4 and 1/2?', '3/8', '1/8', '5/8', '3/4', 'A', 3),

-- Questions for Quiz 2: Rational Numbers - Advanced Problems
(4, 2, 'What is the multiplicative inverse of -13/19?', '-19/13', '19/13', '13/19', '-1', 'A', 1),
(5, 2, 'Between any two given rational numbers, how many rational numbers exist?', 'Only 1', 'Only 10', 'Only 100', 'Countless (Infinitely many)', 'D', 2),

-- Questions for Quiz 3: Linear Equations Basics
(6, 3, 'If 2x - 3 = 7, then the value of x is:', '2', '5', '4', '10', 'B', 1),
(7, 3, 'The solution of the equation y/3 = 10 is:', '30', '13', '10/3', '7', 'A', 2),

-- Questions for Quiz 4: Force and Pressure Concepts
(8, 4, 'Which of the following is an example of a non-contact force?', 'Frictional force', 'Muscular force', 'Magnetic force', 'Mechanical force', 'C', 1),
(9, 4, 'Pressure is defined as:', 'Force × Area', 'Force / Area', 'Area / Force', 'Mass × Acceleration', 'B', 2)
ON CONFLICT (id) DO UPDATE SET 
    quiz_id = EXCLUDED.quiz_id,
    question_text = EXCLUDED.question_text,
    option_a = EXCLUDED.option_a,
    option_b = EXCLUDED.option_b,
    option_c = EXCLUDED.option_c,
    option_d = EXCLUDED.option_d,
    correct_answer = EXCLUDED.correct_answer,
    question_order = EXCLUDED.question_order;

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));
