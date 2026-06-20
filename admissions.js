/* ============================================================
   admissions.js — TChefs Culinary Institute
   Handles the online application form on admissions.html.

   What this file does:
   1. Listens for the form submission
   2. Reads all the field values
   3. Validates that required fields are filled
   4. Saves the application to localStorage
   5. Shows a success message to the user
   ============================================================ */


/* ── STEP 1: Listen for the form submission ──────────────────
   We find the form by its id "applyForm" and attach a
   submit event listener to it.                              */

const applyForm = document.getElementById("applyForm"); // get the form element

applyForm.addEventListener("submit", function (e) {

  // Prevent the page from refreshing on submit (default browser behaviour)
  e.preventDefault();


  /* ── STEP 2: Read every field value from the form ──────────
     Each input has an id — we use that to get its value.    */

  const fullname = document.getElementById("appFullname").value.trim();   // applicant's full name
  const phone    = document.getElementById("appPhone").value.trim();      // phone number
  const email    = document.getElementById("appEmail").value.trim();      // email address
  const programme = document.getElementById("appProgramme").value;        // chosen programme
  const intake   = document.getElementById("appIntake").value;            // preferred intake
  const about    = document.getElementById("appAbout").value.trim();      // personal statement


  /* ── STEP 3: Validate — make sure required fields are filled
     Even though HTML "required" catches most cases, we double-
     check here so we can show our own friendly error message. */

  if (!fullname || !phone || !email || !programme || !intake) {
    // Show the error message div
    showError("Please fill in all required fields before submitting.");
    return; // stop here — don't save anything
  }


  /* ── STEP 4: Build the application object ───────────────────
     We put all the data into one neat object so it's easy
     to store and read back later.                            */

  const application = {
    fullname:   fullname,            // applicant full name
    phone:      phone,               // phone number
    email:      email,               // email address
    programme:  programme,           // selected programme
    intake:     intake,              // selected intake period
    about:      about,               // personal statement (optional)
    status:     "Pending",           // default status — admin can change this
    appliedOn:  new Date().toLocaleDateString("en-KE", {  // date submitted
      day:   "numeric",
      month: "short",
      year:  "numeric",
    }),
  };


  /* ── STEP 5: Save to localStorage ───────────────────────────
     We store all applications as an array under the key
     "tchefs_applications".

     Process:
     a) Read the existing array from localStorage
     b) Add the new application to the array
     c) Save the updated array back to localStorage           */

  // a) Read existing applications (if none exist, start with an empty array)
  const existing = JSON.parse(localStorage.getItem("tchefs_applications") || "[]");

  // b) Add the new application to the array
  existing.push(application);

  // c) Save the updated array back — must convert to JSON string first
  localStorage.setItem("tchefs_applications", JSON.stringify(existing));


  /* ── STEP 6: Show success message, hide the form ────────────
     Once saved, we hide the form and show a thank-you message.
     The admin can now see this application in the dashboard.  */

  applyForm.style.display = "none";             // hide the form
  document.getElementById("successMsg").classList.remove("hidden"); // show success box
  document.getElementById("errorMsg").classList.add("hidden");      // hide any error


});


/* ── HELPER: showError ───────────────────────────────────────
   Shows an error message box with the given text.
   Hides it automatically after 4 seconds.                   */

function showError(message) {
  const errorEl = document.getElementById("errorMsg"); // get the error div
  errorEl.textContent = message;                        // set the error text
  errorEl.classList.remove("hidden");                   // make it visible

  // Auto-hide the error after 4 seconds
  setTimeout(function () {
    errorEl.classList.add("hidden");
  }, 4000);
}


/* ── Mobile menu + scroll-to-top (shared script.js logic) ───
   These are here so admissions.html works even without
   script.js being present.                                  */

// Mobile menu toggle
const menuBtn    = document.getElementById("menuBtn");     // hamburger button
const mobileMenu = document.getElementById("mobileMenu"); // the dropdown menu

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", function () {
    mobileMenu.classList.toggle("open"); // toggle open/closed
  });
}

// Scroll to top button — show after scrolling 400px down
const scrollBtn = document.getElementById("scrollTop"); // the ↑ button

window.addEventListener("scroll", function () {
  if (!scrollBtn) return;
  // Show the button if scrolled more than 400px, hide otherwise
  scrollBtn.style.display = window.scrollY > 400 ? "flex" : "none";
  scrollBtn.style.alignItems     = "center";
  scrollBtn.style.justifyContent = "center";
});

// Scroll back to the top when the button is clicked
if (scrollBtn) {
  scrollBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}