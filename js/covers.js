(() => {
  'use strict';
  const section = document.querySelector('[data-covers]');
  if (!section) return;
  const grid = section.querySelector('.covers-grid');
  const covers = [...section.querySelectorAll('[data-cover]')];
  const cursor = section.querySelector('.covers-cursor');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // Entrada: dos frames para que el estado inicial se pinte antes de animar.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    section.classList.add('is-ready');
    window.setTimeout(() => section.classList.add('is-settled'), 1500);
  }));

  // Hover / foco: una portada gana protagonismo, la otra se apaga.
  const activate = (cover) => {
    covers.forEach((item) => item.classList.toggle('is-active', item === cover));
    grid.classList.toggle('is-hovering', Boolean(cover));
  };
  covers.forEach((cover) => {
    cover.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') activate(cover); });
    cover.addEventListener('pointerleave', (event) => { if (event.pointerType !== 'touch') activate(null); });
    cover.addEventListener('focus', () => activate(cover));
    cover.addEventListener('blur', () => activate(null));
  });

  // Cursor "VER" con inercia.
  if (cursor && finePointer.matches) {
    grid.classList.add('has-cursor');
    let targetX = -200;
    let targetY = -200;
    let x = targetX;
    let y = targetY;
    let running = false;
    const follow = () => {
      const ease = reducedMotion.matches ? 1 : .18;
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      cursor.style.setProperty('--cx', `${x.toFixed(1)}px`);
      cursor.style.setProperty('--cy', `${y.toFixed(1)}px`);
      if (Math.abs(targetX - x) > .2 || Math.abs(targetY - y) > .2) requestAnimationFrame(follow);
      else running = false;
    };
    grid.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursor.classList.contains('is-visible')) { x = targetX; y = targetY; }
      cursor.classList.add('is-visible');
      if (!running) { running = true; requestAnimationFrame(follow); }
    });
    grid.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    window.addEventListener('scroll', () => cursor.classList.remove('is-visible'), { passive: true });
  }

  // Scroll: cada portada se desplaza a su propia velocidad; la imagen escala 1 → 1.08.
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reducedMotion.matches) return;
    const vh = window.innerHeight;
    covers.forEach((cover) => {
      const rect = cover.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      // 0 cuando la portada asoma por abajo, 1 cuando desaparece por arriba.
      const progress = clamp((vh - rect.top) / (vh + rect.height));
      const shift = progress * 2 - 1;
      const mediaSpeed = Number(cover.dataset.mediaSpeed || 1);
      const titleSpeed = Number(cover.dataset.titleSpeed || 1);
      cover.style.setProperty('--media-y', `${(-shift * 60 * mediaSpeed).toFixed(1)}px`);
      cover.style.setProperty('--title-y', `${(-shift * 60 * titleSpeed).toFixed(1)}px`);
      cover.style.setProperty('--scroll-scale', (1 + progress * .08).toFixed(4));
    });
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
