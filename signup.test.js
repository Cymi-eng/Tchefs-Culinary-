/* ============================================================
   signup.test.js — TChefs Culinary Institute
   Tests for: validateSignup, getPasswordStrength (signup.js)
   Run with:  node signup.test.js
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

/* ── Mock DOM so signup.js event listeners don't crash ────── */
global.document = {
  getElementById: () => ({ addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }),
};

const { validateSignup, getPasswordStrength, getStudent } = require("./signup.js");

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

const validData = () => ({
  fullname:        "Jane Wanjiku",
  email:           "jane@tchefs.ac.ke",
  phone:           "+254700000001",
  course:          "Culinary Arts",
  password:        "Secret99",
  confirmPassword: "Secret99",
});

/* ============================================================
   TESTS
   ============================================================ */

group("1. validateSignup — missing fields");

test("fails when fullname is empty", () => {
  reset();
  const r = validateSignup({ ...validData(), fullname: "" });
  assert.strictEqual(r.success, false);
  assert.ok(r.error.toLowerCase().includes("fill in all fields"));
});

test("fails when email is empty", () => {
  reset();
  const r = validateSignup({ ...validData(), email: "" });
  assert.strictEqual(r.success, false);
});

test("fails when phone is empty", () => {
  reset();
  const r = validateSignup({ ...validData(), phone: "" });
  assert.strictEqual(r.success, false);
});

test("fails when course is empty", () => {
  reset();
  const r = validateSignup({ ...validData(), course: "" });
  assert.strictEqual(r.success, false);
});

test("fails when password is empty", () => {
  reset();
  const r = validateSignup({ ...validData(), password: "", confirmPassword: "" });
  assert.strictEqual(r.success, false);
});

group("2. validateSignup — password rules");

test("fails when password is under 8 characters", () => {
  reset();
  const r = validateSignup({ ...validData(), password: "abc", confirmPassword: "abc" });
  assert.strictEqual(r.success, false);
  assert.ok(r.error.includes("8 characters"));
});

test("fails when passwords do not match", () => {
  reset();
  const r = validateSignup({ ...validData(), confirmPassword: "Different1" });
  assert.strictEqual(r.success, false);
  assert.ok(r.error.toLowerCase().includes("match"));
});

test("passes when password is exactly 8 characters", () => {
  reset();
  const r = validateSignup({ ...validData(), password: "Abcdef1!", confirmPassword: "Abcdef1!" });
  assert.strictEqual(r.success, true);
});

group("3. validateSignup — duplicate accounts");

test("fails when email is already registered", () => {
  reset();
  validateSignup(validData());
  const r = validateSignup(validData());
  assert.strictEqual(r.success, false);
  assert.ok(r.error.toLowerCase().includes("already exists"));
});

test("treats email as case-insensitive (JANE@ == jane@)", () => {
  reset();
  validateSignup(validData());
  const r = validateSignup({ ...validData(), email: "JANE@TCHEFS.AC.KE" });
  assert.strictEqual(r.success, false);
});

group("4. validateSignup — successful registration");

test("returns success: true with valid data", () => {
  reset();
  const r = validateSignup(validData());
  assert.strictEqual(r.success, true);
});

test("returned student has normalised lowercase email", () => {
  reset();
  const r = validateSignup({ ...validData(), email: "JANE@TCHEFS.AC.KE" });
  assert.strictEqual(r.student.email, "jane@tchefs.ac.ke");
});

test("saved student is retrievable by getStudent()", () => {
  reset();
  validateSignup(validData());
  const student = getStudent("jane@tchefs.ac.ke");
  assert.ok(student);
  assert.strictEqual(student.fullname, "Jane Wanjiku");
});

test("saves with student_ prefix so login.js can read it", () => {
  reset();
  validateSignup(validData());
  const raw = localStorage.getItem("student_jane@tchefs.ac.ke");
  assert.ok(raw, "Key student_jane@tchefs.ac.ke should exist in localStorage");
});

group("5. getPasswordStrength");

test("empty password returns score 0 (empty label)", () => {
  const r = getPasswordStrength("");
  assert.strictEqual(r.label, "");
  assert.strictEqual(r.width, "0%");
});

test("short password under 8 chars returns score 0", () => {
  const r = getPasswordStrength("abc");
  assert.strictEqual(r.label, "");
});

test("8+ lowercase-only returns Weak (score 1)", () => {
  const r = getPasswordStrength("abcdefgh");
  assert.strictEqual(r.label, "Weak");
});

test("8+ chars + uppercase returns Fair (score 2)", () => {
  const r = getPasswordStrength("Abcdefgh");
  assert.strictEqual(r.label, "Fair");
});

test("8+ chars + uppercase + number returns Good (score 3)", () => {
  const r = getPasswordStrength("Abcdefg1");
  assert.strictEqual(r.label, "Good");
});

test("8+ chars + uppercase + number + symbol returns Strong (score 4)", () => {
  const r = getPasswordStrength("Abcdef1!");
  assert.strictEqual(r.label, "Strong");
});

group("6. Cross-file: signup saves, login can read");

test("account saved by signup.js is readable with login.js key format", () => {
  reset();
  validateSignup(validData());
  // Simulate what login.js getStudent() does
  const raw = localStorage.getItem("student_jane@tchefs.ac.ke");
  const student = raw ? JSON.parse(raw) : null;
  assert.ok(student, "login.js should be able to read the account");
  assert.strictEqual(student.password, "Secret99");
});

/* ── Summary ─────────────────────────────────────────────── */
console.log("\n" + "═".repeat(40));
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log("═".repeat(40) + "\n");
if (failed > 0) process.exit(1);