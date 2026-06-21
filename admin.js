/* ============================================================
   admin.js — TChefs Admin Dashboard
   Simple, well-commented admin logic.

   What this file does:
   1. Reads the logged-in admin from localStorage
   2. Fills their name into the sidebar and header
   3. Renders Overview, Students, and Applications tabs
   4. Handles tab switching, search, export CSV, and logout
   ============================================================ */


/* ── STEP 1: Read the logged-in admin session ────────────────
   admin-auth.js saves the admin object to "tchefs_admin_session"
   when they log in. We read it here.                         */

const sessionData = localStorage.getItem("tchefs_admin_session"); // read session
const admin       = sessionData ? JSON.parse(sessionData) : null; // parse it


/* ── STEP 2: Fill admin name into the page ───────────────────
   Show their name and first initial in the sidebar + header. */

if (admin) {
  const firstName = admin.fullname.split(" ")[0];          // e.g. "Joseph"
  const initial   = admin.fullname.charAt(0).toUpperCase(); // e.g. "J"

  document.getElementById("welcomeName").textContent    = firstName;    // welcome banner
  document.getElementById("sidebarName").textContent    = admin.fullname; // sidebar name
  document.getElementById("sidebarRole").textContent    = admin.role;     // sidebar role
  document.getElementById("sidebarInitial").textContent = initial;        // sidebar avatar
  document.getElementById("headerInitial").textContent  = initial;        // top-right avatar
}


/* ── STEP 3: Helper — get an element by its ID ───────────────
   Shorthand so we don't repeat document.getElementById()    */

function el(id) {
  return document.getElementById(id);
}


/* ── STEP 4: Data readers ────────────────────────────────────
   These read data saved by signup.js and admissions.js      */

// Get all students — signup.js saves each one as "student_{email}"
function getStudents() {
  const students = []; // start with empty array

  // Loop through every key in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i); // get the key name

    // Only pick keys that start with "student_" (saved by signup.js)
    if (key.startsWith("student_")) {
      try {
        const student = JSON.parse(localStorage.getItem(key)); // parse the student
        if (student && student.email) {
          students.push(student); // add to our array
        }
      } catch (e) {
        // skip any broken entries
      }
    }
  }

  return students; // return the full list
}

// Get all applications — admissions.js saves them as "tchefs_applications"
function getApplications() {
  return JSON.parse(localStorage.getItem("tchefs_applications") || "[]");
}

// Save updated applications back to localStorage
function saveApplications(apps) {
  localStorage.setItem("tchefs_applications", JSON.stringify(apps));
}


/* ── STEP 5: TAB SWITCHING ───────────────────────────────────
   When a sidebar button is clicked, we hide all panels and
   show only the chosen one. Same pattern as dashboard.js    */

// Tab titles shown in the top bar
const tabTitles = {
  overview:     "Overview",
  students:     "Students",
  applications: "Applications",
};

function showTab(name) {
  // Hide all tab panels
  document.querySelectorAll(".tab-panel").forEach(function (panel) {
    panel.classList.remove("active");
  });

  // Remove active highlight from all sidebar links
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.classList.remove("active");
  });

  // Show the chosen tab panel
  el("tab-" + name).classList.add("active");

  // Highlight the chosen sidebar link
  el("nav-" + name).classList.add("active");

  // Update the page title in the top bar
  el("pageTitle").textContent = tabTitles[name] || name;

  // Close the sidebar on mobile
  closeSidebar();

  // Render the content for this tab
  if (name === "overview")     renderOverview();
  if (name === "students")     renderStudents(getStudents());
  if (name === "applications") renderApplications();
}


/* ── STEP 6: RENDER OVERVIEW ─────────────────────────────────
   Fill in the stat cards and the recent applications list   */

function renderOverview() {
  const students     = getStudents();      // all students
  const applications = getApplications();  // all applications

  // Count how many applications are still "Pending"
  const pending = applications.filter(function (a) {
    return a.status === "Pending";
  }).length;

  // Fill the stat cards
  el("statStudents").textContent    = students.length;     // total students
  el("statApplications").textContent = applications.length; // total applications
  el("statPending").textContent     = pending;             // pending review count

  // Show the 5 most recent applications in the preview list
  const recent   = applications.slice(-5).reverse(); // last 5, newest first
  const container = el("recentApplications");         // the list container

  if (recent.length === 0) {
    // No applications yet
    container.innerHTML = `
      <p class="px-6 py-8 text-sm text-gray-400 text-center">No applications yet.</p>
    `;
    return;
  }

  // Build one row per application
  container.innerHTML = recent.map(function (a) {
    return `
      <div class="px-6 py-4 flex items-center justify-between gap-4">
        <!-- Left: avatar initial + name/programme -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center
                      text-white text-xs font-bold flex-shrink-0">
            ${a.fullname.charAt(0)}
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-800">${a.fullname}</p>
            <p class="text-xs text-gray-400">${a.programme}</p>
          </div>
        </div>
        <!-- Right: status badge -->
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0
          ${a.status === 'Approved' ? 'bg-green-100 text-green-700' :
            a.status === 'Rejected' ? 'bg-red-100 text-red-600'    :
                                      'bg-amber-100 text-amber-700'}">
          ${a.status}
        </span>
      </div>
    `;
  }).join("");
}


/* ── STEP 7: RENDER STUDENTS TABLE ──────────────────────────
   Build the table rows from the students array             */

function renderStudents(students) {
  const body    = el("studentTableBody"); // the <tbody> element
  const empty   = el("studentEmpty");     // "No students found" message
  const counter = el("studentCount");     // row count text

  // Update the count label
  counter.textContent = students.length + " student" + (students.length !== 1 ? "s" : "");

  if (students.length === 0) {
    // No students — show empty state
    body.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  // Has students — hide empty state
  empty.classList.add("hidden");

  // Build one <tr> per student
  body.innerHTML = students.map(function (s, i) {
    return `
      <tr>
        <td class="text-gray-400">${i + 1}</td>
        <td>
          <div class="flex items-center gap-2.5">
            <!-- Avatar circle with first initial -->
            <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center
                        text-white text-xs font-bold flex-shrink-0">
              ${s.fullname.charAt(0)}
            </div>
            <span class="font-medium text-gray-800">${s.fullname}</span>
          </div>
        </td>
        <td class="text-gray-500">${s.email}</td>
        <td class="text-gray-500">${s.phone || "—"}</td>
        <td>
          <span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ${s.course || "—"}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}


/* ── STEP 8: SEARCH / FILTER STUDENTS ───────────────────────
   Called every time the user types in the search box       */

function filterStudents() {
  const query    = el("searchInput").value.toLowerCase(); // what the user typed
  const all      = getStudents();                          // all students

  // Keep only students whose name or email contains the search query
  const filtered = all.filter(function (s) {
    return s.fullname.toLowerCase().includes(query) ||
           s.email.toLowerCase().includes(query);
  });

  renderStudents(filtered); // re-render with filtered list
}


/* ── STEP 9: RENDER APPLICATIONS TABLE ──────────────────────
   Build rows from the applications array                   */

function renderApplications() {
  const apps  = getApplications();           // all applications
  const body  = el("applicationTableBody");  // the <tbody>
  const empty = el("applicationEmpty");      // empty state message

  if (apps.length === 0) {
    // No applications yet
    body.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden"); // hide the empty state

  // Build one row per application
  body.innerHTML = apps.map(function (a, i) {

    // Choose badge colour based on status
    const badgeClass =
      a.status === "Approved" ? "bg-green-100 text-green-700"  :
      a.status === "Rejected" ? "bg-red-100 text-red-600"      :
                                "bg-amber-100 text-amber-700";  // Pending

    return `
      <tr>
        <td class="text-gray-400">${i + 1}</td>
        <td class="font-medium text-gray-800">${a.fullname}</td>
        <td class="text-gray-500">${a.email}</td>
        <td>
          <span class="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            ${a.programme}
          </span>
        </td>
        <td class="text-gray-500">${a.intake}</td>
        <td class="text-gray-400">${a.appliedOn}</td>
        <td>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}">
            ${a.status}
          </span>
        </td>
        <td>
          <div class="flex gap-2">
            <!-- Approve button — calls updateStatus with this row's index -->
            <button
              onclick="updateStatus(${i}, 'Approved')"
              class="text-xs bg-green-50 hover:bg-green-600 hover:text-white
                     text-green-700 font-semibold px-2.5 py-1.5 rounded-lg transition"
            >Approve</button>
            <!-- Reject button -->
            <button
              onclick="updateStatus(${i}, 'Rejected')"
              class="text-xs bg-red-50 hover:bg-accent hover:text-white
                     text-accent font-semibold px-2.5 py-1.5 rounded-lg transition"
            >Reject</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}


/* ── STEP 10: UPDATE APPLICATION STATUS ─────────────────────
   Called when admin clicks Approve or Reject               */

function updateStatus(index, newStatus) {
  const apps      = getApplications();   // read all applications
  apps[index].status = newStatus;        // update this one's status
  saveApplications(apps);                // save back to localStorage
  renderApplications();                  // re-render the table
  renderOverview();                      // update the pending count on overview
}


/* ── STEP 11: EXPORT CSV ─────────────────────────────────────
   Convert an array of arrays into a CSV file and download it */

function downloadCSV(rows, filename) {
  // Join each row's values with commas, and rows with newlines
  const csv  = rows.map(function (row) {
    return row.map(function (v) {
      return '"' + String(v).replace(/"/g, '""') + '"'; // wrap in quotes
    }).join(",");
  }).join("\n");

  // Create a downloadable blob and trigger a click
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url); // clean up the object URL
}

// Export students to CSV
function exportStudentsCSV() {
  const rows = [["#", "Name", "Email", "Phone", "Course"]]; // header row
  getStudents().forEach(function (s, i) {
    rows.push([i + 1, s.fullname, s.email, s.phone || "", s.course || ""]);
  });
  downloadCSV(rows, "tchefs_students.csv");
}

// Export applications to CSV
function exportApplicationsCSV() {
  const rows = [["#", "Name", "Email", "Programme", "Intake", "Applied On", "Status"]];
  getApplications().forEach(function (a, i) {
    rows.push([i + 1, a.fullname, a.email, a.programme, a.intake, a.appliedOn, a.status]);
  });
  downloadCSV(rows, "tchefs_applications.csv");
}


/* ── STEP 12: SIDEBAR OPEN / CLOSE (mobile) ─────────────────
   Same pattern as dashboard.js                             */

function openSidebar() {
  el("sidebar").style.transform = "translateX(0)"; // slide in
  el("overlay").classList.add("open");              // show overlay
}

function closeSidebar() {
  el("sidebar").style.transform = "";              // slide out
  el("overlay").classList.remove("open");           // hide overlay
}


/* ── STEP 13: LOGOUT ─────────────────────────────────────────
   Clear the admin session and go back to login             */

function logout() {
  localStorage.removeItem("tchefs_admin_session"); // remove session
  window.location.href = "admin-login.html";        // go to login
}


/* ── STEP 14: INIT — run on page load ───────────────────────
   Render the overview tab when the dashboard first opens   */

renderOverview(); // fill in stats and recent applications straight away