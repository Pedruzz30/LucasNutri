(() => {
  const state = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    mobileMediaQuery: window.matchMedia('(max-width: 1024px)'),
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

    heroMotion: {
      controller: null,
      frameId: null,
      hero: null,
      visibilityObserver: null,
      init() {
        const hero = utils.qs('[data-hero]');
        if (!hero) return;

        this.hero = hero;

        if (state.prefersReducedMotion.matches) {
          this.reset();
          return;
        }

        const controller = utils.createAbortController();
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let isHeroVisible = true;

        const render = () => {
          currentX += (targetX - currentX) * 0.09;
          currentY += (targetY - currentY) * 0.09;

          const rect = hero.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height, 1)));
          const visualY = currentY + progress * 18;

          hero.style.setProperty('--hero-visual-x', `${currentX.toFixed(2)}px`);
          hero.style.setProperty('--hero-visual-y', `${visualY.toFixed(2)}px`);
          hero.style.setProperty('--hero-word-y', `${(-progress * 24).toFixed(2)}px`);

          const stillMoving =
            Math.abs(targetX - currentX) > 0.05 ||
            Math.abs(targetY - currentY) > 0.05;

          this.frameId = stillMoving ? requestAnimationFrame(render) : null;
        };

        const queueRender = () => {
          if (this.frameId === null) {
            this.frameId = requestAnimationFrame(render);
          }
        };

        const queueVisibleRender = () => {
          if (isHeroVisible) queueRender();
        };

        if (finePointer.matches) {
          hero.addEventListener(
            'pointermove',
            (event) => {
              const bounds = hero.getBoundingClientRect();
              const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
              const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
              targetX = normalizedX * 18;
              targetY = normalizedY * 12;
              queueRender();
            },
            { passive: true, signal: controller.signal }
          );

          hero.addEventListener(
            'pointerleave',
            () => {
              targetX = 0;
              targetY = 0;
              queueRender();
            },
            { signal: controller.signal }
          );
        }

        if (utils.supportsIntersectionObserver()) {
          this.visibilityObserver = new IntersectionObserver(
            ([entry]) => {
              isHeroVisible = Boolean(entry?.isIntersecting);
              if (isHeroVisible) queueRender();
            },
            { threshold: 0 }
          );
          this.visibilityObserver.observe(hero);
        }

        window.addEventListener('scroll', queueVisibleRender, {
          passive: true,
          signal: controller.signal,
        });
        window.addEventListener('resize', queueRender, {
          passive: true,
          signal: controller.signal,
        });

        this.controller = controller;
        queueRender();
      },
      reset() {
        if (!this.hero) return;
        this.hero.style.removeProperty('--hero-visual-x');
        this.hero.style.removeProperty('--hero-visual-y');
        this.hero.style.removeProperty('--hero-word-y');
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
        if (this.frameId !== null) {
          cancelAnimationFrame(this.frameId);
          this.frameId = null;
        }
        if (this.visibilityObserver) {
          this.visibilityObserver.disconnect();
          this.visibilityObserver = null;
        }
        this.reset();
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

        const setMenuState = (isOpen, restoreFocus = true) => {
          const isMobile = state.mobileMediaQuery.matches;
          const shouldOpen = isMobile && isOpen;

          nav.classList.toggle('open', shouldOpen);
          toggleButton.classList.toggle('is-active', shouldOpen);
          document.body.classList.toggle('body--menu-open', shouldOpen);
          toggleButton.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
          toggleButton.setAttribute('aria-label', shouldOpen ? 'Fechar menu' : 'Abrir menu');

          if (isMobile) {
            nav.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
          } else {
            nav.removeAttribute('aria-hidden');
          }

          if (overlay) {
            overlay.classList.toggle('open', shouldOpen);
            overlay.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
          }

          if (shouldOpen) {
            lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const focusableItems = utils.getFocusableElements(nav);
            if (focusableItems[0]) focusableItems[0].focus();
          } else if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
          }
        };

        setMenuState(false, false);

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
            if (!state.mobileMediaQuery.matches || !nav.classList.contains('open')) {
              setMenuState(false, false);
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
      controller: null,
      targets: [],
      ticking: false,
      init() {
        const navLinks = utils.qsa('.nav-link[href^="#"]');
        if (!navLinks.length) return;

        this.targets = navLinks
          .map((link) => {
            const id = link.getAttribute('href').slice(1);
            const section = id ? document.getElementById(id) : null;
            return section ? { id, section, link } : null;
          })
          .filter(Boolean)
          .sort((a, b) =>
            a.section.compareDocumentPosition(b.section) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
          );

        if (!this.targets.length) return;

        const controller = utils.createAbortController();
        this.controller = controller;

        const update = () => {
          this.ticking = false;

          // Linha de leitura logo abaixo do header fixo. A comparacao e por
          // posicao, nao por area: com intersectionRatio, qualquer secao mais
          // alta que a viewport nunca alcancava o threshold e nunca acendia.
          const line = utils.getHeaderOffset() + window.innerHeight * 0.25;

          // Vence a ultima secao que ja comecou acima da linha.
          let activeId = null;
          this.targets.forEach(({ id, section }) => {
            if (section.getBoundingClientRect().top <= line) activeId = id;
          });

          this.targets.forEach(({ id, link }) => {
            link.classList.toggle('active', id === activeId);
          });
        };

        const onScroll = () => {
          if (this.ticking) return;
          this.ticking = true;
          window.requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true, signal: controller.signal });
        window.addEventListener('resize', onScroll, { signal: controller.signal });
        update();
      },
      refresh() {
        this.destroy();
        this.init();
      },
      destroy() {
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
        this.targets = [];
      },
    },

    smoothScroll: {
      controller: null,
      init() {
        const links = utils.qsa(
          'a.nav-link[href^="#"], footer a[href^="#"], .logo-container[href^="#"]'
        );
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
        features.heroMotion.destroy();
        features.heroMotion.init();
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
      features.heroMotion.init();
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
