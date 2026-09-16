/*
 * Reveal editorial del manifiesto ("SOMOS DISEÑADORES...") — inspirado en la
 * composición/­animación del bloque "WE ARE CREATORS..." de la referencia Aurelia,
 * pero con el copy, la tipografía, los colores y los assets reales de INKK Studio.
 *
 * Cada fragmento de la frase (texto, cápsula naranja, texto outline o la imagen
 * inline) tiene su propio tipo de reveal, disparados en cascada (stagger corto)
 * cuando la sección entra en pantalla — no es un fade general a toda la sección.
 *
 * Después del reveal inicial, un segundo ScrollTrigger con scrub agrega un
 * desplazamiento vertical/horizontal MUY sutil a algunos fragmentos e imagen,
 * para que la composición se sienta viva mientras se scrollea la sección.
 */
(() => {
  const section = document.querySelector('.manifesto');
  const text = document.querySelector('.manifesto-text');
  if (!section || !text || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return; // el CSS ya deja todo visible y en su lugar final

  const items = gsap.utils.toArray(text.querySelectorAll('[data-ed]'));
  const STAGGER = 0.05; // 0.025–0.06s pedido en la spec

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    defaults: { ease: 'power3.out' }
  });

  items.forEach((el, i) => {
    const type = el.dataset.ed;
    const at = i * STAGGER;

    if (type === 'up' || type === 'outline') {
      const line = el.querySelector('.ed-line');
      const yStart = 70 + (i % 3) * 15; // 70% / 85% / 100% — evita que todo entre igual
      const vars = { yPercent: 0, duration: 0.7 };
      const fromVars = { yPercent: yStart };
      if (type === 'outline') { vars.opacity = 1; fromVars.opacity = 0; }
      tl.fromTo(line, fromVars, vars, at);
    }

    if (type === 'cap') {
      tl.fromTo(
        el,
        { opacity: 0, scale: 0.85, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6 },
        at
      );
    }

    if (type === 'img') {
      tl.fromTo(
        el,
        { clipPath: 'inset(0 100% 0 0)', scale: 1.08 },
        { clipPath: 'inset(0 0% 0 0)', scale: 1, duration: 0.7 },
        at
      );
    }
  });

  // --- Micro movimiento secundario ligado al scroll (muy sutil) -----------
  const upFrags = items.filter((el) => el.dataset.ed === 'up' || el.dataset.ed === 'outline');
  const imgEl = items.find((el) => el.dataset.ed === 'img');

  upFrags.forEach((el, i) => {
    gsap.to(el, {
      y: i % 2 === 0 ? -10 : 8,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 }
    });
  });

  if (imgEl) {
    gsap.fromTo(
      imgEl,
      { x: -8 },
      { x: 8, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.5 } }
    );
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
