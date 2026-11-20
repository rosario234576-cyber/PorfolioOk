// Hero: muro de posteos en perspectiva que deriva sin fin ("Drift Wall") dentro de un marco
// redondeado que crece hasta ocupar todo el hero al hacer scroll ("Scroll Expand").
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const TOTAL = 63;
  const COLS = 14;
  const PER_COL = 8;
  const posts = Array.from({ length: TOTAL }, (_, i) => `assets/opt/wall/post-${String(i + 1).padStart(2, '0')}.webp`);

  const wall = document.createElement('div');
  wall.className = 'hero-wall';
  wall.setAttribute('aria-hidden', 'true');
  const frame = document.createElement('div');
  frame.className = 'hw-frame';
  const plane = document.createElement('div');
  plane.className = 'hw-plane';

  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('div');
    col.className = 'hw-col';
    col.style.setProperty('--hw-speed', `${48 + (c * 7) % 22}s`);
    col.style.setProperty('--hw-dir', c % 2 ? 'reverse' : 'normal');
    col.style.setProperty('--hw-delay', `${-((c * 13) % 29)}s`);
    const track = document.createElement('div');
    track.className = 'hw-track';
    const tiles = [];
    for (let r = 0; r < PER_COL; r++) tiles.push(posts[(c * 5 + r * 7) % TOTAL]);
    [...tiles, ...tiles].forEach((src) => {
      const tile = document.createElement('figure');
      tile.className = 'hw-tile';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      tile.append(img);
      track.append(tile);
    });
    col.append(track);
    plane.append(col);
  }
  const shade = document.createElement('div');
  shade.className = 'hw-shade';
  frame.append(plane, shade);
  wall.append(frame);
  hero.prepend(wall);
  hero.classList.add('has-wall');

  // Header: transparente sobre el hero, con fondo recién cuando el hero quedó atrás.
  const header = document.querySelector('.site-header');
  const syncHeader = () => header?.classList.toggle('is-past-hero', hero.getBoundingClientRect().bottom < 90);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // Scroll Expand: solo en escritorio, con el hero fijo mientras el marco crece.
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1051px)', () => {
    const content = [...hero.querySelectorAll('.hero-kicker, .hero-title, .hero-info, .hero-scroll')];
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=85%',
        pin: true,
        scrub: 0.6,
        refreshPriority: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.fromTo(frame, { '--hw-t': 0 }, { '--hw-t': 1, ease: 'power2.inOut', duration: 1 }, 0)
      .to(content, { autoAlpha: 0, y: -40, ease: 'power1.in', duration: 0.55, stagger: 0.03 }, 0)
      .to(shade, { opacity: 0, ease: 'none', duration: 0.6 }, 0.2);
    return () => gsap.set([frame, shade, ...content], { clearProps: 'all' });
  });
})();
