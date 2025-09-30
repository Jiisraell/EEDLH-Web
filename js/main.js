// Inicializar AOS
AOS.init({
  once: true,
  duration: 800,
  easing: 'ease-in-out',
});

// Scroll suave para enlaces internos (hash)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
