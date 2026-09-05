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
(6, 3, 'Science'),
(7, 3, 'English'),
(8, 3, 'Social Science'),
(9, 2, 'English'),
(10, 2, 'Social Science'),
(11, 1, 'English'),
(12, 1, 'Social Science')
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
-- Class 9 Science
(6, 4, 'Matter in Our Surroundings'),
-- Class 10 Mathematics
(7, 5, 'Real Numbers'),
-- Class 10 Science
(8, 6, 'Light - Reflection and Refraction'),
-- Class 10 English
(9, 7, 'A Letter to God'),
-- Class 10 Social Science
(10, 8, 'The Rise of Nationalism in Europe')
ON CONFLICT (id) DO UPDATE SET subject_id = EXCLUDED.subject_id, name = EXCLUDED.name;

SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));

-- ---------- QUIZZES ----------
INSERT INTO quizzes (id, chapter_id, title, description, duration_minutes, total_marks) VALUES
(1, 1, 'Rational Numbers - Fundamentals', 'Test your understanding of rational numbers, closure, and commutativity properties.', 15, 3),
(2, 1, 'Rational Numbers - Advanced Problems', 'Practice representation on number line and finding rational numbers between two numbers.', 20, 2),
(3, 2, 'Linear Equations Basics', 'Solving simple linear equations with variables on one side.', 15, 2),
(4, 3, 'Force and Pressure Concepts', 'Identify types of forces, pressure in fluids, and atmospheric pressure.', 15, 2),
(5, 4, 'Number Systems Practice Quiz', 'Rational and irrational numbers, decimal expansions, and real numbers.', 15, 3),
(6, 5, 'Polynomials Diagnostic Assessment', 'Test your grasp of degrees, zeroes, and polynomial identities.', 15, 4),
(7, 7, 'Real Numbers Mastery Quiz', 'Euclid division lemma, Fundamental Theorem of Arithmetic, and irrationality proofs.', 15, 4),
(8, 8, 'Optics & Reflection Fundamentals', 'Concave and convex mirrors, focal length, ray diagrams, and lens formulas.', 15, 3),
(9, 9, 'A Letter to God - Comprehension', 'Reading comprehension, character motivation, and metaphors.', 10, 3),
(10, 10, 'Nationalism in Europe Overview', 'French Revolution, Napoleon Civil Code, and European unification.', 15, 3),
(11, 6, 'States of Matter & Phase Changes', 'Kinetic molecular theory, latent heat, and sublimation.', 15, 3)
ON CONFLICT (id) DO UPDATE SET 
    chapter_id = EXCLUDED.chapter_id, 
    title = EXCLUDED.title, 
    description = EXCLUDED.description, 
    duration_minutes = EXCLUDED.duration_minutes, 
    total_marks = EXCLUDED.total_marks;

SELECT setval('quizzes_id_seq', (SELECT MAX(id) FROM quizzes));

-- ---------- QUESTIONS ----------
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order) VALUES
-- Quiz 1: Rational Numbers - Fundamentals
(1, 1, 'Which of the following numbers is the additive identity for rational numbers?', '1', '0', '-1', 'None of these', 'B', 1),
(2, 1, 'The reciprocal of a positive rational number is always:', 'Negative', 'Zero', 'Positive', 'Not defined', 'C', 2),
(3, 1, 'Which of the following rational numbers lies between 1/4 and 1/2?', '3/8', '1/8', '5/8', '3/4', 'A', 3),

-- Quiz 2: Rational Numbers - Advanced Problems
(4, 2, 'What is the multiplicative inverse of -13/19?', '-19/13', '19/13', '13/19', '-1', 'A', 1),
(5, 2, 'Between any two given rational numbers, how many rational numbers exist?', 'Only 1', 'Only 10', 'Only 100', 'Countless (Infinitely many)', 'D', 2),

-- Quiz 3: Linear Equations Basics
(6, 3, 'If 2x - 3 = 7, then the value of x is:', '2', '5', '4', '10', 'B', 1),
(7, 3, 'The solution of the equation y/3 = 10 is:', '30', '13', '10/3', '7', 'A', 2),

-- Quiz 4: Force and Pressure Concepts
(8, 4, 'Which of the following is an example of a non-contact force?', 'Frictional force', 'Muscular force', 'Magnetic force', 'Mechanical force', 'C', 1),
(9, 4, 'Pressure is defined as:', 'Force × Area', 'Force / Area', 'Area / Force', 'Mass × Acceleration', 'B', 2),

-- Quiz 5: Number Systems Practice Quiz (Class 9 Math)
(10, 5, 'Every rational number is:', 'A natural number', 'An integer', 'A real number', 'A whole number', 'C', 1),
(11, 5, 'Between two rational numbers there is:', 'No rational number', 'Exactly one rational number', 'Infinitely many rational numbers', 'Only irrational numbers', 'C', 2),
(12, 5, 'The decimal representation of an irrational number is always:', 'Terminating', 'Non-terminating recurring', 'Non-terminating non-recurring', 'None of these', 'C', 3),

-- Quiz 6: Polynomials Diagnostic Assessment (Class 9 Math)
(13, 6, 'Which of the following expressions is a polynomial?', '1/x + 2', 'x² + 3x + 2', '√x + 1', 'x⁻¹ + 4', 'B', 1),
(14, 6, 'What is the degree of a non-zero constant polynomial?', '0', '1', '2', 'Not Defined', 'A', 2),
(15, 6, 'If α and β are zeroes of x² - 5x + 6, the value of (α + β) is:', '5', '-5', '6', '-6', 'A', 3),
(16, 6, 'The maximum number of zeroes a cubic polynomial can have is:', '1', '2', '3', '4', 'C', 4),

-- Quiz 7: Real Numbers Mastery Quiz (Class 10 Math)
(17, 7, 'The HCF of 24 and 36 is:', '6', '12', '18', '24', 'B', 1),
(18, 7, 'If two positive integers a and b are written as a = x³y² and b = xy³, then HCF(a, b) is:', 'xy', 'xy²', 'x³y³', 'x²y²', 'B', 2),
(19, 7, 'The product of a non-zero rational number and an irrational number is always:', 'Irrational', 'Rational', 'Zero', 'One', 'A', 3),
(20, 7, 'If the LCM of 12 and 42 is 10m + 4, the value of m is:', '7', '8', '9', '6', 'B', 4),

-- Quiz 8: Optics & Reflection Fundamentals (Class 10 Science)
(21, 8, 'The focal length of a spherical mirror of radius of curvature 30 cm is:', '15 cm', '30 cm', '60 cm', '10 cm', 'A', 1),
(22, 8, 'An object is placed at infinity in front of a concave mirror. The image is formed at:', 'The focus', 'The center of curvature', 'Between focus and center', 'Infinity', 'A', 2),
(23, 8, 'Which of the following materials cannot be used to make a lens?', 'Water', 'Glass', 'Plastic', 'Clay', 'D', 3),

-- Quiz 9: A Letter to God - Comprehension (Class 10 English)
(24, 9, 'Where was Lencho''s house situated?', 'At the bottom of the hill', 'On the crest of a low hill', 'In the city center', 'Deep inside a forest', 'B', 1),
(25, 9, 'What destroyed Lencho''s crops entirely?', 'A heavy hailstorm', 'An insect invasion', 'A river flood', 'Severe drought', 'A', 2),
(26, 9, 'How much money did Lencho receive in the envelope?', '100 pesos', '70 pesos', '50 pesos', '30 pesos', 'B', 3),

-- Quiz 10: Nationalism in Europe Overview (Class 10 Social Science)
(27, 10, 'Frederic Sorrieu was an artist belonging to which country?', 'Germany', 'France', 'Italy', 'Britain', 'B', 1),
(28, 10, 'The Civil Code of 1804 in France is popularly known as the:', 'French Republican Code', 'Napoleonic Code', 'European Union Code', 'Declaration of Rights', 'B', 2),
(29, 10, 'Zollverein, formed in 1834 at the initiative of Prussia, was a:', 'Customs union', 'Military alliance', 'Religious council', 'Labour federation', 'A', 3),

-- Quiz 11: States of Matter & Phase Changes (Class 9 Science)
(30, 11, 'The change of a solid directly into vapors on heating is called:', 'Evaporation', 'Sublimation', 'Condensation', 'Fusion', 'B', 1),
(31, 11, 'The boiling point of water on the Kelvin temperature scale is:', '273 K', '373 K', '100 K', '0 K', 'B', 2),
(32, 11, 'Which state of matter has a definite volume but no fixed shape?', 'Solid', 'Liquid', 'Gas', 'Plasma', 'B', 3)
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

