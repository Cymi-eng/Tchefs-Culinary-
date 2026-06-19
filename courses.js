const coursesContainer =
document.getElementById("coursesContainer");

fetch("courses.json")
  .then(response => response.json())
  .then(courses => {

    courses.forEach(course => {

      coursesContainer.innerHTML += `

      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">

        <img
        src="${course.image}"
        alt="${course.title}"
        class="w-full h-56 object-cover">

        <div class="p-6">

          <h3 class="text-xl font-bold text-primary">
            ${course.title}
          </h3>

          <p class="text-accent mt-2">
            Duration: ${course.duration}
          </p>

          <p class="text-gray-600 mt-4">
            ${course.description}
          </p>

          <button
          class="mt-6 bg-primary text-white px-6 py-3 rounded-lg w-full">

          Enroll Now

          </button>

        </div>

      </div>

      `;

    });

  })
  .catch(error => {
    console.log(error);
  });