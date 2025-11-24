(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initScrollReveal() {
    const animatedElements = document.querySelectorAll('.animation-on-scroll');
    if (!animatedElements.length) return;

    if (prefersReducedMotion) {
      animatedElements.forEach((el) => el.classList.add('visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
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
      if (window.scrollY > 10) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
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
      .filter((section) => !!section);

    if (!sections.length) return;

    const setActiveLink = (id) => {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const targetId = href ? href.replace('#', '') : '';
        if (targetId === id) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveLink(entry.target.id);
            }
          });
        },
        {
          threshold: 0.35,
          rootMargin: '-30% 0px -45% 0px',
        }
      );

      sections.forEach((section) => observer.observe(section));
    } else {
      const handleScroll = () => {
        let closestSection = sections[0];
        let closestOffset = Number.NEGATIVE_INFINITY;

        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5 && rect.top > closestOffset) {
            closestOffset = rect.top;
            closestSection = section;
          }
        });

        if (closestSection) {
          setActiveLink(closestSection.id);
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
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
    const body = document.body;
    const navLinks = document.querySelectorAll('.nav-link');

    if (!menuToggle || !navMenu) return;

    const setMenuState = (isOpen) => {
      navMenu.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (body) {
        body.classList.toggle('body--menu-open', isOpen);
      }
    };

    const closeMenu = () => setMenuState(false);

    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (body) {
        body.classList.toggle('body--menu-open', isOpen);
      }
    });

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
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateY = ((x / rect.width - 0.5) * 2 * maxRotation).toFixed(2);
        const rotateX = ((0.5 - y / rect.height) * 2 * maxRotation).toFixed(2);

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
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

