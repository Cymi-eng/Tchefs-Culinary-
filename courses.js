const coursesContainer = document.getElementById("coursesContainer");

fetch("courses.json")
  .then(response => response.json())
  .then(courses => {
    coursesContainer.innerHTML = ""; // clears loading state

    courses.forEach(course => {
      coursesContainer.innerHTML += `// Add more HTML without removing existing HTML
        <div class="course-card bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <div class="h-56 overflow-hidden">
            <img
              src="${course.image}"
              alt="${course.title}"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <div class="p-6 flex flex-col flex-1">
            <p class="text-xs text-accent font-semibold tracking-widest uppercase mb-2">${course.duration}</p>
            <h3 class="font-display text-lg font-bold text-primary leading-snug mb-3" style="font-family: 'Playfair Display', serif;">
              ${course.title}
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed flex-1">
              ${course.description}
            </p>
            <a
              href="admissions.html"
              class="mt-6 inline-block text-center bg-accent hover:bg-red-700 transition text-white text-sm font-semibold px-6 py-3 rounded-lg w-full"
            >
              Enroll Now
            </a>
          </div>
        </div>
      `;
    });
  })
  .catch(error => {
    coursesContainer.innerHTML = `
      <div class="col-span-4 text-center py-16">
        <p class="text-gray-400 text-sm">Unable to load courses at this time. Please try again later.</p>
      </div>
    `;
    console.error("Courses load error:", error);
  });