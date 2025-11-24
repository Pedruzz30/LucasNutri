(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initScrollReveal() {
    const animatedElements = document.querySelectorAll('.animation-on-scroll');
    if (!animatedElements.length) return;

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
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px',
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  }

  function initHeaderScrollState() {
    const header = document.querySelector('.header-minimal');
    if (!header) return;

    const toggleHeaderState = () => {
      header.classList.toggle('header-scrolled', window.scrollY > 10);
    };

    window.addEventListener('scroll', toggleHeaderState, { passive: true });
    toggleHeaderState();
  }

  function initScrollSpy() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    if (!navLinks.length) return;

    const sectionIds = ['sobre', 'consultoria', 'servicos', 'o-que-ele-faz', 'contato'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

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

  function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-minimal');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    if (!menuToggle || !navMenu) return;

    const setMenuState = (isOpen) => {
      navMenu.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      body.classList.toggle('body--menu-open', isOpen);
    };

    const toggleMenu = () => {
      const isOpen = !navMenu.classList.contains('open');
      setMenuState(isOpen);
    };

    const closeMenu = () => setMenuState(false);

    menuToggle.addEventListener('click', toggleMenu);

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('open')) {
          closeMenu();
        }
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  function initCardsTilt() {
    if (prefersReducedMotion || window.innerWidth <= 900) return;

    const cards = document.querySelectorAll('.what-i-do-animated .card');
    if (!cards.length) return;

    const maxRotation = 8;

    cards.forEach((card) => {
      const baseTransform = card.style.transform || window.getComputedStyle(card).getPropertyValue('transform');

      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width - 0.5) * 2 * maxRotation).toFixed(2);
        const rotateX = ((0.5 - y / rect.height) * 2 * maxRotation).toFixed(2);

        const rotations = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.transform = baseTransform && baseTransform !== 'none' ? `${baseTransform} ${rotations}` : rotations;
      });

      card.addEventListener('mouseleave', () => {
        if (baseTransform && baseTransform !== 'none') {
          card.style.transform = baseTransform;
        } else {
          card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
      });
    });
  }

  function initFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initHeaderScrollState();
    initScrollSpy();
    initSmoothScrollLinks();
    initMobileMenu();
    initCardsTilt();
    initFooterYear();
  });
})();

