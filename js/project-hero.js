(() => {
  'use strict';
  const hero = document.querySelector('[data-project-hero]');
  if (!hero) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // La entrada espera a la tipografía (máx. 500 ms) para que la máscara no salte.
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-in')));
  };
  if (document.fonts?.ready) document.fonts.ready.then(start);
  window.setTimeout(start, 500);

  // Parallax leve al salir: la imagen sube más rápido que el título y escala hasta 1.08.
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reducedMotion.matches) return;
    const progress = clamp(window.scrollY / Math.max(1, hero.offsetHeight));
    hero.style.setProperty('--ph-media-y', `${(-progress * 90).toFixed(1)}px`);
    hero.style.setProperty('--ph-title-y', `${(-progress * 35).toFixed(1)}px`);
    hero.style.setProperty('--ph-media-scale', (1 + progress * .08).toFixed(4));
  };
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
})();
