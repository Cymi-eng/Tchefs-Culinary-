/* ============================================================
   login.js — TChefs Culinary Institute
   Handles all login page DOM logic.
   Depends on: signup.js (shared storage functions)
   ============================================================ */

/* ── Shared storage (reads accounts saved by signup.js) ──── */

function getStudent(email) {
  const data = localStorage.getItem("student_" + email.toLowerCase().trim());
  return data ? JSON.parse(data) : null;
}

function setSession(student) {
  localStorage.setItem("tchefs_session", JSON.stringify(student));
}

/* ── Core login logic (pure — exported for tests) ────────── */

function validateLogin(email, password) {
  if (!email || !password) {
    return { success: false, error: "Please enter your email and password." };
  }

  const student = getStudent(email);

  if (!student) {
    return { success: false, error: "No account found with that email. Please sign up first." };
  }

  if (student.password !== password) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  return { success: true, student };
}

/* ── DOM helpers ─────────────────────────────────────────── */

function showError(message) {
  const el = document.getElementById("loginError");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError() {
  const el = document.getElementById("loginError");
  if (el) el.classList.add("hidden");
}

function setButtonState(text, disabled) {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = disabled;
}

/* ── Password show / hide ────────────────────────────────── */

document.getElementById("toggleLoginPw")?.addEventListener("click", function () {
  const input = document.getElementById("loginPassword");
  if (!input) return;
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  this.textContent = hidden ? "Hide" : "Show";
});

/* ── Form submit ─────────────────────────────────────────── */

document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  hideError();

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  setButtonState("Logging in…", true);

  setTimeout(() => {
    const result = validateLogin(email, password);

    if (!result.success) {
      showError(result.error);
      setButtonState("Login", false);
      return;
    }

    setSession(result.student);
    setButtonState("Welcome back, " + result.student.fullname.split(" ")[0] + "!", true);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  }, 600);
});


if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateLogin, getStudent, setSession };
}