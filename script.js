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
    floatingWhatsApp: {
      controller: null,
      init() {
        const btn = utils.qs('.whatsapp-float');
        if (!btn) return;

        const controller = utils.createAbortController();
        const toggle = () => {
          btn.classList.toggle('visible', window.scrollY > 200);
        };

        window.addEventListener('scroll', toggle, { passive: true, signal: controller.signal });
        toggle();
        this.controller = controller;
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
      },
    },

    animatedCounter: {
      observer: null,
      init() {
        const counters = utils.qsa('[data-target]');
        if (!counters.length) return;

        if (state.prefersReducedMotion.matches || !utils.supportsIntersectionObserver()) {
          counters.forEach((el) => {
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            el.textContent = prefix + el.dataset.target + suffix;
          });
          return;
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target;
              const target = parseInt(el.dataset.target, 10);
              const prefix = el.dataset.prefix || '';
              const suffix = el.dataset.suffix || '';
              const duration = 1500;
              const start = performance.now();

              const step = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                el.textContent = prefix + current + suffix;
                if (progress < 1) requestAnimationFrame(step);
              };

              requestAnimationFrame(step);
              this.observer.unobserve(el);
            });
          },
          { threshold: 0.5 }
        );

        counters.forEach((el) => this.observer.observe(el));
      },
    },

    staggerReveal: {
      observer: null,
      init() {
        const containers = utils.qsa('[data-stagger]');
        if (!containers.length || !utils.supportsIntersectionObserver()) return;

        if (state.prefersReducedMotion.matches) {
          containers.forEach((container) => {
            utils.qsa('.stagger-item', container).forEach((el) => el.classList.add('visible'));
          });
          return;
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              utils.qsa('.stagger-item', entry.target).forEach((el) => el.classList.add('visible'));
              this.observer.unobserve(entry.target);
            });
          },
          { threshold: 0.08 }
        );

        containers.forEach((container) => this.observer.observe(container));
      },
    },

    cookieBanner: {
      init() {
        if (localStorage.getItem('cookiesAccepted')) return;

        const banner = utils.qs('#cookie-banner');
        if (!banner) return;

        setTimeout(() => banner.classList.add('show'), 1800);

        const btn = utils.qs('#cookie-accept');
        if (!btn) return;

        btn.addEventListener('click', () => {
          localStorage.setItem('cookiesAccepted', '1');
          banner.classList.remove('show');
          setTimeout(() => banner.remove(), 450);
        });
      },
    },

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
        const overlay = utils.qs('.nav-overlay');
        const closeButton = utils.qs('.nav-close');
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
          if (overlay) {
            overlay.classList.toggle('open', isOpen);
            overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
          }

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

        if (closeButton) {
          closeButton.addEventListener(
            'click',
            () => setMenuState(false),
            { signal: controller.signal }
          );
        }

        if (overlay) {
          overlay.addEventListener(
            'click',
            () => setMenuState(false),
            { signal: controller.signal }
          );
        }

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

    footerYear: {
      init() {
        const yearEl = utils.qs('#year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
      },
    },

    igTyping: {
      init() {
        const el = utils.qs('#ig-typing');
        if (!el) return;

        const fullText = el.textContent.trim();

        if (state.prefersReducedMotion.matches) return;

        el.textContent = '';

        const pause  = ms => new Promise(res => setTimeout(res, ms));
        const rand   = (min, max) => Math.random() * (max - min) + min;

        const charDelay = char => {
          let ms = rand(55, 110);
          if (char === '@') ms += rand(80, 150);
          if (char === '.') ms += rand(60, 120);
          return ms;
        };

        const loop = async () => {
          // type
          el.classList.add('typing');
          await pause(400);

          for (const char of fullText) {
            el.textContent += char;
            await pause(charDelay(char));
          }

          // idle
          el.classList.replace('typing', 'done');
          await pause(2800);

          // erase
          el.classList.replace('done', 'typing');
          while (el.textContent.length > 0) {
            el.textContent = el.textContent.slice(0, -1);
            await pause(rand(35, 60));
          }

          await pause(500);
          loop();
        };

        loop();
      },
    },
  };

  const mediaListeners = {
    init() {
      state.prefersReducedMotion.addEventListener('change', () => {
        features.scrollReveal.refresh();
      });

      state.mobileMediaQuery.addEventListener('change', () => {
        features.scrollReveal.refresh();
      });
    },
  };

  const app = {
    init() {
      features.floatingWhatsApp.init();
      features.animatedCounter.init();
      features.staggerReveal.init();
      features.cookieBanner.init();
      features.scrollReveal.init();
      features.headerScrollState.init();
      features.mobileMenu.init();
      features.scrollSpy.init();
      features.smoothScroll.init();
      features.footerYear.init();
      features.igTyping.init();
      mediaListeners.init();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
})();