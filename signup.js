/* ============================================================
   signup.js — TChefs Culinary Institute
   Handles all signup page DOM logic.
   Saves accounts that login.js will later read.
   ============================================================ */

/* ── Shared storage ──────────────────────────────────────── */

function getStudent(email) {
  const data = localStorage.getItem("student_" + email.toLowerCase().trim());
  return data ? JSON.parse(data) : null;
}

function saveStudent(student) {
  localStorage.setItem("student_" + student.email, JSON.stringify(student));
}

/* ── Core signup logic (pure — exported for tests) ────────── */

function validateSignup({ fullname, email, phone, course, password, confirmPassword }) {
  if (!fullname || !email || !phone || !course || !password || !confirmPassword) {
    return { success: false, error: "Please fill in all fields." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (getStudent(normalizedEmail)) {
    return { success: false, error: "An account with this email already exists." };
  }

  const student = { fullname, email: normalizedEmail, phone, course, password };
  saveStudent(student);

  return { success: true, student };
}

/* ── Password strength ───────────────────────────────────── */

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)        score++;
  if (/[A-Z]/.test(password))      score++;
  if (/[0-9]/.test(password))      score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "",        color: "",          width: "0%"   },
    { label: "Weak",    color: "#E31B23",   width: "25%"  },
    { label: "Fair",    color: "#f59e0b",   width: "50%"  },
    { label: "Good",    color: "#3b82f6",   width: "75%"  },
    { label: "Strong",  color: "#22c55e",   width: "100%" },
  ];

  return levels[score];
}

/* ── DOM helpers ─────────────────────────────────────────── */

function showError(message) {
  const el = document.getElementById("signupError");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError() {
  const el = document.getElementById("signupError");
  if (el) el.classList.add("hidden");
}

function showSuccess() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("signupSuccess")?.classList.remove("hidden");
}

/* ── Password show / hide toggles ────────────────────────── */

document.getElementById("togglePw")?.addEventListener("click", function () {
  const input = document.getElementById("password");
  if (!input) return;
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  this.textContent = hidden ? "Hide" : "Show";
});

document.getElementById("toggleConfirmPw")?.addEventListener("click", function () {
  const input = document.getElementById("confirmPassword");
  if (!input) return;
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  this.textContent = hidden ? "Hide" : "Show";
});

/* ── Live password strength bar ──────────────────────────── */

document.getElementById("password")?.addEventListener("input", function () {
  const result = getPasswordStrength(this.value);
  const bar    = document.getElementById("strengthBar");
  const label  = document.getElementById("strengthLabel");
  if (bar)   { bar.style.width = result.width; bar.style.backgroundColor = result.color; }
  if (label) { label.textContent = result.label; label.style.color = result.color; }
});

/* ── Live confirm password match ─────────────────────────── */

document.getElementById("confirmPassword")?.addEventListener("input", function () {
  const pw    = document.getElementById("password")?.value;
  const label = document.getElementById("matchLabel");
  if (!label) return;
  if (!this.value) { label.textContent = ""; return; }
  label.textContent = this.value === pw ? "Passwords match" : "Passwords do not match";
  label.style.color = this.value === pw ? "#22c55e" : "#E31B23";
});

/* ── Form submit ─────────────────────────────────────────── */

document.getElementById("signupForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  hideError();

  const result = validateSignup({
    fullname:        document.getElementById("fullname").value.trim(),
    email:           document.getElementById("email").value.trim(),
    phone:           document.getElementById("phone").value.trim(),
    course:          document.getElementById("course").value,
    password:        document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value,
  });

  if (!result.success) {
    showError(result.error);
    return;
  }

  showSuccess();
  setTimeout(() => { window.location.href = "login.html"; }, 2000);
});

/* ── Export for signup.test.js (Node.js) ─────────────────── */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateSignup, getPasswordStrength, getStudent, saveStudent };
}