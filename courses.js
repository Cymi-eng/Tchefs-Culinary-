const coursesContainer = document.getElementById("coursesContainer");

fetch("courses.json")
  .then((response) => response.json())
  .then((courses) => {
    courses.forEach((course) => {
      coursesContainer.innerHTML += `
      
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300">

        <img
          src="${course.image}"
          alt="${course.title}"
          class="w-full h-56 object-cover"
        >

        <div class="p-6">

          <h3 class="text-2xl font-bold text-primary">
            ${course.title}
          </h3>

          <p class="text-gray-600 mt-3">
            ${course.description}
          </p>

          <div class="mt-6 flex justify-between items-center">

            <span class="bg-primary text-white px-4 py-2 rounded-full text-sm">
              ${course.duration}
            </span>

            <button
              class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Enroll
            </button>

          </div>

        </div>

      </div>

      `;
    });
  })
  .catch((error) => {
    coursesContainer.innerHTML = `
      <p class="text-red-500 text-center col-span-full">
        Failed to load courses.
      </p>
    `;
    console.error(error);
  });
