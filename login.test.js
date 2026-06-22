/* ============================================================
   login.test.js — TChefs Culinary Institute
   Tests for: validateLogin, getStudent, setSession (from login.js)

   Run with:  npm test
   Requires:  npm install --save-dev jest
   ============================================================ */

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
  getElementById: () => ({
    addEventListener: () => {},
    classList: { remove: () => {}, add: () => {} },
    style: {},
    value: "",
  }),
};

const { validateLogin, getStudent, setSession } = require("./login.js");

/* ── Reset storage between every test ───────────────────────*/
beforeEach(() => localStorage.clear());

/* ── Helper: seed a student the same way signup.js does ───── */
function seedStudent(overrides = {}) {
  const student = {
    fullname: "Jane Wanjiku",
    email:    "jane@tchefs.ac.ke",
    phone:    "+254700000001",
    course:   "Culinary Arts",
    password: "Secret99",
    ...overrides,
  };
  localStorage.setItem("student_" + student.email, JSON.stringify(student));
  return student;
}

/* ============================================================
   1. validateLogin — empty / missing fields
   ============================================================ */
describe("validateLogin — missing fields", () => {

  test("fails when both email and password are empty", () => {
    const r = validateLogin("", "");
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test("fails when email is empty but password is provided", () => {
    const r = validateLogin("", "Secret99");
    expect(r.success).toBe(false);
  });

  test("fails when password is empty but email is provided", () => {
    const r = validateLogin("jane@tchefs.ac.ke", "");
    expect(r.success).toBe(false);
  });

  test("error message asks for both email and password", () => {
    const r = validateLogin("", "");
    expect(r.error).toMatch(/email and password/i);
  });

});

/* ============================================================
   2. validateLogin — account not found
   ============================================================ */
describe("validateLogin — account not found", () => {

  test("fails when no account exists for that email", () => {
    const r = validateLogin("ghost@tchefs.ac.ke", "Secret99");
    expect(r.success).toBe(false);
  });

  test("error message mentions no account found", () => {
    const r = validateLogin("ghost@tchefs.ac.ke", "Secret99");
    expect(r.error).toMatch(/no account/i);
  });

  test("fails after storage is cleared even if account existed before", () => {
    seedStudent();
    localStorage.clear();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.success).toBe(false);
  });

});

/* ============================================================
   3. validateLogin — wrong password
   ============================================================ */
describe("validateLogin — wrong password", () => {

  test("fails with an incorrect password", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "WrongPass");
    expect(r.success).toBe(false);
  });

  test("error message says incorrect password", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "WrongPass");
    expect(r.error).toMatch(/incorrect/i);
  });

  test("is case-sensitive on password (lowercase first letter fails)", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "secret99");
    expect(r.success).toBe(false);
  });

  test("is case-sensitive on password (all caps fails)", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "SECRET99");
    expect(r.success).toBe(false);
  });

  test("fails when password has a trailing space", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99 ");
    expect(r.success).toBe(false);
  });

});

/* ============================================================
   4. validateLogin — email case-insensitivity
   ============================================================ */
describe("validateLogin — email case-insensitivity", () => {

  test("succeeds with email in all uppercase", () => {
    seedStudent();
    const r = validateLogin("JANE@TCHEFS.AC.KE", "Secret99");
    expect(r.success).toBe(true);
  });

  test("succeeds with email in mixed case", () => {
    seedStudent();
    const r = validateLogin("Jane@Tchefs.Ac.Ke", "Secret99");
    expect(r.success).toBe(true);
  });

  test("succeeds with email that has leading/trailing whitespace", () => {
    seedStudent();
    const r = validateLogin("  jane@tchefs.ac.ke  ", "Secret99");
    expect(r.success).toBe(true);
  });

});

/* ============================================================
   5. validateLogin — successful login
   ============================================================ */
describe("validateLogin — successful login", () => {

  test("returns success: true with correct credentials", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.success).toBe(true);
  });

  test("returned result has no error on success", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.error).toBeUndefined();
  });

  test("returned student has the correct fullname", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.fullname).toBe("Jane Wanjiku");
  });

  test("returned student has the correct email", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.email).toBe("jane@tchefs.ac.ke");
  });

  test("returned student has the correct course", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.course).toBe("Culinary Arts");
  });

  test("returned student has the correct phone", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.phone).toBe("+254700000001");
  });

});

/* ============================================================
   6. validateLogin — reads signup.js account format
   ============================================================ */
describe("validateLogin — reads signup.js account format", () => {

  test("reads an account saved with the student_<email> key prefix", () => {
    localStorage.setItem("student_jane@tchefs.ac.ke", JSON.stringify({
      fullname: "Jane Wanjiku",
      email:    "jane@tchefs.ac.ke",
      phone:    "+254700000001",
      course:   "Culinary Arts",
      password: "Secret99",
    }));
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.success).toBe(true);
  });

  test("two different accounts can coexist in storage", () => {
    seedStudent({ email: "jane@tchefs.ac.ke", password: "Secret99" });
    seedStudent({ email: "john@tchefs.ac.ke", password: "Password1" });

    expect(validateLogin("jane@tchefs.ac.ke", "Secret99").success).toBe(true);
    expect(validateLogin("john@tchefs.ac.ke", "Password1").success).toBe(true);
  });

  test("jane's password does not unlock john's account", () => {
    seedStudent({ email: "jane@tchefs.ac.ke", password: "Secret99" });
    seedStudent({ email: "john@tchefs.ac.ke", password: "Password1" });

    const r = validateLogin("john@tchefs.ac.ke", "Secret99");
    expect(r.success).toBe(false);
  });

});

/* ============================================================
   7. getStudent — storage helper
   ============================================================ */
describe("getStudent", () => {

  test("returns null for an unknown email", () => {
    expect(getStudent("nobody@tchefs.ac.ke")).toBeNull();
  });

  test("returns the student object for a known email", () => {
    const student = seedStudent();
    expect(getStudent("jane@tchefs.ac.ke")).toEqual(student);
  });

  test("is case-insensitive on email lookup", () => {
    const student = seedStudent();
    expect(getStudent("JANE@TCHEFS.AC.KE")).toEqual(student);
  });

  test("trims whitespace from email before lookup", () => {
    const student = seedStudent();
    expect(getStudent("  jane@tchefs.ac.ke  ")).toEqual(student);
  });

  test("returns null after storage is cleared", () => {
    seedStudent();
    localStorage.clear();
    expect(getStudent("jane@tchefs.ac.ke")).toBeNull();
  });

});

/* ============================================================
   8. setSession
   ============================================================ */
describe("setSession", () => {

  test("saves the student under the tchefs_session key", () => {
    const student = seedStudent();
    setSession(student);
    const raw = localStorage.getItem("tchefs_session");
    expect(raw).not.toBeNull();
  });

  test("stored session can be parsed back to the original student", () => {
    const student = seedStudent();
    setSession(student);
    const parsed = JSON.parse(localStorage.getItem("tchefs_session"));
    expect(parsed).toEqual(student);
  });

  test("overwrites an existing session with the new student", () => {
    const jane = seedStudent({ email: "jane@tchefs.ac.ke" });
    const john = seedStudent({ email: "john@tchefs.ac.ke", fullname: "John Kamau" });

    setSession(jane);
    setSession(john);

    const parsed = JSON.parse(localStorage.getItem("tchefs_session"));
    expect(parsed.fullname).toBe("John Kamau");
  });

  test("session set by setSession is readable after validateLogin succeeds", () => {
    const student = seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    setSession(r.student);

    const session = JSON.parse(localStorage.getItem("tchefs_session"));
    expect(session.email).toBe("jane@tchefs.ac.ke");
  });

});