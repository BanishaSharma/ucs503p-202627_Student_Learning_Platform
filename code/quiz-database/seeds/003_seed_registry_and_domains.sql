-- ============================================================
-- ShikshaSetu Platform — Registry, Domains & Lifecycle Seed
-- Seed: 003_seed_registry_and_domains.sql
-- ============================================================

-- ---------- 1. SEED SCHOOLS ----------
INSERT INTO schools (name, code, district) VALUES
    ('Government Senior Secondary Smart School, Model Town, Patiala', 'PB-PTA-0101', 'Patiala'),
    ('Government Model Senior Secondary School, PAU Campus, Ludhiana', 'PB-LDH-0202', 'Ludhiana'),
    ('Government Girls Senior Secondary School, Mall Road, Amritsar', 'PB-ASR-0303', 'Amritsar')
ON CONFLICT (code) DO NOTHING;

-- ---------- 2. SEED APPROVED EMAIL DOMAINS ----------
INSERT INTO approved_email_domains (domain, description) VALUES
    ('punjab.gov.in', 'Government of Punjab Official State Domain'),
    ('gsss.punjab.gov.in', 'Punjab Government Senior Secondary Schools Subdomain'),
    ('student.punjab.gov.in', 'Punjab State School Student Accounts'),
    ('shikshasetu.gov.in', 'ShikshaSetu Platform Administrative Domain')
ON CONFLICT (domain) DO NOTHING;

-- ---------- 3. SEED PRE-APPROVED STUDENT REGISTRY ----------
-- These records allow authorized students to register with their genuine class and roll number.
-- Class IDs: 1 = Class 8, 2 = Class 9, 3 = Class 10
INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered)
SELECT 
    s.id,
    'harman.class9@punjab.gov.in',
    'Harmanpreet Singh',
    2, -- Class 9
    '201',
    'A',
    false
FROM schools s WHERE s.code = 'PB-PTA-0101'
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered)
SELECT 
    s.id,
    'amrit.class9@gsss.punjab.gov.in',
    'Amritpal Kaur',
    2, -- Class 9
    '202',
    'B',
    false
FROM schools s WHERE s.code = 'PB-PTA-0101'
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered)
SELECT 
    s.id,
    'karan.class8@punjab.gov.in',
    'Karan Deep Singh',
    1, -- Class 8
    '104',
    'A',
    false
FROM schools s WHERE s.code = 'PB-PTA-0101'
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered)
SELECT 
    s.id,
    'manpreet.class10@student.punjab.gov.in',
    'Manpreet Kaur',
    3, -- Class 10
    '301',
    'A',
    false
FROM schools s WHERE s.code = 'PB-LDH-0202'
ON CONFLICT (email) DO NOTHING;

-- Also register already existing seeded students in registry
INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered, registered_user_id)
SELECT 
    (SELECT id FROM schools WHERE code = 'PB-PTA-0101'),
    'gurleen.class8@punjab.gov.in',
    'Gurleen Kaur',
    1,
    '101',
    'A',
    true,
    (SELECT id FROM users WHERE email = 'gurleen.class8@punjab.gov.in')
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered, registered_user_id)
SELECT 
    (SELECT id FROM schools WHERE code = 'PB-PTA-0101'),
    'navjot.class9@punjab.gov.in',
    'Navjot Singh',
    2,
    '102',
    'A',
    true,
    (SELECT id FROM users WHERE email = 'navjot.class9@punjab.gov.in')
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_registry (school_id, email, full_name, class_id, roll_number, section, is_registered, registered_user_id)
SELECT 
    (SELECT id FROM schools WHERE code = 'PB-PTA-0101'),
    'simran.class10@punjab.gov.in',
    'Simran Kaur',
    3,
    '103',
    'B',
    true,
    (SELECT id FROM users WHERE email = 'simran.class10@punjab.gov.in')
ON CONFLICT (email) DO NOTHING;
