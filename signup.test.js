/* ============================================================
   signup.test.js — TChefs Culinary Institute
   Tests for: validateSignup, getPasswordStrength,
              saveStudent, getStudent (from signup.js)

   Run with:  npm test
   Requires:  npm install --save-dev jest
   ============================================================ */


/* ── MOCK localStorage ───────────────────────────────────────
   Jest runs inside Node.js which has no browser APIs.
   localStorage is one of those browser-only APIs, so we
   build a fake one backed by a plain JavaScript object
   called `store`. signup.js calls localStorage freely and
   will get our fake version instead of crashing.
   ─────────────────────────────────────────────────────────── */

const store = {};                          // plain object that holds all our fake "stored" data

global.localStorage = {                    // attach the fake to `global` so every file can see it

  getItem: (key) => store[key] ?? null,    // look up `key`; return null (not undefined) if missing

  setItem: (key, value) => {              // write `value` at `key`
    store[key] = value;                   // just assign to the plain object
  },

  removeItem: (key) => {                  // remove one key
    delete store[key];
  },

  clear: () => {                          // delete every key (called in beforeEach to reset state)
    Object.keys(store).forEach(k => delete store[k]);
  },
};


/* ── MOCK document ───────────────────────────────────────────
   signup.js calls document.getElementById() at the file's
   top level to attach password-toggle and form-submit event
   listeners. These run the moment require("./signup.js") is
   called, so we need a fake `document` already in place or
   Jest will throw "document is not defined".
   ─────────────────────────────────────────────────────────── */

global.document = {
  getElementById: () => ({               // every getElementById call returns this fake element

    addEventListener: () => {},          // ignore any addEventListener — we don't need real events

    classList: {
      remove: () => {},                  // ignore classList.remove (called by showError)
      add:    () => {},                  // ignore classList.add (called by hideError)
    },

    style: {},                           // empty style object — prevents ".style.display" from throwing

    value: "",                           // fake input.value — prevents ".value.trim()" from throwing
  }),
};


/* ── IMPORT the functions we want to test ────────────────────
   require() loads signup.js and extracts only the functions
   listed in its module.exports block at the bottom of the
   file. Everything else (DOM event listeners etc.) runs but
   is safely swallowed by our mocks above.
   ─────────────────────────────────────────────────────────── */

const {
  validateSignup,       // the main signup validation function
  getPasswordStrength,  // returns strength label, color, and width for a password string
  getStudent,           // reads a student from localStorage by email
  saveStudent,          // writes a student to localStorage
} = require("./signup.js");


/* ── RESET storage before every single test ─────────────────
   Jest's beforeEach hook runs automatically before each
   `test()` block. Clearing the store ensures that data
   written by one test can never bleed into the next.
   ─────────────────────────────────────────────────────────── */

beforeEach(() => localStorage.clear());


/* ── HELPER: payload ─────────────────────────────────────────
   Builds a complete, valid signup form object. Every test
   that needs a valid payload calls payload() and then only
   overrides the one field it cares about.
   e.g.  payload({ password: "short" })  changes only password.
   ─────────────────────────────────────────────────────────── */

function payload(overrides = {}) {         // accept optional overrides, default to none
  return {
    fullname:        "Jane Wanjiku",       // default valid fullname
    email:           "jane@tchefs.ac.ke", // default valid email
    phone:           "+254700000001",      // default valid phone
    course:          "Culinary Arts",      // default valid course
    password:        "Secret99",           // default valid password (8+ chars, uppercase, digit)
    confirmPassword: "Secret99",           // matches password by default
    ...overrides,                          // caller overrides go on top, replacing any matching key
  };
}


/* ============================================================
   GROUP 1 — validateSignup: empty / missing fields
   Every field on the signup form is required. These tests
   check that omitting any single field blocks signup.
   ============================================================ */

describe("validateSignup — missing fields", () => {

  test("fails when all fields are empty", () => {
    const r = validateSignup(payload({          // start with a valid payload then override everything to ""
      fullname: "", email: "", phone: "", course: "", password: "", confirmPassword: "",
    }));
    expect(r.success).toBe(false);             // completely empty form must fail
    expect(r.error).toBeTruthy();              // must return a non-empty error message
  });

  test("fails when fullname is missing", () => {
    const r = validateSignup(payload({ fullname: "" })); // everything valid except fullname
    expect(r.success).toBe(false);            // missing fullname → must fail
  });

  test("fails when email is missing", () => {
    const r = validateSignup(payload({ email: "" }));    // everything valid except email
    expect(r.success).toBe(false);            // missing email → must fail
  });

  test("fails when phone is missing", () => {
    const r = validateSignup(payload({ phone: "" }));    // everything valid except phone
    expect(r.success).toBe(false);            // missing phone → must fail
  });

  test("fails when course is missing", () => {
    const r = validateSignup(payload({ course: "" }));   // everything valid except course
    expect(r.success).toBe(false);            // missing course → must fail
  });

  test("fails when password is missing", () => {
    const r = validateSignup(payload({ password: "", confirmPassword: "" })); // both password fields empty
    expect(r.success).toBe(false);            // missing password → must fail
  });

  test("fails when confirmPassword is missing", () => {
    const r = validateSignup(payload({ confirmPassword: "" })); // password filled but confirm is empty
    expect(r.success).toBe(false);            // missing confirm → must fail
  });

});


/* ============================================================
   GROUP 2 — validateSignup: password rules
   signup.js enforces two password rules:
     1. At least 8 characters long
     2. Must match confirmPassword exactly
   ============================================================ */

describe("validateSignup — password rules", () => {

  test("fails when password is shorter than 8 characters", () => {
    const r = validateSignup(payload({ password: "Ab1", confirmPassword: "Ab1" })); // only 3 chars
    expect(r.success).toBe(false);            // too short → must fail
    expect(r.error).toMatch(/8 characters/i); // error message must mention 8 characters
  });

  test("fails when password is exactly 7 characters", () => {
    const r = validateSignup(payload({ password: "Short1!", confirmPassword: "Short1!" })); // 7 chars
    expect(r.success).toBe(false);            // 7 is still under the 8-char minimum → must fail
  });

  test("passes when password is exactly 8 characters", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "Secret99" })); // exactly 8
    expect(r.success).toBe(true);             // 8 chars meets the minimum → must succeed
  });

  test("fails when passwords do not match", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "Wrong999" })); // different
    expect(r.success).toBe(false);            // mismatch → must fail
    expect(r.error).toMatch(/do not match/i); // error must say "do not match"
  });

  test("is case-sensitive when comparing passwords", () => {
    const r = validateSignup(payload({ password: "Secret99", confirmPassword: "secret99" })); // capital S vs lowercase
    expect(r.success).toBe(false);            // different cases = different strings → must fail
  });

});


/* ============================================================
   GROUP 3 — validateSignup: duplicate email
   signup.js checks localStorage before saving. If an account
   with the same email already exists, registration is blocked.
   ============================================================ */

describe("validateSignup — duplicate email", () => {

  test("fails when an account with the same email already exists", () => {
    validateSignup(payload());                // first signup — should succeed and save to localStorage
    const r = validateSignup(payload());      // second signup with exact same payload
    expect(r.success).toBe(false);           // same email already exists → must fail
    expect(r.error).toMatch(/already exists/i); // error must say "already exists"
  });

  test("treats email addresses as case-insensitive for the duplicate check", () => {
    validateSignup(payload({ email: "jane@tchefs.ac.ke" }));    // register with lowercase email
    const r = validateSignup(payload({ email: "JANE@TCHEFS.AC.KE" })); // try to register again in uppercase
    expect(r.success).toBe(false);           // same email, different case — must be caught as duplicate
  });

  test("allows a second account with a completely different email", () => {
    validateSignup(payload({ email: "jane@tchefs.ac.ke" }));    // register jane
    const r = validateSignup(payload({ email: "john@tchefs.ac.ke" })); // register john (different email)
    expect(r.success).toBe(true);            // different email → a brand new account → must succeed
  });

});


/* ============================================================
   GROUP 4 — validateSignup: successful signup
   These tests verify the shape and content of the object
   returned when all validation passes.
   ============================================================ */

describe("validateSignup — successful signup", () => {

  test("returns success: true with fully valid data", () => {
    const r = validateSignup(payload());      // submit a completely valid form
    expect(r.success).toBe(true);            // must succeed
  });

  test("returned student has the correct fullname", () => {
    const r = validateSignup(payload());      // valid signup
    expect(r.student.fullname).toBe("Jane Wanjiku"); // fullname must match what was submitted
  });

  test("returned student has the correct course", () => {
    const r = validateSignup(payload());
    expect(r.student.course).toBe("Culinary Arts"); // course must match
  });

  test("returned student email is stored in lowercase", () => {
    const r = validateSignup(payload({ email: "JANE@TCHEFS.AC.KE" })); // submit uppercase email
    expect(r.student.email).toBe("jane@tchefs.ac.ke"); // must be lowercased before saving
  });

  test("returned student has the correct phone", () => {
    const r = validateSignup(payload());
    expect(r.student.phone).toBe("+254700000001"); // phone must be stored unchanged
  });

  test("does NOT include confirmPassword in the saved student object", () => {
    const r = validateSignup(payload());      // valid signup
    expect(r.student).not.toHaveProperty("confirmPassword"); // confirmPassword is only for validation — never saved
  });

});


/* ============================================================
   GROUP 5 — saveStudent & getStudent: storage layer
   These are the two low-level localStorage helpers.
   We test them directly (not via validateSignup) so we can
   be sure the storage contract is solid on its own.
   ============================================================ */

describe("saveStudent & getStudent — storage layer", () => {

  test("getStudent returns null when no account exists", () => {
    // nothing has been written to storage yet
    expect(getStudent("nobody@tchefs.ac.ke")).toBeNull(); // must return null, not undefined
  });

  test("saveStudent persists a student so getStudent can read it back", () => {
    const student = {                         // build a student object manually
      fullname: "Jane Wanjiku",
      email:    "jane@tchefs.ac.ke",
      phone:    "+254700000001",
      course:   "Culinary Arts",
      password: "Secret99",
    };
    saveStudent(student);                     // write it to localStorage
    expect(getStudent("jane@tchefs.ac.ke")).toEqual(student); // read it back — must deeply equal original
  });

  test("getStudent is case-insensitive on email lookup", () => {
    const student = {
      fullname: "Jane Wanjiku",
      email:    "jane@tchefs.ac.ke",          // saved with lowercase email
      phone:    "+254700000001",
      course:   "Culinary Arts",
      password: "Secret99",
    };
    saveStudent(student);                     // save under lowercase key
    expect(getStudent("JANE@TCHEFS.AC.KE")).toEqual(student); // uppercase lookup must still find it
  });

  test("validateSignup saves the student so getStudent can read it back", () => {
    validateSignup(payload());                // run the full signup flow
    const saved = getStudent("jane@tchefs.ac.ke"); // try to retrieve the account that was just created
    expect(saved).not.toBeNull();             // something must have been saved
    expect(saved.fullname).toBe("Jane Wanjiku"); // and it must have the right name
  });

  test("account saved by validateSignup uses the student_<email> key (login.js format)", () => {
    validateSignup(payload());                // register jane through the full signup flow
    const raw = localStorage.getItem("student_jane@tchefs.ac.ke"); // read the raw key directly
    expect(raw).not.toBeNull();              // the key must exist — both signup.js and login.js use this format
    const parsed = JSON.parse(raw);          // deserialise the JSON string back to an object
    expect(parsed.email).toBe("jane@tchefs.ac.ke"); // the stored email must be lowercase
  });

});


/* ============================================================
   GROUP 6 — getPasswordStrength
   getPasswordStrength scores a password on four criteria:
     1. At least 8 characters  → +1
     2. Contains uppercase     → +1
     3. Contains a digit       → +1
     4. Contains a symbol      → +1
   Score maps to: 0 = (empty), 1 = Weak, 2 = Fair,
                  3 = Good,    4 = Strong
   ============================================================ */

describe("getPasswordStrength", () => {

  test("returns 0% width for an empty string", () => {
    expect(getPasswordStrength("").width).toBe("0%"); // no password at all → 0% bar width
  });

  test("returns Weak (25%) for a short lowercase-only password", () => {
    const r = getPasswordStrength("abcdefgh");  // meets only criterion 1 (length ≥ 8)
    expect(r.label).toBe("Weak");               // score 1 → Weak
    expect(r.width).toBe("25%");                // 1 out of 4 criteria = 25%
  });

  test("returns Fair (50%) for length + one uppercase letter", () => {
    const r = getPasswordStrength("Abcdefgh");  // meets criteria 1 (length) and 2 (uppercase)
    expect(r.label).toBe("Fair");               // score 2 → Fair
    expect(r.width).toBe("50%");                // 2 out of 4 = 50%
  });

  test("returns Good (75%) for length + uppercase + digit", () => {
    const r = getPasswordStrength("Abcdefg1");  // meets criteria 1, 2, and 3 (digit)
    expect(r.label).toBe("Good");               // score 3 → Good
    expect(r.width).toBe("75%");                // 3 out of 4 = 75%
  });

  test("returns Strong (100%) for length + uppercase + digit + special character", () => {
    const r = getPasswordStrength("Abcdefg1!"); // meets all four criteria (! is a special char)
    expect(r.label).toBe("Strong");             // score 4 → Strong
    expect(r.width).toBe("100%");               // 4 out of 4 = 100%
  });

  test("returns a truthy color string for every non-empty level", () => {
    const passwords = [
      "abcdefgh",   // Weak
      "Abcdefgh",   // Fair
      "Abcdefg1",   // Good
      "Abcdefg1!",  // Strong
    ];
    passwords.forEach(pw => {
      expect(getPasswordStrength(pw).color).toBeTruthy(); // every level must have a color value
    });
  });

  test("Strong password uses green color (#22c55e)", () => {
    expect(getPasswordStrength("Abcdefg1!").color).toBe("#22c55e"); // green signals a secure password
  });

  test("Weak password uses red color (#E31B23)", () => {
    expect(getPasswordStrength("abcdefgh").color).toBe("#E31B23"); // red signals a very weak password
  });

});