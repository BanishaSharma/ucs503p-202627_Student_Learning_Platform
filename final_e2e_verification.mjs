/**
 * ShikshaSetu Platform — Final End-to-End Verification Suite
 * Executes the complete real-world lifecycle from admin teacher provisioning to student quiz attempt and doubt resolution.
 */

import pg from "./code/quiz-backend/node_modules/pg/lib/index.js";
import dotenv from "./code/quiz-backend/node_modules/dotenv/lib/main.js";

dotenv.config({ path: "./code/quiz-backend/.env" });

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runEndToEndScenario() {
  console.log("\n==================================================================");
  console.log("SHIKSHASETU PLATFORM — COMPLETE END-TO-END LIFECYCLE VERIFICATION");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const teacherEmail = `e2e.teacher.${timestamp}@punjab.gov.in`;
  const studentEmail = "harman.class9@punjab.gov.in";

  // Clean up any previous test state for harman and e2e teacher
  await pool.query(`
    DELETE FROM email_verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email = '${studentEmail}' OR email LIKE 'e2e.teacher%');
    DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = '${studentEmail}' OR email LIKE 'e2e.teacher%');
    DELETE FROM query_responses WHERE responder_id IN (SELECT id FROM users WHERE email LIKE 'e2e.teacher%');
    DELETE FROM student_queries WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email = '${studentEmail}'));
    DELETE FROM quiz_attempts WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email = '${studentEmail}'));
    DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email = '${studentEmail}');
    DELETE FROM teacher_class_assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.teacher%'));
    DELETE FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.teacher%');
    DELETE FROM users WHERE email = '${studentEmail}' OR email LIKE 'e2e.teacher%';
    UPDATE student_registry SET is_registered = false, registered_user_id = NULL WHERE email = '${studentEmail}';
  `);

  // STEP 1: Admin logs in
  console.log("--- STEP 1: Admin Authentication ---");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@shikshasetu.gov.in", password: "Password@123" })
  });
  const adminLoginJson = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminLoginJson.data?.token, "Admin authenticates successfully");
  const adminToken = adminLoginJson.data?.token;

  // STEP 2: Admin provisions teacher
  console.log("\n--- STEP 2: Admin Provisions Teacher Account ---");
  const provTeacherRes = await fetch(`${BASE_URL}/api/admin/teachers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Sardar Satnam Singh",
      email: teacherEmail,
      employeeId: `EMP-${timestamp.toString().slice(-4)}`,
      qualification: "M.Sc. Mathematics, B.Ed."
    })
  });
  const provTeacherJson = await provTeacherRes.json();
  assert(provTeacherRes.status === 201 && provTeacherJson.data?.status === "invited", "Teacher provisioned in 'invited' lifecycle state");
  const inviteToken = provTeacherJson.data?.inviteToken;
  const teacherId = provTeacherJson.data?.teacherId;

  // STEP 3: Teacher accepts invitation and sets password
  console.log("\n--- STEP 3: Teacher Accepts Invitation ---");
  const acceptInviteRes = await fetch(`${BASE_URL}/api/auth/teacher/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: inviteToken, password: "TeacherSecurePassword@123" })
  });
  assert(acceptInviteRes.status === 200, "Teacher accepts invitation and sets initial password");

  // STEP 4: Teacher logs in
  console.log("\n--- STEP 4: Teacher Authentication ---");
  const teacherLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "TeacherSecurePassword@123" })
  });
  const teacherLoginJson = await teacherLoginRes.json();
  assert(teacherLoginRes.status === 200 && teacherLoginJson.data?.token, "Teacher authenticates with newly set credentials");
  const teacherToken = teacherLoginJson.data?.token;

  // STEP 5: Admin assigns teacher to Class 9 (classId: 2) and Mathematics (subjectId: 3)
  console.log("\n--- STEP 5: Admin Assigns Teacher to Class 9 Mathematics ---");
  const assignRes = await fetch(`${BASE_URL}/api/admin/teachers/${teacherId}/assignments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ classId: 2, subjectId: 3 })
  });
  assert(assignRes.status === 201, "Admin assigns teacher to Class 9 Mathematics");

  // STEP 6: Teacher creates a bilingual Class 9 Math quiz
  console.log("\n--- STEP 6: Teacher Creates Bilingual Class 9 Quiz ---");
  const createQuizRes = await fetch(`${BASE_URL}/api/teacher/quizzes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chapterId: 4, // Number Systems (Class 9 Math)
      title: "Class 9 Number Systems Comprehensive Assessment",
      description: "Evaluation on rational numbers and coordinate mathematics.",
      durationMinutes: 20,
      totalMarks: 10,
      questions: [
        {
          questionText: "The graph of linear equation 2x + 3y = 6 cuts the y-axis at which point?",
          questionTextPa: "ਰੇਖਿਕ ਸਮੀਕਰਨ 2x + 3y = 6 ਦਾ ਗ੍ਰਾਫ਼ y-ਧੁਰੇ ਨੂੰ ਕਿਸ ਬਿੰਦੂ 'ਤੇ ਕੱਟਦਾ ਹੈ?",
          optionA: "(0, 2)",
          optionAPa: "(0, 2)",
          optionB: "(3, 0)",
          optionBPa: "(3, 0)",
          optionC: "(2, 0)",
          optionCPa: "(2, 0)",
          optionD: "(0, 3)",
          optionDPa: "(0, 3)",
          correctAnswer: "A"
        },
        {
          questionText: "How many linear equations in x and y can be satisfied by x = 1 and y = 2?",
          questionTextPa: "x = 1 ਅਤੇ y = 2 ਦੁਆਰਾ x ਅਤੇ y ਵਿੱਚ ਕਿੰਨੇ ਰੇਖਿਕ ਸਮੀਕਰਨ ਸੰਤੁਸ਼ਟ ਹੋ ਸਕਦੇ ਹਨ?",
          optionA: "Only one",
          optionAPa: "ਸਿਰਫ਼ ਇੱਕ",
          optionB: "Two",
          optionBPa: "ਦੋ",
          optionC: "Infinitely many",
          optionCPa: "ਅਣਗਿਣਤ",
          optionD: "None",
          optionDPa: "ਕੋਈ ਨਹੀਂ",
          correctAnswer: "C"
        }
      ]
    })
  });
  const createQuizJson = await createQuizRes.json();
  assert(createQuizRes.status === 201 && createQuizJson.data?.quizId, "Teacher creates bilingual quiz with 2 questions");
  const quizId = createQuizJson.data?.quizId;

  // STEP 7: Teacher publishes quiz
  console.log("\n--- STEP 7: Teacher Publishes Quiz ---");
  const publishRes = await fetch(`${BASE_URL}/api/teacher/quizzes/${quizId}/publish`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isPublished: true })
  });
  assert(publishRes.status === 200, "Teacher publishes quiz to students");

  // STEP 8: Student registers with approved domain & matching registry record
  console.log("\n--- STEP 8: Student Self-Registration ---");
  const studentRegRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Harmanpreet Singh",
      email: studentEmail,
      password: "HarmanStudentPassword@123",
      classId: 2, // Class 9
      rollNumber: "201",
      section: "A"
    })
  });
  const studentRegJson = await studentRegRes.json();
  assert(studentRegRes.status === 201 && studentRegJson.data?.verificationToken, "Student registers with approved registry credentials");
  const verificationToken = studentRegJson.data?.verificationToken;

  // STEP 9: Student verifies email
  console.log("\n--- STEP 9: Student Email Verification ---");
  const verifyEmailRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verificationToken })
  });
  assert(verifyEmailRes.status === 200, "Student email successfully verified");

  // STEP 10: Student logs in
  console.log("\n--- STEP 10: Student Authentication ---");
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: studentEmail, password: "HarmanStudentPassword@123" })
  });
  const studentLoginJson = await studentLoginRes.json();
  assert(studentLoginRes.status === 200 && studentLoginJson.data?.token, "Verified student logs in and receives JWT");
  const studentToken = studentLoginJson.data?.token;

  // STEP 11: Student fetches quiz questions and verifies bilingual content
  console.log("\n--- STEP 11: Student Fetches Quiz Questions ---");
  const studentQuizQuestionsRes = await fetch(`${BASE_URL}/api/quizzes/${quizId}/questions`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentQuizQuestionsJson = await studentQuizQuestionsRes.json();
  assert(
    studentQuizQuestionsRes.status === 200 &&
    studentQuizQuestionsJson.data.length === 2 &&
    studentQuizQuestionsJson.data[0].questionTextPa &&
    !studentQuizQuestionsJson.data[0].correctAnswer,
    "Student receives quiz questions with Punjabi translations and without leaked correct answers"
  );
  const q1Id = studentQuizQuestionsJson.data[0].id;
  const q2Id = studentQuizQuestionsJson.data[1].id;

  // STEP 12: Student submits quiz attempt
  console.log("\n--- STEP 12: Student Submits Quiz Attempt ---");
  const submitAttemptRes = await fetch(`${BASE_URL}/api/quizzes/${quizId}/attempts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      answers: [
        { questionId: q1Id, selectedAnswer: "A" }, // Correct
        { questionId: q2Id, selectedAnswer: "C" }  // Correct
      ],
      timeTakenSeconds: 180
    })
  });
  const submitAttemptJson = await submitAttemptRes.json();
  assert(
    submitAttemptRes.status === 201 &&
    submitAttemptJson.data?.score === 2 &&
    submitAttemptJson.data?.percentage === 100,
    "Student quiz scored server-side (2/2, 100%)"
  );

  // STEP 13: Teacher views class performance
  console.log("\n--- STEP 13: Teacher Reviews Student Results ---");
  const teacherResultsRes = await fetch(`${BASE_URL}/api/teacher/results`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const teacherResultsJson = await teacherResultsRes.json();
  const harmanResult = teacherResultsJson.data?.find((r) => r.studentEmail === studentEmail);
  assert(
    teacherResultsRes.status === 200 && harmanResult && harmanResult.score === 2,
    "Teacher observes Harman's attempt in assigned Class 9 performance overview"
  );

  // STEP 14: Student asks a doubt
  console.log("\n--- STEP 14: Student Submits Academic Doubt ---");
  const askDoubtRes = await fetch(`${BASE_URL}/api/queries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      classId: 2,
      subjectId: 3,
      chapterId: 4,
      title: "How to find coordinates for y = 0?",
      description: "I need clarification on how to verify if (3,0) lies on the x-axis or y-axis."
    })
  });
  const askDoubtJson = await askDoubtRes.json();
  assert(askDoubtRes.status === 201 && askDoubtJson.data?.queryId, "Student submits doubt for Class 9 Mathematics");
  const queryId = askDoubtJson.data?.queryId;

  // STEP 15: Teacher views doubt and responds
  console.log("\n--- STEP 15: Teacher Responds to Doubt ---");
  const teacherQueriesRes = await fetch(`${BASE_URL}/api/queries`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const teacherQueriesJson = await teacherQueriesRes.json();
  const targetQuery = teacherQueriesJson.data?.find((q) => q.id === queryId);
  assert(teacherQueriesRes.status === 200 && targetQuery, "Teacher views student doubt in their inbox");

  const replyDoubtRes = await fetch(`${BASE_URL}/api/queries/${queryId}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      responseText: "When y = 0, the point lies directly on the x-axis. Substituting y=0 into 2x + 3(0) = 6 gives x = 3, yielding point (3, 0)."
    })
  });
  assert(replyDoubtRes.status === 201, "Teacher submits pedagogical guidance response");

  // STEP 16: Student views doubt resolution thread
  console.log("\n--- STEP 16: Student Reviews Teacher's Reply ---");
  const studentThreadRes = await fetch(`${BASE_URL}/api/queries/${queryId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentThreadJson = await studentThreadRes.json();
  assert(
    studentThreadRes.status === 200 &&
    studentThreadJson.data?.responses?.length === 1 &&
    studentThreadJson.data.responses[0].responseText.includes("When y = 0"),
    "Student retrieves complete doubt thread containing teacher's exact guidance"
  );

  // STEP 17: Class 8 student access control (scoping enforcement)
  console.log("\n--- STEP 17: Cross-Class Scoping & Security Enforcement ---");
  const class8LoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "gurleen.class8@punjab.gov.in", password: "Password@123" })
  });
  const class8Token = (await class8LoginRes.json()).data?.token;

  // Class 8 student attempts to access Class 9 quiz questions
  const unauthQuizRes = await fetch(`${BASE_URL}/api/quizzes/${quizId}/questions`, {
    headers: { Authorization: `Bearer ${class8Token}` }
  });
  assert(
    unauthQuizRes.status === 403,
    "Class 8 student blocked from accessing Class 9 quiz questions with HTTP 403"
  );

  await pool.end();

  console.log("\n==================================================================");
  console.log(`E2E VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runEndToEndScenario().catch((err) => {
  console.error("FATAL E2E test runner error:", err);
  pool.end();
  process.exit(1);
});
