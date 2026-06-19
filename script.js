 const menuBtn = document.getElementById('menuBtn');
      const mobileMenu = document.getElementById('mobileMenu');
      menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));

      const scrollBtn = document.getElementById('scrollTop');
      window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
        scrollBtn.style.alignItems = 'center';
        scrollBtn.style.justifyContent = 'center';
      });
      scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

      function handleSubmit(e) {
        e.preventDefault();
        e.target.style.display = 'none';
        document.getElementById('successMsg').classList.remove('hidden');
      }