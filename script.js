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
     MENU MOBILE
  ======================== */
  function initMobileMenu() {
    const toggleButton = document.querySelector('.nav-toggle');
    const nav = document.getElementById('nav-principal');
    if (!toggleButton || !nav) return;

    const focusableSelector = 'a, button, [tabindex]:not([tabindex="-1"])';
    let lastFocusedElement = null;

    const setMenuState = (isOpen) => {
      nav.classList.toggle('open', isOpen);
      toggleButton.classList.toggle('is-active', isOpen);
      document.body.classList.toggle('body--menu-open', isOpen);
      toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggleButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

      if (isOpen) {
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const firstFocusable = nav.querySelector(focusableSelector);
        if (firstFocusable instanceof HTMLElement) {
          firstFocusable.focus();
        }
      } else if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    };

    nav.setAttribute('aria-hidden', 'true');

    toggleButton.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      setMenuState(!isOpen);
    });

    nav.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Element && target.matches('a[href^="#"]')) {
        setMenuState(false);
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMenuState(false);
      }

      if (event.key !== 'Tab' || !nav.classList.contains('open')) return;

      const focusableItems = Array.from(nav.querySelectorAll(focusableSelector));
      if (!focusableItems.length) return;

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (!mobileMediaQuery.matches) {
        setMenuState(false);
      }
    });
  }

  /* ========================
     SCROLL SPY (nav-link ativo)
  ======================== */
  function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length) return;

    const setActiveLink = (id) => {
      navLinks.forEach((link) => {
        const targetId = link.getAttribute('href')?.replace('#', '');
        link.classList.toggle('active', targetId === id);
      });
    };

    const intersectionRatios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectionRatios.set(entry.target, entry.intersectionRatio);
          } else {
            intersectionRatios.delete(entry.target);
          }
        });

        if (!intersectionRatios.size) return;

        const mostVisible = Array.from(intersectionRatios.entries()).sort((a, b) => b[1] - a[1])[0];
        if (mostVisible && mostVisible[0]?.id) {
          setActiveLink(mostVisible[0].id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: '-30% 0px -50% 0px',
      }
    );

    sections.forEach((section) => observer.observe(section));
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
      let rafId = null;
      let latestEvent = null;

      const handleMove = (event) => {
        latestEvent = event;
        if (rafId) return;

        rafId = window.requestAnimationFrame(() => {
          if (!latestEvent) return;
          const rect = card.getBoundingClientRect();
          const x = latestEvent.clientX - rect.left;
          const y = latestEvent.clientY - rect.top;

          const rotateY = ((x / rect.width - 0.5) * 2 * maxRotation).toFixed(2);
          const rotateX = ((0.5 - y / rect.height) * 2 * maxRotation).toFixed(2);

          const rotations = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
          card.style.transform = baseTransform
            ? `${baseTransform} ${rotations}`
            : rotations;

          rafId = null;
        });
      };

      card.addEventListener('mousemove', handleMove);

      card.addEventListener('mouseleave', () => {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        latestEvent = null;
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
    initMobileMenu();
    initScrollSpy();
    initSmoothScrollLinks();
    initCardsTilt();
    initFooterYear();
  });
})();
