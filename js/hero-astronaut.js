/*
 * Astronauta del hero controlado 100% por scroll (GSAP + ScrollTrigger).
 * Reutiliza el asset existente (assets/Gatoastro.png) — no genera ni reemplaza mascotas,
 * no mueve PORTFOLIO/CREATIVO ni ninguna otra parte del hero.
 *
 * Recorrido (medido con getBoundingClientRect, no con porcentajes fijos):
 *   inicio  -> encima de PORTFOLIO
 *   ~30%    -> atravesando PORTFOLIO (profundidad)
 *   ~50%    -> entre PORTFOLIO y CREATIVO
 *   ~70%    -> atravesando CREATIVO (profundidad)
 *   100%    -> STOP debajo de CREATIVO (la timeline no mueve más translateY)
 *
 * Estructura en index.html:
 *   .hero-art             <- ancla estática; su "top" real se calcula en JS
 *     .hero-cat-rope      <- soga: origen arriba fijo, largo (scaleY) crece con la caída
 *     .hero-cat-rig       <- único elemento que GSAP transforma (x/y/rotation/scale)
 *       .hero-cat-sign
 *       .hero-cat-back / .hero-cat-front  <- mismo asset duplicado para el efecto de profundidad
 *
 * Profundidad: back-layer vive detrás del título (z-index menor), front-layer delante
 * (z-index mayor). La variable CSS --reveal (0 a 1), animada dentro de la MISMA timeline
 * de GSAP, corta horizontalmente la imagen (arriba visible en una capa, abajo en la otra)
 * justo cuando el astronauta cruza cada palabra — nunca hay un z-index fijo tapando todo.
 */
(() => {
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-art');
  const rig = document.querySelector('.hero-cat-rig');
  const rope = document.querySelector('.hero-cat-rope');
  const portfolioRow = document.querySelector('.title-row:not(.title-row-accent)');
  const creativoRow = document.querySelector('.title-row-accent');

  if (!hero || !art || !rig || !rope || !portfolioRow || !creativoRow || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mm = null;

  const setup = () => {
    if (mm) mm.kill();
    mm = gsap.matchMedia();

    mm.add(
      {
        isMobile: '(max-width: 760px)',
        isTablet: '(min-width: 761px) and (max-width: 1050px)',
        isDesktop: '(min-width: 1051px)'
      },
      (context) => {
        const { isMobile, isTablet } = context.conditions;

        // --- Medición real del layout actual (nada de coordenadas fijas) ---
        const heroRect = hero.getBoundingClientRect();
        const portfolioRect = portfolioRow.getBoundingClientRect();
        const creativoRect = creativoRow.getBoundingClientRect();

        const portfolioTop = portfolioRect.top - heroRect.top;
        const portfolioBottom = portfolioRect.bottom - heroRect.top;
        const creativoTop = creativoRect.top - heroRect.top;
        const creativoBottom = creativoRect.bottom - heroRect.top;

        const artWidth = art.getBoundingClientRect().width || parseFloat(getComputedStyle(art).width);
        const astronautHeight = artWidth * (1691 / 1100);
        const gapAbove = isMobile ? 30 : isTablet ? 46 : 64; // "aire" antes de PORTFOLIO
        const gapBelow = isMobile ? 14 : isTablet ? 18 : 26; // espacio antes de asentarse
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 88;
        const minStartTop = headerHeight + (isMobile ? 18 : 36);

        const startTop = Math.max(minStartTop, portfolioTop - astronautHeight - gapAbove);
        const minTravel = astronautHeight * 1.4;
        const endTop = Math.max(startTop + minTravel, creativoBottom + gapBelow);
        const travel = endTop - startTop; // distancia total que recorre el rig (GSAP y)

        art.style.top = `${startTop}px`;

        const ropeBase = isMobile ? 10 : 14;
        const ropeMax = ropeBase + travel;

        // Puntos (0 a 1 del recorrido) donde el CENTRO del astronauta coincide con el
        // centro de cada palabra: ahí es donde ocurre el efecto de profundidad.
        const solveT = (targetCenter) => (targetCenter - startTop - astronautHeight / 2) / travel;
        const tPortfolio = gsap.utils.clamp(0.08, 0.92, solveT((portfolioTop + portfolioBottom) / 2));
        const tCreativo = gsap.utils.clamp(0.08, 0.92, solveT((creativoTop + creativoBottom) / 2));
        const portfolioHalfWindow = gsap.utils.clamp(0.03, 0.16, (portfolioBottom - portfolioTop) / travel / 2 + 0.03);
        const creativoHalfWindow = gsap.utils.clamp(0.03, 0.16, (creativoBottom - creativoTop) / travel / 2 + 0.03);

        const xWobble = reducedMotion ? 0 : isMobile ? 6 : isTablet ? 12 : 18;
        const rotWobble = reducedMotion ? 0 : isMobile ? 1 : isTablet ? 1.8 : 3;

        gsap.set(rig, { x: 0, y: 0, rotation: 0, scale: 1, '--reveal': 1 });
        gsap.set(art, { '--rope-base': `${ropeBase}px`, '--rope-max': `${ropeMax}px` });
        gsap.set(rope, { scaleY: ropeBase / ropeMax, opacity: 1 });

        const st = {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: isMobile ? 0.5 : 0.6,
          invalidateOnRefresh: true
        };

        if (reducedMotion) {
          const tlReduced = gsap.timeline({ scrollTrigger: st })
            .to(rig, { y: travel, ease: 'none' }, 0)
            .to(rope, { scaleY: 1, ease: 'none' }, 0);
          return () => { tlReduced.scrollTrigger && tlReduced.scrollTrigger.kill(); tlReduced.kill(); };
        }

        // --- Puntos de control de la timeline (0 a 1) ------------------------
        const stops = [
          { p: 0, x: 0, r: 0, scale: 1, reveal: 1 },
          { p: Math.max(0.04, tPortfolio - portfolioHalfWindow), x: -0.3, r: -0.35, scale: 0.99, reveal: 1 },
          { p: tPortfolio, x: 0.15, r: 0.2, scale: 0.985, reveal: 0.22 },
          { p: Math.min(0.96, tPortfolio + portfolioHalfWindow), x: 0.5, r: 0.6, scale: 1, reveal: 1 },
          { p: (tPortfolio + tCreativo) / 2, x: -0.6, r: -1, scale: 1, reveal: 1 },
          { p: Math.max(0.04, tCreativo - creativoHalfWindow), x: -0.2, r: -0.3, scale: 0.99, reveal: 1 },
          { p: tCreativo, x: 0.2, r: 0.3, scale: 0.985, reveal: 0.2 },
          { p: Math.min(0.96, tCreativo + creativoHalfWindow), x: 0.4, r: 0.5, scale: 1, reveal: 1 },
          { p: 0.92, x: 0, r: 0, scale: 0.97, reveal: 1 },
          { p: 1, x: 0, r: 0, scale: 1, reveal: 1 }
        ].sort((a, b) => a.p - b.p);

        const rigKeyframes = {};
        const ropeKeyframes = {};
        stops.forEach(({ p, x, r, scale, reveal }) => {
          const key = `${(p * 100).toFixed(2)}%`;
          const y = travel * p;
          rigKeyframes[key] = { y, x: xWobble * x, rotation: rotWobble * r, scale, '--reveal': reveal };
          ropeKeyframes[key] = {
            scaleY: (ropeBase + y) / ropeMax,
            opacity: p > 0.88 ? gsap.utils.mapRange(0.88, 1, 1, 0.55)(p) : 1
          };
        });

        const tl = gsap.timeline({ scrollTrigger: st });
        tl.to(rig, { keyframes: rigKeyframes, ease: 'none' }, 0);
        tl.to(rope, { keyframes: ropeKeyframes, ease: 'none' }, 0);

        return () => {
          tl.scrollTrigger && tl.scrollTrigger.kill();
          tl.kill();
        };
      }
    );
  };

  setup();

  const rebuild = () => {
    setup();
    ScrollTrigger.refresh();
  };

  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rebuild).catch(() => {});
  }
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 200);
  });
})();
