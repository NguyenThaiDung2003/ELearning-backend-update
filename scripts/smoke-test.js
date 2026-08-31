/**
 * Kiem tra end-to-end luong dau gio: mo bai -> lam bai -> auto-save -> nop ->
 * cham tu dong -> auto-submit khi dong bai -> bang diem -> CSV -> bai thuc hanh.
 *
 * Chay: npm run smoke (seed lai du lieu demo roi goi file nay)
 * Yeu cau server dang chay o http://localhost:5000
 */
const BASE = "http://localhost:5000/api";

const log = (label, value) => console.log(`  ${label}:`, value);
const fail = (message) => {
  console.error("FAIL:", message);
  process.exit(1);
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json };
};

const login = async (email) => {
  const res = await call("POST", "/auth/login", { body: { email, password: "123456" } });
  if (res.status !== 200) fail(`login ${email} -> ${res.status} ${JSON.stringify(res.json)}`);
  return res.json.data.accessToken;
};

const main = async () => {
  console.log("1. Dang nhap");
  const gv = await login("gv.web@elearning.local");
  const sv1 = await login("sv01@elearning.local");
  const sv2 = await login("sv02@elearning.local");
  log("ok", "gv + sv01 + sv02");

  console.log("2. GV xem lop va buoi hoc");
  const classes = await call("GET", "/classes", { token: gv });
  const classRoom = classes.json.data[0];
  log("lop", `${classRoom.title} (${classRoom._count.members} SV)`);

  const detail = await call("GET", `/classes/${classRoom.id}`, { token: gv });
  const session3 = detail.json.data.sessions.at(-1);
  log("buoi", session3.title);

  const assignments = await call("GET", `/sessions/${session3.id}/assignments`, { token: gv });
  const quiz = assignments.json.data.find((item) => item.type === "QUIZ");
  const practical = assignments.json.data.find((item) => item.type === "PRACTICAL");
  log("quiz", `${quiz.title} [${quiz.status}]`);

  console.log("3. GV hen gio va mo bai quiz");
  const now = new Date();
  const closeAt = new Date(now.getTime() + 10 * 60 * 1000);
  await call("PUT", `/assignments/${quiz.id}`, {
    token: gv,
    body: { openAt: now.toISOString(), closeAt: closeAt.toISOString(), durationMinutes: 10 },
  });
  const opened = await call("POST", `/assignments/${quiz.id}/open`, { token: gv });
  if (opened.json.data.status !== "OPEN") fail("khong mo duoc bai");
  log("status", opened.json.data.status);

  console.log("4. SV thay bai dang mo");
  const open = await call("GET", "/assignments/open", { token: sv1 });
  if (!open.json.data.some((item) => item.id === quiz.id)) fail("SV khong thay bai dang mo");
  log("so bai dang mo", open.json.data.length);

  console.log("5. SV01 bat dau lam bai");
  const started = await call("POST", `/assignments/${quiz.id}/start`, { token: sv1 });
  if (started.status !== 201) fail(`start -> ${JSON.stringify(started.json)}`);
  const attempt = started.json.data;
  const questions = attempt.questions;
  if (questions.some((q) => "correctAnswer" in q)) fail("LO DAP AN cho sinh vien!");
  log("so cau", questions.length);
  log("expiresAt", attempt.submission.expiresAt);

  console.log("6. Auto-save dap an (dung 4/5)");
  // Cau hoi duoc tron theo tung sinh vien nen phai tra cuu theo truong order,
  // khong duoc dua vao vi tri trong mang tra ve.
  const correctByOrder = { 1: 1, 2: 2, 3: 1, 4: 1, 5: 1 };
  const answers = {};
  questions.forEach((question) => {
    // Co tinh chon sai cau cuoi de ket qua ky vong la 4/5.
    answers[question.id] = question.order === 5 ? 0 : correctByOrder[question.order];
  });
  const saved = await call("PATCH", `/submissions/${attempt.submission.id}/answers`, {
    token: sv1,
    body: { answers },
  });
  if (saved.status !== 200) fail(`autosave -> ${JSON.stringify(saved.json)}`);
  log("da luu", Object.keys(saved.json.data.answers).length + " cau");

  console.log("7. SV01 nop bai -> cham tu dong");
  const submitted = await call("POST", `/submissions/${attempt.submission.id}/submit`, {
    token: sv1,
  });
  const result = submitted.json.data;
  log("status", result.status);
  log("diem", `${result.score}/${result.assignment.maxScore} (${result.correctCount}/${result.totalQuestions} cau dung)`);
  if (result.score !== 8) fail(`ky vong 8 diem, nhan ${result.score}`);

  console.log("8. SV01 khong the nop lai");
  const again = await call("POST", `/assignments/${quiz.id}/start`, { token: sv1 });
  if (again.status !== 409) fail(`ky vong 409, nhan ${again.status}`);
  log("chan nop lai", `${again.status} ${again.json.message}`);

  console.log("9. SV02 dang lam do -> GV dong bai -> auto submit");
  const attempt2 = await call("POST", `/assignments/${quiz.id}/start`, { token: sv2 });
  const sub2 = attempt2.json.data.submission.id;
  await call("PATCH", `/submissions/${sub2}/answers`, {
    token: sv2,
    body: { answers: { [attempt2.json.data.questions[0].id]: 1 } },
  });
  await call("POST", `/assignments/${quiz.id}/close`, { token: gv });
  const closed = await call("GET", `/submissions/${sub2}`, { token: sv2 });
  log("SV02", `${closed.json.data.status} - ${closed.json.data.score} diem`);
  if (closed.json.data.status !== "AUTO_SUBMITTED") fail("khong auto-submit khi dong bai");

  console.log("10. GV xem bang diem + export CSV");
  const board = await call("GET", `/assignments/${quiz.id}/submissions`, { token: gv });
  const { rows, summary } = board.json.data;
  log("so dong", rows.length);
  log("tong ket", JSON.stringify(summary));
  if (rows.length !== 10) fail(`ky vong 10 dong, nhan ${rows.length}`);

  const csv = await fetch(`${BASE}/assignments/${quiz.id}/submissions/export`, {
    headers: { Authorization: `Bearer ${gv}` },
  });
  const csvText = await csv.text();
  log("csv", `${csvText.split("\r\n").length} dong, ${csvText.length} bytes`);

  console.log("11. SV khong duoc xem bang diem cua lop");
  const denied = await call("GET", `/assignments/${quiz.id}/submissions`, { token: sv1 });
  if (denied.status !== 403) fail(`ky vong 403, nhan ${denied.status}`);
  log("chan SV", `${denied.status} ${denied.json.message}`);

  console.log("12. Bai thuc hanh: SV nop link -> GV cham");
  await call("PUT", `/assignments/${practical.id}`, {
    token: gv,
    body: { openAt: new Date().toISOString(), closeAt: new Date(Date.now() + 864e5).toISOString() },
  });
  const practicalSubmit = await call("POST", `/assignments/${practical.id}/submit-practical`, {
    token: sv1,
    body: { submitLink: "https://github.com/sv01/bai-thuc-hanh" },
  });
  if (practicalSubmit.status !== 201) fail(`nop practical -> ${JSON.stringify(practicalSubmit.json)}`);
  log("da nop", practicalSubmit.json.data.submitLink);

  const pending = await call("GET", "/submissions/pending-grading", { token: gv });
  log("cho cham", pending.json.data.length);
  if (pending.json.data.length !== 1) fail("danh sach cho cham sai");

  const graded = await call("PATCH", `/submissions/${practicalSubmit.json.data.id}/grade`, {
    token: gv,
    body: { score: 9, feedback: "Lam tot, con thieu validate input" },
  });
  log("da cham", `${graded.json.data.score} diem - ${graded.json.data.status}`);
  if (graded.json.data.status !== "GRADED") fail("cham bai that bai");

  console.log("13. GV gan record link cho buoi hoc");
  const record = await call("PUT", `/sessions/${session3.id}`, {
    token: gv,
    body: { recordLink: "https://zoom.us/rec/buoi-3" },
  });
  log("record", record.json.data.recordLink);

  console.log("\nSMOKE TEST PASSED");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
