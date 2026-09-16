(() => {
  'use strict';
  const cover = document.querySelector('.cover-home');
  if (!cover) return;
  const slides = [...cover.querySelectorAll('[data-cover-slide]')];
  const dots = [...cover.querySelectorAll('[data-cover-index]')];
  let current = 0;
  let timer;
  let coverVisible = true;
  const showcase = cover.querySelector('.cover-showcase');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stop = () => { window.clearTimeout(timer); cover.classList.add('is-paused'); };
  const schedule = () => {
    window.clearTimeout(timer);
    if (reducedMotion.matches || document.hidden || !coverVisible || showcase.matches(':hover') || showcase.contains(document.activeElement)) return;
    cover.classList.remove('is-paused');
    timer = window.setTimeout(() => show(current + 1), 7000);
  };
  const show = index => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.toggle('is-entering', i === current);
      if (i === current) slide.querySelector('img').loading = 'eager';
    });
    dots.forEach((dot,i) => dot.setAttribute('aria-pressed', String(i === current)));
    cover.querySelector('.cover-counter').textContent = `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    schedule();
  };
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.coverIndex))));
  cover.querySelectorAll('[data-cover-step]').forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.coverStep))));
  cover.querySelector('.cover-showcase').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const focusWasOnSlide = slides.some(slide => slide.contains(document.activeElement));
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
    if (focusWasOnSlide) slides[current].focus({preventScroll:true});
  });
  cover.querySelector('.cover-controls').hidden = false;
  showcase.addEventListener('mouseenter', stop);
  showcase.addEventListener('mouseleave', schedule);
  showcase.addEventListener('focusin', stop);
  showcase.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : schedule());
  reducedMotion.addEventListener('change', schedule);
  slides[0].classList.add('is-entering');
  schedule();
  // Pause only the decorative triangle field while the cover is visible. The astronaut remains present throughout the page.
  if ('IntersectionObserver' in window) {
    document.body.classList.add('cover-in-view');
    new IntersectionObserver(entries => {
      coverVisible = entries[0].isIntersecting;
      document.body.classList.toggle('cover-in-view', coverVisible);
      coverVisible ? schedule() : stop();
    }).observe(cover);
  }
})();
