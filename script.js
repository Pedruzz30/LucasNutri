const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const header = document.getElementById('header');

// 1. Adicione o controle de estado do menu
let isMenuOpen = false;

// 2. Modifique seu event listener do menu para incluir acessibilidade
menuToggle.addEventListener('click', () => {
  isMenuOpen = !isMenuOpen;
  menuToggle.classList.toggle('active');
  nav.classList.toggle('active');
  
  // Novos recursos adicionados:
  document.body.style.overflow = isMenuOpen ? 'hidden' : '';
  menuToggle.setAttribute('aria-expanded', isMenuOpen);
});

// 3. Adicione o fechamento automático do menu ao clicar em links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (isMenuOpen) {
      menuToggle.click(); // Dispara o clique para fechar o menu
    }
  });
});

// 4. Otimize o evento de scroll (substitua o existente)
let isScrolling;
window.addEventListener('scroll', () => {
  window.clearTimeout(isScrolling);
  isScrolling = setTimeout(() => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, 50);
}, { passive: true });

// Isso serve para atualizar o ano do rodapé automaticamente
document.getElementById('year').textContent = new Date().getFullYear();

// animation on scroll (Animação para o scroll)
document.addEventListener('DOMContentLoaded', () => {
  const animatables = document.querySelectorAll('.section-minimal, .service-item, .card');
  animatables.forEach(el => el.classList.add('animate-on-scroll'));

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animatables.forEach(el => observer.observe(el));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
      if (isMenuOpen) {
        menuToggle.click();
      }
    });
  });
});