// MOBILE MENU

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ACTIVE NAVIGATION LINK

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll("nav a").forEach((link) => {
  const href = link.getAttribute("href");

  if (href === currentPage) {
    link.classList.add("text-accent", "font-bold");
  }
});

// SCROLL TO TOP BUTTON

const scrollBtn = document.getElementById("scrollTop");

if (scrollBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.remove("hidden");
    } else {
      scrollBtn.classList.add("hidden");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

//Sticky Navbar 
const navbar = document.querySelector("nav");

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("shadow-xl");
  } else {
    navbar.classList.remove("shadow-xl");
  }
});
// contact form
const form = document.querySelector("form");

form.addEventListener("submit", (e) => {
  const email = form.email.value;

  if (!email.includes("@")) {
    e.preventDefault();
    alert("Please enter a valid email.");
  }
});