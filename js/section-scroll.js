(() => {
  const cover = document.querySelector('#inicio.cover-home');
  const about = document.querySelector('#sobre-mi.about');
  const mascotSource = document.querySelector('.cover-mascot');

  if (!cover || !about || !mascotSource) return;

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const transitionCat = mascotSource.cloneNode(true);
  transitionCat.className = 'scroll-transition-cat';
  transitionCat.removeAttribute('width');
  transitionCat.removeAttribute('height');
  document.body.appendChild(transitionCat);

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  let frameRequested = false;

  const updateScene = () => {
    frameRequested = false;

    if (reducedMotion.matches) {
      root.classList.add('scroll-motion-ready');
      transitionCat.classList.remove('is-active');
      return;
    }

    const viewportHeight = Math.max(1, window.innerHeight);
    const coverRect = cover.getBoundingClientRect();
    const aboutRect = about.getBoundingClientRect();
    const coverExit = clamp(-coverRect.top / Math.max(viewportHeight * .9, coverRect.height * .62));
    const aboutEnter = clamp((viewportHeight - aboutRect.top) / (viewportHeight * .78));
    const bridgeProgress = clamp((viewportHeight * .9 - aboutRect.top) / (viewportHeight * .62));
    const bridgeOpacity = Math.sin(bridgeProgress * Math.PI) * .96;

    root.style.setProperty('--cover-exit', coverExit.toFixed(4));
    root.style.setProperty('--about-enter', aboutEnter.toFixed(4));
    root.style.setProperty('--bridge-progress', bridgeProgress.toFixed(4));
    root.style.setProperty('--bridge-opacity', Math.max(0, bridgeOpacity).toFixed(4));
    root.classList.add('scroll-motion-ready');
    transitionCat.classList.toggle('is-active', bridgeOpacity > .025 && aboutRect.top > viewportHeight * .12);
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateScene);
  };

  updateScene();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  reducedMotion.addEventListener?.('change', requestUpdate);
})();
