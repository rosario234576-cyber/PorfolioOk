// Titulo del hero "Tech Text": cerca del cursor, cada letra pierde el relleno
// y se dibuja como un trazo vectorial punteado que avanza.
(() => {
  const title = document.querySelector('.hero-title');
  if (!title) return;
  const words = [...title.querySelectorAll('.title-row b')];
  if (!words.length) return;

  const SVG = 'http://www.w3.org/2000/svg';
  const letters = [];

  words.forEach((word) => {
    const text = word.textContent;
    word.textContent = '';
    word.setAttribute('aria-label', text);
    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.className = 'tt-char';
      span.setAttribute('aria-hidden', 'true');
      const glyph = document.createElement('span');
      glyph.className = 'tt-glyph';
      glyph.textContent = char;
      const probe = document.createElement('i');
      probe.className = 'tt-probe';
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'tt-vector');
      svg.setAttribute('aria-hidden', 'true');
      const ghost = document.createElementNS(SVG, 'text');
      ghost.setAttribute('class', 'tt-ghost');
      ghost.textContent = char;
      const dash = document.createElementNS(SVG, 'text');
      dash.setAttribute('class', 'tt-dash');
      dash.textContent = char;
      svg.append(ghost, dash);
      span.append(glyph, probe, svg);
      word.append(span);
      letters.push({ span, probe, svg, texts: [ghost, dash], t: 0, target: 0 });
    });
  });
  title.classList.add('tt-ready');

  // Alinea el texto SVG con la línea base real de cada letra.
  const layout = () => {
    letters.forEach((l) => {
      const w = l.span.offsetWidth;
      const h = l.span.offsetHeight;
      const base = l.probe.offsetTop;
      const fs = parseFloat(getComputedStyle(l.span).fontSize) || 100;
      l.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      l.svg.setAttribute('width', w);
      l.svg.setAttribute('height', h);
      l.texts.forEach((t) => { t.setAttribute('x', 0); t.setAttribute('y', base); });
      l.span.style.setProperty('--tt-dash', `${(fs * 0.045).toFixed(1)}px`);
      l.span.style.setProperty('--tt-gap', `${(fs * 0.03).toFixed(1)}px`);
      l.span.style.setProperty('--tt-stroke', `${Math.max(1, fs * 0.012).toFixed(2)}px`);
    });
  };
  layout();
  document.fonts?.ready.then(layout);
  window.addEventListener('resize', layout);

  let pointer = null;
  let running = false;

  const frame = () => {
    let active = false;
    let anyHot = false;
    letters.forEach((l) => {
      if (pointer) {
        const r = l.span.getBoundingClientRect();
        const radius = Math.max(r.height * 0.9, 90);
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        l.target = Math.max(0, Math.min(1, 1.7 * (1 - (d - r.width * 0.3) / radius)));
      } else {
        l.target = 0;
      }
      l.t += (l.target - l.t) * 0.16;
      if (Math.abs(l.target - l.t) < 0.002) l.t = l.target;
      if (l.t !== l.target) active = true;
      if (l.t > 0.02) anyHot = true;
      l.span.style.setProperty('--tt', l.t.toFixed(3));
    });
    title.classList.toggle('tt-hot', anyHot);
    if (active || pointer) requestAnimationFrame(frame);
    else running = false;
  };
  const wake = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  const onMove = (x, y) => {
    const r = title.getBoundingClientRect();
    const pad = 160;
    const inside = x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
    pointer = inside ? { x, y } : null;
    wake();
  };
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
  const leave = () => { pointer = null; wake(); };
  document.addEventListener('pointerleave', leave);
  window.addEventListener('touchend', leave, { passive: true });
  window.addEventListener('blur', leave);
})();
