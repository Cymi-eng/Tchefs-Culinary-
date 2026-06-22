/* ============================================================
   signup.test.js — TChefs Culinary Institute
   Tests for: validateSignup, getPasswordStrength (from signup.js)

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

/* ── Mock DOM so signup.js event listeners don't crash ─────── */
global.document = {
  getElementById: () => ({
    addEventListener: () => {},
    classList: { remove: () => {}, add: () => {} },
    style: {},
    value: "",
  }),
};

const { validateSignup, getPasswordStrength, getStudent, saveStudent } = require("./signup.js");

/* ── Reset storage between tests ─────────────────────────── */
beforeEach(() => localStorage.clear());

/* ── Helper: build a valid payload (override any field) ───── */
function payload(overrides = {}) {
  return {
    fullname:        "Jane Wanjiku",
    email:           "jane@tchefs.ac.ke",
    phone:           "+254700000001",
    course:          "Culinary Arts",
    password:        "Secret99",
    confirmPassword: "Secret99",
    ...overrides,
  };
}

/* ============================================================
   1. validateSignup — empty / missing fields
   ============================================================ */
describe("validateSignup — missing fields", () => {

  test("fails when all fields are empty", () => {
    const r = validateSignup(payload({
      fullname: "", email: "", phone: "", course: "", password: "", confirmPassword: "",
    }));
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test("fails when fullname is missing", () => {
    const r = validateSignup(payload({ fullname: "" }));
    expect(r.success).toBe(false);
  });

  test("fails when email is missing", () => {
    const r = validateSignup(payload({ email: "" }));
    expect(r.success).toBe(false);
  });

  test("fails when phone is missing", () => {
    const r = validateSignup(payload({ phone: "" }));
    expect(r.success).toBe(false);
  });

  test("fails when course is missing", () => {
    const r = validateSignup(payload({ course: "" }));
    expect(r.success).toBe(false);
  });

  test("fails when password is missing", () => {
    const r = validateSignup(payload({ password: "", confirmPassword: "" }));
    expect(r.success).toBe(false);
  });

  test("fails when confirmPassword is missing", () => {
    const r = validateSignup(payload({ confirmPassword: "" }));
    expect(r.success).toBe(false);
  });

});

/* ============================================================
   2. validateSignup — password rules
   ============================================================ */
describe("validateSignup — password rules", () => {

  test("fails when password is shorter than 8 characters", () => {
    const r = validateSignup(payload({ password: "Ab1", confirmPassword: "Ab1" }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/8 characters/i);
  });

  test("fails when password is exactly 7 characters", () => {
    const r = validateSignup(payload({ password: "Short1!", confirmPassword: "Short1!" }));
    expect(r.success).toBe(false);
  });

  test("passes when password is exactly 8 characters", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "Secret99" }));
    expect(r.success).toBe(true);
  });

  test("fails when passwords do not match", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "Wrong999" }));
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/do not match/i);
  });

  test("is case-sensitive when comparing passwords", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "secret99" }));
    expect(r.success).toBe(false);
  });

});

/* ============================================================
   3. validateSignup — duplicate email
   ============================================================ */
describe("validateSignup — duplicate email", () => {

  test("fails when an account with the same email already exists", () => {
    validateSignup(payload()); // first registration
    const r = validateSignup(payload()); // duplicate
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/already exists/i);
  });

  test("treats email addresses as case-insensitive (duplicate check)", () => {
    validateSignup(payload({ email: "jane@tchefs.ac.ke" }));
    const r = validateSignup(payload({ email: "JANE@TCHEFS.AC.KE" }));
    expect(r.success).toBe(false);
  });

  test("allows a second account with a different email", () => {
    validateSignup(payload({ email: "jane@tchefs.ac.ke" }));
    const r = validateSignup(payload({ email: "john@tchefs.ac.ke" }));
    expect(r.success).toBe(true);
  });

});

/* ============================================================
   4. validateSignup — successful signup
   ============================================================ */
describe("validateSignup — successful signup", () => {

  test("returns success: true with valid data", () => {
    const r = validateSignup(payload());
    expect(r.success).toBe(true);
  });

  test("returned student has the correct fullname", () => {
    const r = validateSignup(payload());
    expect(r.student.fullname).toBe("Jane Wanjiku");
  });

  test("returned student has the correct course", () => {
    const r = validateSignup(payload());
    expect(r.student.course).toBe("Culinary Arts");
  });

  test("returned student email is stored in lowercase", () => {
    const r = validateSignup(payload({ email: "JANE@TCHEFS.AC.KE" }));
    expect(r.student.email).toBe("jane@tchefs.ac.ke");
  });

  test("returned student has the correct phone", () => {
    const r = validateSignup(payload());
    expect(r.student.phone).toBe("+254700000001");
  });

  test("does NOT include confirmPassword in the saved student object", () => {
    const r = validateSignup(payload());
    expect(r.student).not.toHaveProperty("confirmPassword");
  });

});

/* ============================================================
   5. saveStudent / getStudent — storage layer
   ============================================================ */
describe("saveStudent & getStudent — storage layer", () => {

  test("getStudent returns null when no account exists", () => {
    expect(getStudent("nobody@tchefs.ac.ke")).toBeNull();
  });

  test("saveStudent persists a student under the correct key", () => {
    const student = { fullname: "Jane Wanjiku", email: "jane@tchefs.ac.ke", phone: "+254700000001", course: "Culinary Arts", password: "Secret99" };
    saveStudent(student);
    expect(getStudent("jane@tchefs.ac.ke")).toEqual(student);
  });

  test("getStudent is case-insensitive on email lookup", () => {
    const student = { fullname: "Jane Wanjiku", email: "jane@tchefs.ac.ke", phone: "+254700000001", course: "Culinary Arts", password: "Secret99" };
    saveStudent(student);
    expect(getStudent("JANE@TCHEFS.AC.KE")).toEqual(student);
  });

  test("validateSignup saves the student so getStudent can read it back", () => {
    validateSignup(payload());
    const saved = getStudent("jane@tchefs.ac.ke");
    expect(saved).not.toBeNull();
    expect(saved.fullname).toBe("Jane Wanjiku");
  });

  test("validateSignup saved account is readable by login.js key format (student_<email>)", () => {
    validateSignup(payload());
    const raw = localStorage.getItem("student_jane@tchefs.ac.ke");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.email).toBe("jane@tchefs.ac.ke");
  });

});

/* ============================================================
   6. getPasswordStrength
   ============================================================ */
describe("getPasswordStrength", () => {

  test("returns 0% width for an empty string", () => {
    expect(getPasswordStrength("").width).toBe("0%");
  });

  test("returns Weak (25%) for a short lowercase-only password", () => {
    const r = getPasswordStrength("abcdefgh");
    expect(r.label).toBe("Weak");
    expect(r.width).toBe("25%");
  });

  test("returns Fair (50%) for length + uppercase", () => {
    const r = getPasswordStrength("Abcdefgh");
    expect(r.label).toBe("Fair");
    expect(r.width).toBe("50%");
  });

  test("returns Good (75%) for length + uppercase + digit", () => {
    const r = getPasswordStrength("Abcdefg1");
    expect(r.label).toBe("Good");
    expect(r.width).toBe("75%");
  });

  test("returns Strong (100%) for length + uppercase + digit + special char", () => {
    const r = getPasswordStrength("Abcdefg1!");
    expect(r.label).toBe("Strong");
    expect(r.width).toBe("100%");
  });

  test("returns a color string for each non-empty level", () => {
    ["abcdefgh", "Abcdefgh", "Abcdefg1", "Abcdefg1!"].forEach(pw => {
      expect(getPasswordStrength(pw).color).toBeTruthy();
    });
  });

  test("strong password has green color (#22c55e)", () => {
    expect(getPasswordStrength("Abcdefg1!").color).toBe("#22c55e");
  });

  test("weak password has red color (#E31B23)", () => {
    expect(getPasswordStrength("abcdefgh").color).toBe("#E31B23");
  });

});