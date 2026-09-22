(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    nav?.classList.toggle('is-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    menuToggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    nav?.setAttribute('aria-hidden', String(!open));
    if (nav && 'inert' in nav) nav.inert = !open && window.innerWidth <= 900;
  };

  setMenu(false);
  if (menuToggle && !menuToggle.dataset.menuReady) {
    menuToggle.dataset.menuReady = 'true';
    menuToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (event) => {
    if (!body.classList.contains('menu-open')) return;
    if (nav?.contains(event.target) || menuToggle?.contains(event.target)) return;
    setMenu(false);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
    else if (nav && 'inert' in nav && !body.classList.contains('menu-open')) nav.inert = true;
  });
  window.addEventListener('pageshow', () => setMenu(false));

  const splitElement = (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node.parentElement?.closest('mark')) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }
        const outer = document.createElement('span');
        const inner = document.createElement('span');
        outer.className = 'split-word';
        inner.textContent = part;
        outer.appendChild(inner);
        fragment.appendChild(outer);
      });
      node.replaceWith(fragment);
    });
  };

  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach(splitElement);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .13, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('[data-reveal]').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    revealObserver.observe(element);
  });

  const splitObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-split-visible');
      splitObserver.unobserve(entry.target);
    });
  }, { threshold: .22 });
  splitTargets.forEach((element) => splitObserver.observe(element));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || !entry.target.id) return;
      nav?.querySelectorAll('a').forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-38% 0px -56% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

  const countUp = (element) => {
    const target = Number(element.dataset.count || 0);
    const start = performance.now();
    const duration = 1250;
    const tick = (now) => {
      const progress = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: .7 });
  document.querySelectorAll('[data-count]').forEach((counter) => counterObserver.observe(counter));

  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  const hero = document.querySelector('.hero');
  let ticking = false;

  const updateScroll = () => {
    ticking = false;
    const scrollTop = window.scrollY;
    const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    const pageProgress = clamp(scrollTop / maxScroll);
    const heroExit = hero ? clamp(scrollTop / Math.max(1, hero.offsetHeight)) : 0;

    root.style.setProperty('--page-progress', pageProgress.toFixed(4));
    root.style.setProperty('--hero-exit', heroExit.toFixed(4));
    header?.classList.toggle('is-scrolled', scrollTop > 35);

    if (!reducedMotion.matches) {
      const viewportCenter = window.innerHeight / 2;
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        const speed = Number(item.dataset.parallax || 0);
        const distance = rect.top + rect.height / 2 - viewportCenter;
        item.style.setProperty('--parallax-y', `${distance * speed}px`);
      });
    }
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScroll);
  };
  updateScroll();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);

  const track = document.querySelector('[data-testimonial-track]');
  const prev = document.querySelector('[data-slide="prev"]');
  const next = document.querySelector('[data-slide="next"]');
  let testimonialIndex = 0;

  const updateTestimonials = () => {
    if (!track || !track.firstElementChild) return;
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const visible = window.innerWidth <= 760 ? 1 : 2;
    const maxIndex = Math.max(0, track.children.length - visible);
    testimonialIndex = clamp(testimonialIndex, 0, maxIndex);
    track.style.transform = `translate3d(${-testimonialIndex * (card.getBoundingClientRect().width + gap)}px,0,0)`;
  };
  prev?.addEventListener('click', () => { testimonialIndex -= 1; updateTestimonials(); });
  next?.addEventListener('click', () => { testimonialIndex += 1; updateTestimonials(); });
  window.addEventListener('resize', updateTestimonials);

  const testimonialViewport = track?.parentElement;
  if (testimonialViewport) {
    let swipeStartX = 0;
    let swipeStartY = 0;
    testimonialViewport.addEventListener('touchstart', (event) => {
      swipeStartX = event.touches[0].clientX;
      swipeStartY = event.touches[0].clientY;
    }, { passive: true });
    testimonialViewport.addEventListener('touchend', (event) => {
      const point = event.changedTouches[0];
      const deltaX = point.clientX - swipeStartX;
      const deltaY = point.clientY - swipeStartY;
      if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      testimonialIndex += deltaX < 0 ? 1 : -1;
      updateTestimonials();
    }, { passive: true });
  }

  const horizontalSurfaces = document.querySelectorAll(
    '.service-grid,.case-story-steps,.carousel-strip,.ads-carousel-strip,.trabajos-carousel,.trabajos-project-layout,.video-intro-grid,.fashion-collage'
  );
  horizontalSurfaces.forEach((surface) => {
    if (surface.dataset.dragReady) return;
    surface.dataset.dragReady = 'true';
    surface.tabIndex = surface.tabIndex >= 0 ? surface.tabIndex : 0;
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    surface.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = surface.scrollLeft;
      moved = false;
      surface.classList.add('is-dragging');
      surface.setPointerCapture(pointerId);
    });
    surface.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      const delta = event.clientX - startX;
      moved ||= Math.abs(delta) > 5;
      surface.scrollLeft = startScroll - delta;
      if (moved) event.preventDefault();
    });
    const release = (event) => {
      if (event.pointerId !== pointerId) return;
      surface.classList.remove('is-dragging');
      pointerId = null;
    };
    surface.addEventListener('pointerup', release);
    surface.addEventListener('pointercancel', release);
    surface.addEventListener('click', (event) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }, true);
  });

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio > .3) video.play().catch(() => {});
      else video.pause();
    });
  }, { threshold: [0, .3, .7] });
  document.querySelectorAll('video').forEach((video) => videoObserver.observe(video));

  document.querySelectorAll('[data-reveal="stick"],[data-reveal="pop"]').forEach((el) => {
    el.addEventListener('animationend', () => el.classList.add('mf-settled'), { once: true });
  });

  document.querySelectorAll('.mf-cycle').forEach((el) => {
    const words = (el.dataset.words || '').split('|').filter(Boolean);
    const wordEl = el.querySelector('.mf-cycle-word');
    if (!wordEl || words.length < 2) return;
    const cycleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        cycleObserver.unobserve(el);
        let i = 0;
        const step = () => {
          i += 1;
          if (i >= words.length) return;
          wordEl.classList.add('is-swapping');
          setTimeout(() => {
            wordEl.textContent = words[i];
            wordEl.classList.remove('is-swapping');
            setTimeout(step, 480);
          }, 220);
        };
        setTimeout(step, 2500);
      });
    }, { threshold: .6 });
    cycleObserver.observe(el);
  });

  const astronautRig = document.querySelector('.astronaut-rig');
  const scrollAstronaut = document.querySelector('.scroll-astronaut');

  if (astronautRig && scrollAstronaut) {
    const moveScrollAstronaut = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(window.scrollY / maxScroll);
      const headerHeight = header ? header.offsetHeight : 88;
      const astronautHeight = scrollAstronaut.offsetHeight || 180;
      const travel = Math.max(120, window.innerHeight - headerHeight - astronautHeight - 42);
      const y = progress * travel;

      astronautRig.style.setProperty('--astronaut-start', `${headerHeight}px`);
      astronautRig.style.setProperty('--astronaut-y', `${y}px`);
      astronautRig.style.setProperty('--astronaut-rope', `${y + 42}px`);
    };

    moveScrollAstronaut();
    window.addEventListener('scroll', moveScrollAstronaut, { passive: true });
    window.addEventListener('resize', moveScrollAstronaut);
  }

  document.querySelectorAll('.outline-button,.nav-contact,.text-link').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches || event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      button.style.translate = `${(event.clientX - rect.left - rect.width / 2) * .08}px ${(event.clientY - rect.top - rect.height / 2) * .12}px`;
    });
    button.addEventListener('pointerleave', () => { button.style.translate = ''; });
  });
})();
