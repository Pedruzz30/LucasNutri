(() => {
  const state = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    mobileMediaQuery: window.matchMedia('(max-width: 768px)'),
  };

  const utils = {
    qs(selector, scope = document) {
      return scope.querySelector(selector);
    },
    qsa(selector, scope = document) {
      return Array.from(scope.querySelectorAll(selector));
    },
    isHTMLElement(value) {
      return value instanceof HTMLElement;
    },
    getHeaderOffset() {
      const header = utils.qs('.header-minimal');
      return header ? header.offsetHeight : 0;
    },
    getFocusableElements(container) {
      const selector = 'a, button, [tabindex]:not([tabindex="-1"])';
      return utils.qsa(selector, container).filter((el) => !el.hasAttribute('disabled'));
    },
    supportsIntersectionObserver() {
      return 'IntersectionObserver' in window;
    },
    scrollToTarget(target) {
      const offset = utils.getHeaderOffset();
      const top = target.getBoundingClientRect().top + window.scrollY - offset - 12;
      window.scrollTo({
        top,
        behavior: state.prefersReducedMotion.matches ? 'auto' : 'smooth',
      });
    },
    createAbortController() {
      return new AbortController();
    },
  };

  const features = {
    scrollReveal: {
      observer: null,
      init() {
        const animatedElements = utils.qsa('.animation-on-scroll');
        if (!animatedElements.length) return;

        if (state.prefersReducedMotion.matches || !utils.supportsIntersectionObserver()) {
          animatedElements.forEach((el) => el.classList.add('visible'));
          return;
        }

        const isMobile = state.mobileMediaQuery.matches;

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                this.observer.unobserve(entry.target);
              }
            });
          },
          {
            threshold: isMobile ? 0.08 : 0.15,
            rootMargin: isMobile ? '0px 0px -10% 0px' : '0px 0px -5% 0px',
          }
        );

        animatedElements.forEach((el) => this.observer.observe(el));
      },
      refresh() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.init();
      },
    },

    headerScrollState: {
      controller: null,
      init() {
        const header = utils.qs('.header-minimal');
        if (!header) return;

        const controller = utils.createAbortController();
        const toggleHeaderState = () => {
          header.classList.toggle('header-scrolled', window.scrollY > 10);
        };

        window.addEventListener('scroll', toggleHeaderState, { passive: true, signal: controller.signal });
        toggleHeaderState();
        this.controller = controller;
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
      },
    },

    mobileMenu: {
      controller: null,
      init() {
        const toggleButton = utils.qs('.nav-toggle');
        const nav = utils.qs('#nav-principal');
        if (!toggleButton || !nav) return;

        const controller = utils.createAbortController();
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
            const focusableItems = utils.getFocusableElements(nav);
            if (focusableItems[0]) focusableItems[0].focus();
          } else if (lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus();
          }
        };

        nav.setAttribute('aria-hidden', 'true');

        toggleButton.addEventListener(
          'click',
          () => {
            const isOpen = nav.classList.contains('open');
            setMenuState(!isOpen);
          },
          { signal: controller.signal }
        );

        nav.addEventListener(
          'click',
          (event) => {
            const target = event.target;
            if (target instanceof Element && target.matches('a[href^="#"]')) {
              setMenuState(false);
            }
          },
          { signal: controller.signal }
        );

        document.addEventListener(
          'click',
          (event) => {
            if (!nav.classList.contains('open')) return;
            if (nav.contains(event.target) || toggleButton.contains(event.target)) return;
            setMenuState(false);
          },
          { signal: controller.signal }
        );

        window.addEventListener(
          'keydown',
          (event) => {
            if (event.key === 'Escape') {
              setMenuState(false);
              return;
            }

            if (event.key !== 'Tab' || !nav.classList.contains('open')) return;

            const focusableItems = utils.getFocusableElements(nav);
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
          },
          { signal: controller.signal }
        );

        window.addEventListener(
          'resize',
          () => {
            if (!state.mobileMediaQuery.matches) {
              setMenuState(false);
            }
          },
          { signal: controller.signal }
        );

        this.controller = controller;
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
      },
    },

    scrollSpy: {
      observer: null,
      init() {
        const navLinks = utils.qsa('.nav-link[href^="#"]');
        if (!navLinks.length || !utils.supportsIntersectionObserver()) return;

        const sections = navLinks
          .map((link) => utils.qs(link.getAttribute('href')))
          .filter(Boolean);

        if (!sections.length) return;

        const setActiveLink = (id) => {
          navLinks.forEach((link) => {
            const targetId = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('active', targetId === id);
          });
        };

        this.observer = new IntersectionObserver(
          (entries) => {
            let mostVisible = null;
            let highestRatio = 0;

            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio >= highestRatio) {
                highestRatio = entry.intersectionRatio;
                mostVisible = entry.target;
              }
            });

            if (mostVisible?.id) {
              setActiveLink(mostVisible.id);
            }
          },
          {
            threshold: [0.2, 0.4, 0.6],
            rootMargin: '-30% 0px -50% 0px',
          }
        );

        sections.forEach((section) => this.observer.observe(section));
      },
      refresh() {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.init();
      },
    },

    smoothScroll: {
      controller: null,
      init() {
        const links = utils.qsa('a.nav-link[href^="#"], footer a[href^="#"]');
        if (!links.length) return;

        const controller = utils.createAbortController();

        links.forEach((link) => {
          link.addEventListener(
            'click',
            (event) => {
              const href = link.getAttribute('href');
              if (!href || href === '#') return;

              const target = utils.qs(href);
              if (!target) return;

              event.preventDefault();
              utils.scrollToTarget(target);
            },
            { signal: controller.signal }
          );
        });

        this.controller = controller;
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
      },
    },

    cardsTilt: {
      controllers: [],
      init() {
        if (state.prefersReducedMotion.matches || window.innerWidth <= 900) return;

        const cards = utils.qsa('.what-i-do-animated .card');
        if (!cards.length) return;

        const maxRotation = 8;

        cards.forEach((card) => {
          const controller = utils.createAbortController();
          const computed = window.getComputedStyle(card).getPropertyValue('transform');
          const baseTransform = computed && computed !== 'none' ? computed : '';
          let rafId = null;
          let rect = card.getBoundingClientRect();

          const updateRect = () => {
            rect = card.getBoundingClientRect();
          };

          const handleMove = (event) => {
            if (rafId) return;

            rafId = window.requestAnimationFrame(() => {
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;

              const rotateY = ((x / rect.width - 0.5) * 2 * maxRotation).toFixed(2);
              const rotateX = ((0.5 - y / rect.height) * 2 * maxRotation).toFixed(2);

              const rotations = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
              card.style.transform = baseTransform ? `${baseTransform} ${rotations}` : rotations;

              rafId = null;
            });
          };

          card.addEventListener('mouseenter', updateRect, { signal: controller.signal });
          card.addEventListener('mousemove', handleMove, { signal: controller.signal });
          window.addEventListener('resize', updateRect, { signal: controller.signal });

          card.addEventListener(
            'mouseleave',
            () => {
              if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
              }
              card.style.transform = baseTransform || 'rotateX(0deg) rotateY(0deg)';
            },
            { signal: controller.signal }
          );

          this.controllers.push(controller);
        });
      },
      destroy() {
        this.controllers.forEach((controller) => controller.abort());
        this.controllers = [];
      },
      refresh() {
        this.destroy();
        this.init();
      },
    },

    footerYear: {
      init() {
        const yearEl = utils.qs('#year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
      },
    },
  };

  const mediaListeners = {
    init() {
      state.prefersReducedMotion.addEventListener('change', () => {
        features.scrollReveal.refresh();
        features.cardsTilt.refresh();
      });

      state.mobileMediaQuery.addEventListener('change', () => {
        features.scrollReveal.refresh();
      });
    },
  };

  const app = {
    init() {
      features.scrollReveal.init();
      features.headerScrollState.init();
      features.mobileMenu.init();
      features.scrollSpy.init();
      features.smoothScroll.init();
      features.cardsTilt.init();
      features.footerYear.init();
      mediaListeners.init();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
})();