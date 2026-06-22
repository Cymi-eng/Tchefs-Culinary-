/* ============================================================
   login.test.js — TChefs Culinary Institute
   Tests for: validateLogin, getStudent, setSession
   from login.js

   Run with:  npm test
   Requires:  npm install --save-dev jest
   ============================================================ */


/* ── MOCK localStorage ───────────────────────────────────────
   Jest runs in Node.js which has no browser APIs like
   localStorage. We create a fake version using a plain
   JavaScript object called `store` so login.js can call
   localStorage.getItem / setItem without crashing.
   ─────────────────────────────────────────────────────────── */

const store = {};                          // plain object acts as our in-memory "database"

global.localStorage = {                    // attach our fake localStorage to the global scope so login.js can find it

  getItem: (key) => store[key] ?? null,    // return the value for `key`, or null if it doesn't exist

  setItem: (key, value) => {              // save `value` under `key`
    store[key] = value;                   // store it in our plain object
  },

  removeItem: (key) => {                  // delete a single key from the store
    delete store[key];
  },

  clear: () => {                          // wipe every key in the store (used in beforeEach)
    Object.keys(store).forEach(k => delete store[k]);
  },
};


/* ── MOCK document ───────────────────────────────────────────
   login.js calls document.getElementById() at the top level
   to attach event listeners (e.g. the form submit, password
   toggle). Those calls run the moment the file is require()'d,
   so we must have a fake `document` ready or Jest will throw
   "document is not defined".
   ─────────────────────────────────────────────────────────── */

global.document = {
  getElementById: () => ({               // return a fake DOM element for every getElementById call

    addEventListener: () => {},          // swallow any addEventListener calls — we don't need real events in tests

    classList: {
      remove: () => {},                  // swallow classList.remove (used by showError)
      add:    () => {},                  // swallow classList.add (used by hideError)
    },

    style: {},                           // empty style object so .style.display = "none" doesn't throw

    value: "",                           // fake input.value so .value.trim() doesn't throw
  }),
};


/* ── IMPORT the functions we want to test ────────────────────
   require() loads login.js and pulls out the three exported
   functions. The module.exports block at the bottom of
   login.js makes this work.
   ─────────────────────────────────────────────────────────── */

const { validateLogin, getStudent, setSession } = require("./login.js");


/* ── RESET storage before every single test ─────────────────
   beforeEach is a Jest hook that runs automatically before
   each `test()` block. Clearing localStorage means tests
   never accidentally share data with each other.
   ─────────────────────────────────────────────────────────── */

beforeEach(() => localStorage.clear());


/* ── HELPER: seedStudent ─────────────────────────────────────
   Manually writes a student record into localStorage exactly
   the way signup.js does. This lets us test login without
   having to actually run the signup flow first.
   `overrides` lets individual tests change specific fields,
   e.g. seedStudent({ email: "john@tchefs.ac.ke" }).
   ─────────────────────────────────────────────────────────── */

function seedStudent(overrides = {}) {              // default to empty overrides if none provided

  const student = {                                 // build a default valid student object
    fullname: "Jane Wanjiku",
    email:    "jane@tchefs.ac.ke",
    phone:    "+254700000001",
    course:   "Culinary Arts",
    password: "Secret99",
    ...overrides,                                   // spread any caller-provided overrides on top
  };

  localStorage.setItem(                            // save the student using the same key format signup.js uses
    "student_" + student.email,                    // key:   "student_jane@tchefs.ac.ke"
    JSON.stringify(student)                        // value: the student object serialised to a JSON string
  );

  return student;                                  // return the object so tests can reference it directly
}


/* ============================================================
   GROUP 1 — validateLogin: missing / empty fields
   These tests confirm that login is blocked when the user
   submits the form without filling in one or both fields.
   ============================================================ */

describe("validateLogin — missing fields", () => {

  test("fails when both email and password are empty", () => {
    const r = validateLogin("", "");               // call with two empty strings
    expect(r.success).toBe(false);                 // login must not succeed
    expect(r.error).toBeTruthy();                  // there must be an error message (non-empty string)
  });

  test("fails when email is empty but password is provided", () => {
    const r = validateLogin("", "Secret99");       // email missing, password present
    expect(r.success).toBe(false);                 // should still fail — both fields are required
  });

  test("fails when password is empty but email is provided", () => {
    const r = validateLogin("jane@tchefs.ac.ke", ""); // email present, password missing
    expect(r.success).toBe(false);                    // should still fail
  });

  test("error message asks for both email and password", () => {
    const r = validateLogin("", "");               // both empty
    expect(r.error).toMatch(/email and password/i); // error text must mention both fields (case-insensitive)
  });

});


/* ============================================================
   GROUP 2 — validateLogin: account not found
   These tests confirm that login fails when the email has
   no matching account in localStorage.
   ============================================================ */

describe("validateLogin — account not found", () => {

  test("fails when no account exists for that email", () => {
    const r = validateLogin("ghost@tchefs.ac.ke", "Secret99"); // email that was never registered
    expect(r.success).toBe(false);                              // no account → login must fail
  });

  test("error message mentions no account found", () => {
    const r = validateLogin("ghost@tchefs.ac.ke", "Secret99"); // unknown email
    expect(r.error).toMatch(/no account/i);                    // error must say "no account" (case-insensitive)
  });

  test("fails after storage is cleared even if account existed before", () => {
    seedStudent();                                 // register jane
    localStorage.clear();                          // wipe all storage (simulates a fresh browser)
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99"); // try to log in
    expect(r.success).toBe(false);                 // account is gone → must fail
  });

});


/* ============================================================
   GROUP 3 — validateLogin: wrong password
   These tests confirm that login fails when the email is
   found but the password does not match exactly.
   ============================================================ */

describe("validateLogin — wrong password", () => {

  test("fails with an incorrect password", () => {
    seedStudent();                                 // create jane's account with password "Secret99"
    const r = validateLogin("jane@tchefs.ac.ke", "WrongPass"); // try a completely different password
    expect(r.success).toBe(false);                // wrong password → must fail
  });

  test("error message says incorrect password", () => {
    seedStudent();                                 // create the account
    const r = validateLogin("jane@tchefs.ac.ke", "WrongPass"); // bad password attempt
    expect(r.error).toMatch(/incorrect/i);        // error text must contain "incorrect" (case-insensitive)
  });

  test("is case-sensitive on password — lowercase first letter fails", () => {
    seedStudent();                                 // stored password is "Secret99" (capital S)
    const r = validateLogin("jane@tchefs.ac.ke", "secret99"); // 's' is lowercase — different string
    expect(r.success).toBe(false);                // must fail: password comparison is exact
  });

  test("is case-sensitive on password — all caps fails", () => {
    seedStudent();                                 // stored password is "Secret99"
    const r = validateLogin("jane@tchefs.ac.ke", "SECRET99"); // all caps — different string
    expect(r.success).toBe(false);                // must fail
  });

  test("fails when password has a trailing space", () => {
    seedStudent();                                 // stored password is "Secret99" with no spaces
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99 "); // extra space at the end
    expect(r.success).toBe(false);                // "Secret99 " !== "Secret99" — must fail
  });

});


/* ============================================================
   GROUP 4 — validateLogin: email case-insensitivity
   The email lookup uses toLowerCase() so users can type
   their email in any case and still get in.
   ============================================================ */

describe("validateLogin — email case-insensitivity", () => {

  test("succeeds with email in all uppercase", () => {
    seedStudent();                                 // stored as "jane@tchefs.ac.ke" (lowercase)
    const r = validateLogin("JANE@TCHEFS.AC.KE", "Secret99"); // typed in all caps
    expect(r.success).toBe(true);                 // getStudent lowercases before lookup → should match
  });

  test("succeeds with email in mixed case", () => {
    seedStudent();                                 // stored lowercase
    const r = validateLogin("Jane@Tchefs.Ac.Ke", "Secret99"); // mixed case
    expect(r.success).toBe(true);                 // still matches after toLowerCase
  });

  test("succeeds with email that has leading/trailing whitespace", () => {
    seedStudent();                                 // stored with no whitespace
    const r = validateLogin("  jane@tchefs.ac.ke  ", "Secret99"); // user accidentally added spaces
    expect(r.success).toBe(true);                 // trim() in getStudent removes them → should match
  });

});


/* ============================================================
   GROUP 5 — validateLogin: successful login
   These tests confirm that a correct email + password
   combination returns the right result shape and data.
   ============================================================ */

describe("validateLogin — successful login", () => {

  test("returns success: true with correct credentials", () => {
    seedStudent();                                 // set up jane's account
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99"); // correct email + password
    expect(r.success).toBe(true);                 // must succeed
  });

  test("returned result has no error property on success", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.error).toBeUndefined();              // successful result should NOT have an error field
  });

  test("returned student has the correct fullname", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.fullname).toBe("Jane Wanjiku"); // must match what was saved by seedStudent
  });

  test("returned student has the correct email", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.email).toBe("jane@tchefs.ac.ke"); // email returned must be the stored lowercase version
  });

  test("returned student has the correct course", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.course).toBe("Culinary Arts"); // course must match what was saved
  });

  test("returned student has the correct phone", () => {
    seedStudent();
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99");
    expect(r.student.phone).toBe("+254700000001"); // phone must match what was saved
  });

});


/* ============================================================
   GROUP 6 — validateLogin: reads signup.js account format
   login.js and signup.js are separate files but share the
   same localStorage key format ("student_<email>"). These
   tests verify that an account created by signup.js is
   readable by login.js, including edge cases like two
   accounts coexisting and password isolation between them.
   ============================================================ */

describe("validateLogin — reads signup.js account format", () => {

  test("reads an account saved with the student_<email> key prefix", () => {
    // manually write a record exactly as signup.js does
    localStorage.setItem("student_jane@tchefs.ac.ke", JSON.stringify({
      fullname: "Jane Wanjiku",
      email:    "jane@tchefs.ac.ke",
      phone:    "+254700000001",
      course:   "Culinary Arts",
      password: "Secret99",
    }));
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99"); // now try to log in
    expect(r.success).toBe(true);                // login.js must be able to read signup.js's format
  });

  test("two different accounts can coexist in storage", () => {
    seedStudent({ email: "jane@tchefs.ac.ke", password: "Secret99" });  // register jane
    seedStudent({ email: "john@tchefs.ac.ke", password: "Password1" }); // register john

    expect(validateLogin("jane@tchefs.ac.ke", "Secret99").success).toBe(true);  // jane can log in
    expect(validateLogin("john@tchefs.ac.ke", "Password1").success).toBe(true); // john can log in
  });

  test("jane's password does not unlock john's account", () => {
    seedStudent({ email: "jane@tchefs.ac.ke", password: "Secret99" });  // jane's password
    seedStudent({ email: "john@tchefs.ac.ke", password: "Password1" }); // john's separate password

    const r = validateLogin("john@tchefs.ac.ke", "Secret99"); // try jane's password on john's account
    expect(r.success).toBe(false);               // must fail — passwords belong to separate accounts
  });

});


/* ============================================================
   GROUP 7 — getStudent: storage helper
   getStudent is the low-level function that reads a student
   record from localStorage. These tests check it in isolation.
   ============================================================ */

describe("getStudent", () => {

  test("returns null for an unknown email", () => {
    // nothing seeded — storage is empty
    expect(getStudent("nobody@tchefs.ac.ke")).toBeNull(); // must return null, not undefined or throw
  });

  test("returns the student object for a known email", () => {
    const student = seedStudent();                // write jane to storage and keep the object
    expect(getStudent("jane@tchefs.ac.ke")).toEqual(student); // must read back an equal object
  });

  test("is case-insensitive on email lookup", () => {
    const student = seedStudent();                // stored under lowercase key
    expect(getStudent("JANE@TCHEFS.AC.KE")).toEqual(student); // uppercase lookup must still find her
  });

  test("trims whitespace from email before lookup", () => {
    const student = seedStudent();                // stored with no whitespace in key
    expect(getStudent("  jane@tchefs.ac.ke  ")).toEqual(student); // padded lookup must still find her
  });

  test("returns null after storage is cleared", () => {
    seedStudent();                                // write jane to storage
    localStorage.clear();                         // then wipe everything
    expect(getStudent("jane@tchefs.ac.ke")).toBeNull(); // must return null — record is gone
  });

});


/* ============================================================
   GROUP 8 — setSession
   setSession writes the logged-in student to localStorage
   under "tchefs_session". The student dashboard reads this
   key to know who is logged in.
   ============================================================ */

describe("setSession", () => {

  test("saves the student under the tchefs_session key", () => {
    const student = seedStudent();                // build a student object
    setSession(student);                          // call the function we are testing
    const raw = localStorage.getItem("tchefs_session"); // read straight from storage
    expect(raw).not.toBeNull();                   // something must have been written
  });

  test("stored session can be parsed back to the original student", () => {
    const student = seedStudent();                // original student object
    setSession(student);                          // write it to storage
    const parsed = JSON.parse(localStorage.getItem("tchefs_session")); // read & parse it back
    expect(parsed).toEqual(student);             // parsed object must deeply equal the original
  });

  test("overwrites an existing session with the new student", () => {
    const jane = seedStudent({ email: "jane@tchefs.ac.ke" });                    // jane's account
    const john = seedStudent({ email: "john@tchefs.ac.ke", fullname: "John Kamau" }); // john's account

    setSession(jane);                             // jane logs in first
    setSession(john);                             // then john logs in (overwrites jane's session)

    const parsed = JSON.parse(localStorage.getItem("tchefs_session")); // read the current session
    expect(parsed.fullname).toBe("John Kamau");  // must be john — the most recent login wins
  });

  test("session set by setSession is readable after validateLogin succeeds", () => {
    seedStudent();                                // create jane's account
    const r = validateLogin("jane@tchefs.ac.ke", "Secret99"); // log in (gets student back)
    setSession(r.student);                        // save the session (as login.js does after success)

    const session = JSON.parse(localStorage.getItem("tchefs_session")); // read it back
    expect(session.email).toBe("jane@tchefs.ac.ke"); // session must contain jane's email
  });

});