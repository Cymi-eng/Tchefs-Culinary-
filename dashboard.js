/* ============================================================
   dashboard.js — TChefs Student Dashboard
   
   This file does three things:
   1. Checks that a student is logged in
   2. Reads their data from localStorage
   3. Puts their data into the page (DOM manipulation)
   ============================================================ */


/* ── STEP 1: Get the logged-in student ───────────────────────
   login.js saves the student under the key "tchefs_session"
   when they log in successfully. We read it here.
   If nothing is found, the student is not logged in,
   so we send them back to the login page immediately.        */

const sessionData = localStorage.getItem("tchefs_session"); // read from storage

if (!sessionData) {
  // No session found — redirect to login page
  window.location.href = "login.html";
}

// Parse the JSON string into a JavaScript object
const student = JSON.parse(sessionData);


/* ── STEP 2: Helper — get an element by its ID ───────────────
   This is just a shortcut so we don't have to type
   document.getElementById() every single time.              */

function el(id) {
  return document.getElementById(id); // find the HTML element with this id
}


/* ── STEP 3: Fill in the student's name everywhere ───────────
   We show their name in:
   - The welcome banner ("Hello, Jane!")
   - The sidebar name
   - The avatar circles (first letter of their name)         */

const firstName = student.fullname.split(" ")[0]; // e.g. "Jane Wanjiku" → "Jane"
const initial   = student.fullname.charAt(0).toUpperCase(); // e.g. "J"

el("welcomeName").textContent    = firstName;      // welcome banner
el("sidebarName").textContent    = student.fullname; // sidebar name
el("sidebarCourse").textContent  = student.course;   // sidebar course under name
el("sidebarInitial").textContent = initial;          // sidebar avatar circle
el("headerInitial").textContent  = initial;          // top-right avatar circle


/* ── STEP 4: Fill in the Dashboard tab info cards ────────────
   Each card on the dashboard shows one piece of student data.
   We find each card's text element by ID and set its text.   */

el("cardName").textContent   = student.fullname; // Full Name card
el("cardEmail").textContent  = student.email;    // Email card
el("cardPhone").textContent  = student.phone;    // Phone card
el("cardCourse").textContent = student.course;   // Course card


/* ── STEP 5: Fill in the Profile tab ────────────────────────
   The profile tab shows the same information in a list layout.
   We do the same thing — find each element and set the text.  */

el("profileName").textContent   = student.fullname; // full name row
el("profileEmail").textContent  = student.email;    // email row
el("profilePhone").textContent  = student.phone;    // phone row
el("profileCourse").textContent = student.course;   // course row


/* ── STEP 6: Tab switching ───────────────────────────────────
   When the student clicks a sidebar link, we:
   1. Hide all tab panels
   2. Remove the "active" style from all sidebar links
   3. Show only the chosen tab panel
   4. Add the "active" style to the chosen sidebar link
   5. Update the page title in the top bar              */

function showTab(tabName) {

  // Get all elements with the class "tab-panel"
  const allPanels = document.querySelectorAll(".tab-panel");

  // Loop through every panel and hide it
  allPanels.forEach(function(panel) {
    panel.classList.remove("active"); // remove "active" → hides the panel
  });

  // Get all elements with the class "nav-link"
  const allLinks = document.querySelectorAll(".nav-link");

  // Loop through every link and remove its active highlight
  allLinks.forEach(function(link) {
    link.classList.remove("active"); // remove highlight from all links
  });

  // Show only the tab the student clicked on
  el("tab-" + tabName).classList.add("active"); // e.g. "tab-dashboard" becomes visible

  // Highlight only the sidebar link that was clicked
  el("nav-" + tabName).classList.add("active"); // e.g. "nav-dashboard" gets highlighted

  // Update the page title in the top bar to match the tab name
  const titles = {
    dashboard: "Dashboard",  // title for dashboard tab
    profile:   "My Profile", // title for profile tab
  };
  el("pageTitle").textContent = titles[tabName] || tabName; // set the title text

  // Close the sidebar if we're on mobile (so it doesn't block the content)
  closeSidebar();
}


/* ── STEP 7: Sidebar open / close (mobile only) ─────────────
   On small screens the sidebar is hidden off the left edge.
   openSidebar() slides it in. closeSidebar() slides it out.  */

function openSidebar() {
  // Slide the sidebar into view by removing the -translate-x-full class
  el("sidebar").style.transform = "translateX(0)";

  // Show the dark overlay behind the sidebar
  el("overlay").classList.add("open");
}

function closeSidebar() {
  // Slide the sidebar back off-screen (reset the transform)
  el("sidebar").style.transform = "";

  // Hide the dark overlay
  el("overlay").classList.remove("open");
}


/* ── STEP 8: Logout ─────────────────────────────────────────
   When the student clicks "Logout" we:
   1. Remove their session from localStorage
   2. Send them back to the login page                       */

function logout() {
  localStorage.removeItem("tchefs_session"); // delete the saved session
  window.location.href = "login.html";       // go back to login
}