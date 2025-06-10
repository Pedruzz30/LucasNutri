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