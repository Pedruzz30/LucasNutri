// Highlight navigation links based on scroll position

// Cache all section elements with an id and the nav links
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

// Remove active class from all links
function clearActive() {
  navLinks.forEach(link => link.classList.remove('active'));
}

// Observe sections to update active link on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      clearActive();
      const current = document.querySelector(`.nav-link[href="#${id}"]`);
      if (current) current.classList.add('active');
    }
  });
}, { threshold: 0.6 });

sections.forEach(section => observer.observe(section));

// Smooth scroll for in-page links
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      clearActive();
      link.classList.add('active');
    }
  });
});

const animatedElements = document.querySelectorAll('.animation-on-scroll');

const animationObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animationObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

animatedElements.forEach(el => animationObserver.observe(el));

// Alterna a navegação em telas pequenas
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-minimal');
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
}

// Atualiza o ano do rodapé automaticamente
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

