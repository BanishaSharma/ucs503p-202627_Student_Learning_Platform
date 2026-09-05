import * as XLSX from "./code/quiz-backend/node_modules/xlsx/xlsx.mjs";

const BASE_URL = "http://localhost:5000";

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

async function runTests() {
  console.log("==================================================================");
  console.log("SHIKSHASETU PLATFORM — FULL END-TO-END AUTOMATED VERIFICATION");
  console.log("==================================================================\n");

  let adminToken, teacherToken, studentToken;
  let studentUser, teacherUser, adminUser;

  // -------------------------------------------------------------------------
  // SCENARIO A: Authentication & RBAC
  // -------------------------------------------------------------------------
  console.log("--- SCENARIO A: Role-Based Authentication & Access Control ---");
  
  // 1. Admin login
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@shikshasetu.gov.in", password: "Password@123" })
  });
  const adminJson = await adminRes.json();
  assert(adminRes.status === 200 && adminJson.data?.user?.role === "admin", "Admin logs in with role='admin'");
  adminToken = adminJson.data?.token;
  adminUser = adminJson.data?.user;

  // 2. Teacher login
  const teacherRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harpreet.math@punjab.gov.in", password: "Password@123" })
  });
  const teacherJson = await teacherRes.json();
  assert(teacherRes.status === 200 && teacherJson.data?.user?.role === "teacher", "Teacher logs in with role='teacher'");
  teacherToken = teacherJson.data?.token;
  teacherUser = teacherJson.data?.user;

  // 3. Student login
  const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "gurleen.class8@punjab.gov.in", password: "Password@123" })
  });
  const studentJson = await studentRes.json();
  assert(studentRes.status === 200 && studentJson.data?.user?.role === "student", "Student logs in with role='student'");
  assert(studentJson.data?.user?.className === "Class 8", "Student has assigned Class 8");
  studentToken = studentJson.data?.token;
  studentUser = studentJson.data?.user;

  // 4. Invalid credentials rejected
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@shikshasetu.gov.in", password: "WrongPassword" })
  });
  assert(badLogin.status === 401, "Invalid password returns HTTP 401");

  // 5. RBAC Authorization checks
  const studentUnauthorizedAdmin = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentUnauthorizedAdmin.status === 403, "Student blocked from admin routes (HTTP 403)");

  const studentUnauthorizedTeacher = await fetch(`${BASE_URL}/api/teacher/quizzes`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentUnauthorizedTeacher.status === 403, "Student blocked from teacher routes (HTTP 403)");

  const teacherUnauthorizedAdmin = await fetch(`${BASE_URL}/api/admin/teachers`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  assert(teacherUnauthorizedAdmin.status === 403, "Teacher blocked from admin routes (HTTP 403)");

  // -------------------------------------------------------------------------
  // SCENARIO B: Class Scoping & Curriculum Enforcement
  // -------------------------------------------------------------------------
  console.log("\n--- SCENARIO B: Student Class Scoping & Access Control ---");

  // 1. Scoped classes list
  const classesRes = await fetch(`${BASE_URL}/api/classes`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const classesJson = await classesRes.json();
  assert(
    classesJson.data.length === 1 && classesJson.data[0].name === "Class 8",
    "Class 8 student receives strictly Class 8 in class listing"
  );

  // 2. Class 8 subjects access
  const class8Subjects = await fetch(`${BASE_URL}/api/classes/1/subjects`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(class8Subjects.status === 200, "Class 8 student can access Class 1 subjects");

  // 3. Class 9 subjects access blocked
  const class9SubjectsBlocked = await fetch(`${BASE_URL}/api/classes/2/subjects`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(class9SubjectsBlocked.status === 403, "Class 8 student blocked from Class 2 (Class 9) subjects (HTTP 403)");

  // 4. Student takes a quiz and submits attempt
  const submitAttemptRes = await fetch(`${BASE_URL}/api/quizzes/1/attempts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      answers: [
        { questionId: 1, selectedAnswer: "A" }
      ]
    })
  });
  const submitAttemptJson = await submitAttemptRes.json();
  assert(submitAttemptRes.status === 201 && typeof submitAttemptJson.data?.score === "number", "Student successfully submits quiz attempt with computed score");

  // -------------------------------------------------------------------------
  // SCENARIO C: Teacher Quiz Management (Bilingual & Lifecycle)
  // -------------------------------------------------------------------------
  console.log("\n--- SCENARIO C: Teacher Quiz Management ---");

  const tClassesRes = await fetch(`${BASE_URL}/api/teacher/classes`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const tClassesJson = await tClassesRes.json();
  assert(tClassesJson.data.length > 0, "Teacher retrieves assigned classes");

  // Create a bilingual quiz
  const createQuizRes = await fetch(`${BASE_URL}/api/teacher/quizzes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chapterId: 1,
      title: "Automated Verification Test Quiz",
      description: "End-to-end verification test assessment",
      durationMinutes: 10,
      totalMarks: 2,
      status: "draft",
      questions: [
        {
          questionText: "What is the additive inverse of 5/9?",
          questionTextPa: "5/9 ਦਾ ਜੋੜਾਤਮਕ ਉਲਟ ਕੀ ਹੈ?",
          optionA: "-5/9",
          optionAPa: "-5/9",
          optionB: "9/5",
          optionBPa: "9/5",
          optionC: "-9/5",
          optionCPa: "-9/5",
          optionD: "0",
          optionDPa: "0",
          correctAnswer: "A"
        },
        {
          questionText: "Which number is neither positive nor negative?",
          questionTextPa: "ਕਿਹੜੀ ਸੰਖਿਆ ਨਾ ਤਾਂ ਧਨਾਤਮਕ ਹੈ ਅਤੇ ਨਾ ਹੀ ਰਿਣਾਤਮਕ?",
          optionA: "1",
          optionAPa: "1",
          optionB: "0",
          optionBPa: "0",
          optionC: "-1",
          optionCPa: "-1",
          optionD: "10",
          optionDPa: "10",
          correctAnswer: "B"
        }
      ]
    })
  });
  const createQuizJson = await createQuizRes.json();
  assert(createQuizRes.status === 201 && createQuizJson.data?.quizId, "Teacher creates bilingual quiz with English + Punjabi questions");
  const createdQuizId = createQuizJson.data?.quizId;

  // Toggle status to published
  const publishRes = await fetch(`${BASE_URL}/api/teacher/quizzes/${createdQuizId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "published" })
  });
  assert(publishRes.status === 200, "Teacher publishes quiz");

  // Verify student can now see questions including Punjabi text
  const quizQuestionsRes = await fetch(`${BASE_URL}/api/quizzes/${createdQuizId}/questions`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const quizQuestionsJson = await quizQuestionsRes.json();
  assert(
    quizQuestionsJson.data.length === 2 && quizQuestionsJson.data[0].questionTextPa !== null,
    "Student fetches questions with Punjabi translations populated"
  );

  // -------------------------------------------------------------------------
  // SCENARIO D: Excel Import (.xlsx)
  // -------------------------------------------------------------------------
  console.log("\n--- SCENARIO D: Excel Question Import (.xlsx) ---");

  // Build a test workbook
  const worksheetData = [
    {
      question_text: "What is 15 * 10?",
      question_text_pa: "15 * 10 ਕੀ ਹੁੰਦਾ ਹੈ?",
      option_a: "150",
      option_a_pa: "150",
      option_b: "105",
      option_b_pa: "105",
      option_c: "50",
      option_c_pa: "50",
      option_d: "1500",
      option_d_pa: "1500",
      correct_answer: "A"
    },
    {
      question_text: "Which of the following is a prime number?",
      question_text_pa: "ਹੇਠ ਲਿਖਿਆਂ ਵਿੱਚੋਂ ਕਿਹੜੀ ਅਭਾਜ ਸੰਖਿਆ ਹੈ?",
      option_a: "4",
      option_a_pa: "4",
      option_b: "6",
      option_b_pa: "6",
      option_c: "7",
      option_c_pa: "7",
      option_d: "8",
      option_d_pa: "8",
      correct_answer: "C"
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const formData = new FormData();
  formData.append("file", new Blob([xlsxBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "test_quiz.xlsx");
  formData.append("chapterId", "1");
  formData.append("title", "Excel Imported Test Quiz");
  formData.append("durationMinutes", "15");

  const excelImportRes = await fetch(`${BASE_URL}/api/teacher/quizzes/upload-excel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: formData
  });
  const excelImportJson = await excelImportRes.json();
  assert(excelImportRes.status === 201 && excelImportJson.data?.questionCount === 2, "Excel spreadsheet successfully parsed and imported 2 questions");

  // -------------------------------------------------------------------------
  // SCENARIO E: Student Doubts & Inquiry Flow
  // -------------------------------------------------------------------------
  console.log("\n--- SCENARIO E: Student Doubts & Inquiries ---");

  // Student creates query
  const createQueryRes = await fetch(`${BASE_URL}/api/queries`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subjectId: 1,
      title: "Query regarding Rational Numbers representation",
      description: "Teacher ji, how can we represent -3/7 on the number line accurately?"
    })
  });
  const createQueryJson = await createQueryRes.json();
  assert(createQueryRes.status === 201 && createQueryJson.data?.queryId, "Student submits academic doubt");
  const doubtId = createQueryJson.data?.queryId;

  // Teacher responds
  const replyRes = await fetch(`${BASE_URL}/api/queries/${doubtId}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${teacherToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      responseText: "Divide each unit into 7 equal parts to the left of zero and count 3 steps."
    })
  });
  assert(replyRes.status === 201, "Teacher submits pedagogical guidance response");

  // Student reviews thread
  const threadRes = await fetch(`${BASE_URL}/api/queries/${doubtId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const threadJson = await threadRes.json();
  assert(
    threadJson.data?.responses?.length === 1 &&
    threadJson.data.responses[0].responseText.includes("Divide each unit into 7"),
    "Student retrieves query thread containing teacher's exact response"
  );

  // -------------------------------------------------------------------------
  // SCENARIO F: Admin Provisioning & Account Lifecycle
  // -------------------------------------------------------------------------
  console.log("\n--- SCENARIO F: Admin Provisioning & System Oversight ---");

  // 1. Overview stats
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const statsJson = await statsRes.json();
  assert(
    statsRes.status === 200 &&
    statsJson.data.totalStudents > 0 &&
    statsJson.data.totalTeachers > 0,
    "Admin retrieves live platform statistics from PostgreSQL"
  );

  // 2. Provision new teacher
  const testTeacherEmail = `temp.teacher.${Date.now()}@punjab.gov.in`;
  const provTeacherRes = await fetch(`${BASE_URL}/api/admin/teachers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Satnam Singh",
      email: testTeacherEmail,
      password: "Password@123",
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      qualification: "M.Sc. Mathematics"
    })
  });
  const provTeacherJson = await provTeacherRes.json();
  assert(provTeacherRes.status === 201 && provTeacherJson.data?.userId, "Admin provisions new teacher account");
  const newTeacherUserId = provTeacherJson.data?.userId;

  // Verify new teacher can log in
  const newTeacherLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testTeacherEmail, password: "Password@123" })
  });
  assert(newTeacherLogin.status === 200, "Newly provisioned teacher logs in successfully");

  // Admin deactivates new teacher
  const deactivateRes = await fetch(`${BASE_URL}/api/admin/users/${newTeacherUserId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isActive: false })
  });
  assert(deactivateRes.status === 200, "Admin deactivates teacher account");

  // Verify deactivated teacher cannot log in
  const deactLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testTeacherEmail, password: "Password@123" })
  });
  assert(deactLogin.status === 403, "Deactivated teacher login rejected with HTTP 403");

  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("FATAL TEST RUN ERROR:", err);
  process.exit(1);
});
