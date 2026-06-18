// SIGNUP

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const course = document.getElementById("course").value;
    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const student = {
      fullname,
      email,
      phone,
      course,
      password,
    };

    localStorage.setItem(
      email,
      JSON.stringify(student)
    );

    alert("Account created successfully!");

    window.location.href = "login.html";
  });
}

// LOGIN

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email =
      document.getElementById("loginEmail").value;

    const password =
      document.getElementById("loginPassword").value;

    const student =
      JSON.parse(localStorage.getItem(email));

    if (!student) {
      alert("Account not found!");
      return;
    }

    if (student.password !== password) {
      alert("Incorrect password!");
      return;
    }

    localStorage.setItem(
      "loggedInStudent",
      JSON.stringify(student)
    );

    alert(`Welcome ${student.fullname}`);

    window.location.href =
      "student-dashboard.html";
  });
}