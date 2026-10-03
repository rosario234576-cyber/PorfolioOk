/* Scroll suave con Lenis: rueda del mouse y trackpad con inercia liviana; en celular queda el scroll nativo. */
(() => {
  if (!window.Lenis) return;

  const hasScrollTrigger = Boolean(window.gsap && window.ScrollTrigger);

  const lenis = new Lenis({
    // Interpolación continua: cada movimiento de la rueda se suma a un deslizamiento suave, sin pasos.
    lerp: 0.075,
    smoothWheel: true,
    wheelMultiplier: 1,
    autoRaf: !hasScrollTrigger,
    // Los anclas usan el scroll-padding-top del CSS (alto del header), igual que el scroll nativo.
    anchors: true,
    // Lightbox, menú y explosión de gatitos mantienen su propio scroll.
    prevent: (node) => Boolean(node.closest?.(".service-lightbox, .lightbox, .site-nav, [data-lenis-prevent]"))
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Frena el scroll suave mientras el menú o el lightbox bloquean la página.
  const body = document.body;
  const syncLock = () => {
    const locked = body.classList.contains("menu-open") || body.classList.contains("nav-open") || body.style.overflow === "hidden";
    if (locked && !lenis.isStopped) lenis.stop();
    else if (!locked && lenis.isStopped) lenis.start();
  };
  new MutationObserver(syncLock).observe(body, { attributes: true, attributeFilter: ["class", "style"] });

  window.inkkLenis = lenis;
})();
