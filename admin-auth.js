/* ============================================================
   admin-auth.js — TChefs Admin Authentication
   Used by: admin-setup.html, admin-login.html

   The setup key — change this to something only you know.
   Anyone who wants to create the first admin account must
   know this key. Keep it private.
   ============================================================ */

const SETUP_KEY = "password##.?"; // ← change this to your own secret key


/* ── Shared helpers ──────────────────────────────────────────
   Small reusable functions used across setup and login      */

// Shorthand for document.getElementById
function el(id) {
  return document.getElementById(id);
}

// Show an inline error message
function showError(id, message) {
  const box = el(id);
  if (!box) return;
  box.textContent = message;          // set the message text
  box.classList.remove("hidden");     // make it visible
}

// Hide an inline error message
function hideError(id) {
  const box = el(id);
  if (box) box.classList.add("hidden");
}

// Toggle password field between visible and hidden
function togglePwVisibility(inputId, btn) {
  const input = el(inputId);
  if (!input) return;
  const isHidden   = input.type === "password"; // is it currently hidden?
  input.type       = isHidden ? "text" : "password"; // flip it
  btn.textContent  = isHidden ? "Hide" : "Show";     // update the label
}

// Return a strength object { label, color, width } for a given password
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)            score++; // long enough
  if (/[A-Z]/.test(password))          score++; // has uppercase letter
  if (/[0-9]/.test(password))          score++; // has a number
  if (/[^A-Za-z0-9]/.test(password))  score++; // has a symbol

  const levels = [
    { label: "",       color: "",          width: "0%"   },
    { label: "Weak",   color: "#E31B23",   width: "25%"  },
    { label: "Fair",   color: "#f59e0b",   width: "50%"  },
    { label: "Good",   color: "#3b82f6",   width: "75%"  },
    { label: "Strong", color: "#22c55e",   width: "100%" },
  ];
  return levels[score];
}

// Read all admin accounts from localStorage
function getAdmins() {
  return JSON.parse(localStorage.getItem("tchefs_admins") || "[]");
}

// Save the admins array back to localStorage
function saveAdmins(admins) {
  localStorage.setItem("tchefs_admins", JSON.stringify(admins));
}


/* ══════════════════════════════════════════════════════════
   SETUP PAGE — admin-setup.html
   Only works when no admins exist yet.
   ══════════════════════════════════════════════════════════ */

const setupForm = el("setupForm"); // only exists on admin-setup.html

if (setupForm) {

  // Show / hide toggles for each password field
  el("toggleKey")?.addEventListener("click", function () {
    togglePwVisibility("setupKey", this);
  });

  el("togglePw")?.addEventListener("click", function () {
    togglePwVisibility("setupPassword", this);
  });

  el("toggleConfirm")?.addEventListener("click", function () {
    togglePwVisibility("setupConfirm", this);
  });

  // Live password strength bar
  el("setupPassword")?.addEventListener("input", function () {
    const result = getPasswordStrength(this.value);
    const bar    = el("strengthBar");
    const label  = el("strengthLabel");
    if (bar)   { bar.style.width = result.width; bar.style.backgroundColor = result.color; }
    if (label) { label.textContent = result.label; label.style.color = result.color; }
  });

  // Live confirm password match
  el("setupConfirm")?.addEventListener("input", function () {
    const pw    = el("setupPassword")?.value;
    const label = el("matchLabel");
    if (!label) return;
    if (!this.value) { label.textContent = ""; return; }
    label.textContent = this.value === pw ? "Passwords match" : "Passwords do not match";
    label.style.color = this.value === pw ? "#22c55e" : "#E31B23";
  });

  // Handle setup form submission
  setupForm.addEventListener("submit", function (e) {
    e.preventDefault();          // stop page reload
    hideError("setupError");     // clear previous errors

    // Read all field values
    const fullname = el("setupName").value.trim();
    const email    = el("setupEmail").value.trim().toLowerCase();
    const key      = el("setupKey").value;
    const password = el("setupPassword").value;
    const confirm  = el("setupConfirm").value;

    // 1. All fields must be filled
    if (!fullname || !email || !key || !password || !confirm) {
      showError("setupError", "Please fill in all fields.");
      return;
    }

    // 2. The setup key must match exactly
    if (key !== SETUP_KEY) {
      showError("setupError", "Incorrect setup key. Please contact your system administrator.");
      return;
    }

    // 3. Password must be at least 8 characters
    if (password.length < 8) {
      showError("setupError", "Password must be at least 8 characters.");
      return;
    }

    // 4. Both passwords must match
    if (password !== confirm) {
      showError("setupError", "Passwords do not match.");
      return;
    }

    // 5. Double-check: make sure no admins have been created while the form was open
    if (getAdmins().length > 0) {
      showError("setupError", "An admin account already exists. This setup page is locked.");
      return;
    }

    // Build the first admin object
    const firstAdmin = {
      fullname:  fullname,
      email:     email,
      role:      "Super Admin",   // the first admin is always a Super Admin
      password:  password,
      createdOn: new Date().toLocaleDateString("en-KE", {
        day: "numeric", month: "short", year: "numeric",
      }),
    };

    // Save to localStorage — from now on this page is locked
    saveAdmins([firstAdmin]);

    // Hide the form and show the success message
    setupForm.style.display = "none";
    el("setupSuccess").classList.remove("hidden");

    // Redirect to login after 2 seconds
    setTimeout(function () {
      window.location.href = "admin-login.html";
    }, 2000);
  });
}


/* ══════════════════════════════════════════════════════════
   LOGIN PAGE — admin-login.html
   ══════════════════════════════════════════════════════════ */

const loginForm = el("adminLoginForm"); // only exists on admin-login.html

if (loginForm) {

  // Show / hide toggle for password
  el("togglePw")?.addEventListener("click", function () {
    togglePwVisibility("adminPassword", this);
  });

  // Handle login form submission
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError("loginError");

    const email    = el("adminEmail").value.trim().toLowerCase();
    const password = el("adminPassword").value;
    const btn      = el("loginBtn");

    // Both fields must be filled
    if (!email || !password) {
      showError("loginError", "Please enter your email and password.");
      return;
    }

    // Show loading state on the button
    btn.textContent = "Logging in…";
    btn.disabled    = true;

    // Short simulated delay
    setTimeout(function () {

      const admins = getAdmins(); // read all admin accounts

      // Find an admin whose email matches
      const admin = admins.find(function (a) {
        return a.email === email;
      });

      // No account found for that email
      if (!admin) {
        showError("loginError", "No admin account found with that email.");
        btn.textContent = "Login";
        btn.disabled    = false;
        return;
      }

      // Email found but wrong password
      if (admin.password !== password) {
        showError("loginError", "Incorrect password. Please try again.");
        btn.textContent = "Login";
        btn.disabled    = false;
        return;
      }

      // ✅ Success — save the admin session
      localStorage.setItem("tchefs_admin_session", JSON.stringify(admin));

      // Update button to show success feedback
      btn.textContent = "Welcome, " + admin.fullname.split(" ")[0] + "!";

      // Redirect to the admin dashboard
      setTimeout(function () {
        window.location.href = "admin-dashboard.html";
      }, 800);

    }, 600);
  });
}