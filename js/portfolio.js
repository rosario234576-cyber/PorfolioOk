(() => {
  'use strict';
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold: .06});
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    root.classList.add('motion-ready');
  }
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#portfolio-menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', event => {if (!event.target.closest('.portfolio-header')) setMenu(false);});
  matchMedia('(min-width: 601px)').addEventListener('change', event => {if (event.matches) setMenu(false);});
  const cards = [...document.querySelectorAll('.project-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) { count++; card.classList.add('is-visible'); }
    });
    document.querySelector('.project-grid').classList.toggle('is-filtered', filter !== 'all');
    document.querySelector('.project-count').textContent = `${count} ${count === 1 ? 'proyecto' : 'proyectos'}`;
  }));
  let scheduled = false;
  const updateProgress = () => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--reading', max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
    scheduled = false;
  };
  const schedule = () => {if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }};
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  updateProgress();
  const video = document.querySelector('#showreel');
  document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause();});
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    entries.forEach(entry => {if (!entry.isIntersecting) video.pause();});
  }).observe(video);
  if ('IntersectionObserver' in window) {
    const links = [...menu.querySelectorAll('a[href^="#"]')];
    const active = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      });
    }, {rootMargin:'-15% 0px -65% 0px'});
    links.forEach(link => {const target = document.querySelector(link.hash); if (target) active.observe(target);});
  }
})();
