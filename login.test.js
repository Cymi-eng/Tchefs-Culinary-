/* ============================================================
   login.test.js — TChefs Culinary Institute
   Tests for: validateLogin (from login.js)
   Run with:  node login.test.js
   ============================================================ */

const assert = require("assert");

/* ── Mock localStorage ───────────────────────────────────── */
const store = {};
global.localStorage = {
  getItem:    (key)        => store[key] ?? null,
  setItem:    (key, value) => { store[key] = value; },
  removeItem: (key)        => { delete store[key]; },
  clear:      ()           => { Object.keys(store).forEach(k => delete store[k]); },
};

/* ── Mock DOM so login.js event listeners don't crash ─────── */
global.document = {
  getElementById: () => ({ addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }),
};

const { validateLogin, getStudent } = require("./login.js");

/* ── Helpers ─────────────────────────────────────────────── */
let passed = 0, failed = 0;

function test(desc, fn) {
  try {
    fn();
    console.log(`  ✅  ${desc}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${desc}`);
    console.log(`      → ${err.message}`);
    failed++;
  }
}

function group(title) {
  console.log(`\n${title}`);
  console.log("─".repeat(title.length));
}

function reset() { localStorage.clear(); }

/* ── Seed a student directly (simulates signup.js saving) ─── */
function seedStudent(overrides = {}) {
  const student = {
    fullname: "Jane Wanjiku",
    email: "jane@tchefs.ac.ke",
    phone: "+254700000001",
    course: "Culinary Arts",
    password: "Secret99",
    ...overrides,
  };
  localStorage.setItem("student_" + student.email, JSON.stringify(student));
  return student;
}

/* ============================================================
   TESTS
   ============================================================ */

group("1. validateLogin — empty fields");

test("fails when both email and password are empty", () => {
  reset();
  const r = validateLogin("", "");
  assert.strictEqual(r.success, false);
  assert.ok(r.error.length > 0);
});

test("fails when email is empty", () => {
  reset();
  const r = validateLogin("", "Secret99");
  assert.strictEqual(r.success, false);
});

test("fails when password is empty", () => {
  reset();
  const r = validateLogin("jane@tchefs.ac.ke", "");
  assert.strictEqual(r.success, false);
});

group("2. validateLogin — account not found");

test("fails when no account exists for that email", () => {
  reset();
  const r = validateLogin("ghost@tchefs.ac.ke", "Secret99");
  assert.strictEqual(r.success, false);
  assert.ok(r.error.toLowerCase().includes("no account"));
});

test("is case-insensitive on email lookup", () => {
  reset();
  seedStudent();
  const r = validateLogin("JANE@TCHEFS.AC.KE", "Secret99");
  assert.strictEqual(r.success, true);
});

group("3. validateLogin — wrong password");

test("fails with incorrect password", () => {
  reset();
  seedStudent();
  const r = validateLogin("jane@tchefs.ac.ke", "WrongPass");
  assert.strictEqual(r.success, false);
  assert.ok(r.error.toLowerCase().includes("incorrect"));
});

test("is case-sensitive on password", () => {
  reset();
  seedStudent();
  const r = validateLogin("jane@tchefs.ac.ke", "secret99"); // lowercase s
  assert.strictEqual(r.success, false);
});

group("4. validateLogin — successful login");

test("returns success with correct credentials", () => {
  reset();
  seedStudent();
  const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
  assert.strictEqual(r.success, true);
  assert.ok(r.student);
});

test("returned student has correct fullname", () => {
  reset();
  seedStudent();
  const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
  assert.strictEqual(r.student.fullname, "Jane Wanjiku");
});

test("returned student has correct course", () => {
  reset();
  seedStudent();
  const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
  assert.strictEqual(r.student.course, "Culinary Arts");
});

group("5. validateLogin — reads signup.js accounts");

test("can read an account saved with the student_ key prefix (signup.js format)", () => {
  reset();
  // Simulate exactly what signup.js saveStudent() does
  localStorage.setItem("student_jane@tchefs.ac.ke", JSON.stringify({
    fullname: "Jane Wanjiku",
    email: "jane@tchefs.ac.ke",
    phone: "+254700000001",
    course: "Culinary Arts",
    password: "Secret99",
  }));
  const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
  assert.strictEqual(r.success, true);
});

test("getStudent returns null for unknown email", () => {
  reset();
  const result = getStudent("nobody@tchefs.ac.ke");
  assert.strictEqual(result, null);
});

/* ── Summary ─────────────────────────────────────────────── */
console.log("\n" + "═".repeat(40));
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("═".repeat(40) + "\n");
if (failed > 0) process.exit(1);