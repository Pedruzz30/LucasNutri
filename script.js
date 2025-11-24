(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMediaQuery = window.matchMedia('(max-width: 768px)');

  /* ========================
     SCROLL REVEAL
  ======================== */
  function initScrollReveal() {
    const animatedElements = document.querySelectorAll('.animation-on-scroll');
    if (!animatedElements.length) return;

    const isMobile = mobileMediaQuery.matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      animatedElements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: isMobile ? 0.08 : 0.15,
        rootMargin: isMobile ? '0px 0px -10% 0px' : '0px 0px -5% 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }

  /* ========================
     HEADER SCROLLED STATE
  ======================== */
  function initHeaderScrollState() {
    const header = document.querySelector('.header-minimal');
    if (!header) return;

    const toggleHeaderState = () => {
      header.classList.toggle('header-scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', toggleHeaderState, { passive: true });
    toggleHeaderState();
  }

  /* ========================
     SCROLL SPY (nav-link ativo)
  ======================== */
  function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    if (!navLinks.length) return;

    const sectionIds = ['sobre', 'consultoria', 'servicos', 'o-que-ele-faz', 'contato'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const setActiveLink = (id) => {
      navLinks.forEach((link) => {
        const targetId = link.getAttribute('href')?.replace('#', '');
        link.classList.toggle('active', targetId === id);
      });
    };

    let ticking = false;

    const updateActiveSection = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const referenceY = window.innerHeight * 0.3;
        let activeSection = sections[0];
        let foundInView = false;
        let lastPassed = null;
        let lastPassedTop = -Infinity;
        let upcoming = null;

        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          const inView = rect.top <= referenceY && rect.bottom >= referenceY;

          if (inView && !foundInView) {
            activeSection = section;
            foundInView = true;
            return;
          }

          if (!foundInView && rect.top <= referenceY && rect.top > lastPassedTop) {
            lastPassedTop = rect.top;
            lastPassed = section;
          }

          if (!foundInView && !upcoming && rect.top > referenceY) {
            upcoming = section;
          }
        });

        if (!foundInView) {
          activeSection = lastPassed || upcoming || sections[0];
        }

        setActiveLink(activeSection.id);
        ticking = false;
      });
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    updateActiveSection();
  }

  /* ========================
     SMOOTH SCROLL
  ======================== */
  function initSmoothScrollLinks() {
    const links = document.querySelectorAll('a.nav-link[href^="#"], footer a[href^="#"]');
    if (!links.length) return;

    const scrollOptions = prefersReducedMotion ? {} : { behavior: 'smooth' };

    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView(scrollOptions);
      });
    });
  }

  /* ========================
     3D TILT NOS CARDS
  ======================== */
  function initCardsTilt() {
    if (prefersReducedMotion || window.innerWidth <= 900) return;

    const cards = document.querySelectorAll('.what-i-do-animated .card');
    if (!cards.length) return;

    const maxRotation = 8;

    cards.forEach((card) => {
      const computed = window.getComputedStyle(card).getPropertyValue('transform');
      const baseTransform = computed && computed !== 'none' ? computed : '';

      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width - 0.5) * 2 * maxRotation).toFixed(2);
        const rotateX = ((0.5 - y / rect.height) * 2 * maxRotation).toFixed(2);

        const rotations = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.transform = baseTransform
          ? `${baseTransform} ${rotations}`
          : rotations;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = baseTransform || 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ========================
     FOOTER YEAR
  ======================== */
  function initFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ========================
     DOM READY
  ======================== */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initHeaderScrollState();
    initScrollSpy();
    initSmoothScrollLinks();
    initCardsTilt();
    initFooterYear();
  });
})();
