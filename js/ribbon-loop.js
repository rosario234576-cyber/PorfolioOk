// Tira de servicios "Text Loop" (preset ribbon): el texto corre sin cortes
// sobre una cinta naranja que ondula siguiendo una curva SVG.
(() => {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  const SVG = 'http://www.w3.org/2000/svg';
  const WORDS = ['BRANDING', 'DISEÑO GRÁFICO', 'WEB DESIGN', 'CAMPAÑAS', 'FOTOGRAFÍA', 'VIDEO'];
  const SPEED = 70; // px por segundo

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'ribbon-svg');
  svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(SVG, 'defs');
  const path = document.createElementNS(SVG, 'path');
  path.id = 'ribbon-loop-path';
  const clip = document.createElementNS(SVG, 'clipPath');
  clip.id = 'ribbon-loop-clip';
  const clipRect = document.createElementNS(SVG, 'rect');
  clip.append(clipRect);
  defs.append(path, clip);
  // Relleno oscuro entre el borde recto del hero y la cinta, para que no asome el fondo claro.
  const filler = document.createElementNS(SVG, 'path');
  filler.setAttribute('class', 'ribbon-fill');
  filler.setAttribute('clip-path', 'url(#ribbon-loop-clip)');
  const edge = document.createElementNS(SVG, 'use');
  edge.setAttribute('href', '#ribbon-loop-path');
  edge.setAttribute('class', 'ribbon-edge');
  const band = document.createElementNS(SVG, 'use');
  band.setAttribute('href', '#ribbon-loop-path');
  band.setAttribute('class', 'ribbon-band');
  const text = document.createElementNS(SVG, 'text');
  text.setAttribute('class', 'ribbon-text');
  text.setAttribute('dominant-baseline', 'central');
  const textPath = document.createElementNS(SVG, 'textPath');
  textPath.setAttribute('href', '#ribbon-loop-path');
  text.append(textPath);
  svg.append(defs, filler, edge, band, text);

  const fillGroup = (parent) => {
    WORDS.forEach((w) => {
      parent.append(document.createTextNode(`${w} `));
      const star = document.createElementNS(SVG, 'tspan');
      star.setAttribute('class', 'ribbon-star');
      star.textContent = '✦';
      parent.append(star, document.createTextNode(' '));
    });
  };

  ticker.classList.add('ticker--ribbon');
  ticker.replaceChildren(svg);

  let groupLen = 0;
  let offset = 0;

  // Curva suave (Catmull-Rom a Bézier) que pasa por puntos de una onda.
  const wavePath = (w, h, fs) => {
    const period = Math.max(fs * 22, w * 0.62);
    const amp = h * 0.2;
    const mid = h / 2;
    const step = period / 8;
    const pts = [];
    for (let x = -period; x <= w + period; x += step) {
      pts.push([x, mid + Math.sin((x / period) * Math.PI * 2) * amp + (x / w - 0.5) * h * 0.08]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };

  const layout = () => {
    const fs = parseFloat(getComputedStyle(ticker).fontSize) || 36;
    const w = ticker.clientWidth;
    const h = ticker.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const d = wavePath(w, h, fs);
    path.setAttribute('d', d);
    const hero = ticker.previousElementSibling;
    const heroY = hero ? hero.getBoundingClientRect().bottom - ticker.getBoundingClientRect().top : 0;
    const big = w * 4;
    filler.setAttribute('d', `${d} L${big} ${heroY} L${-big} ${heroY} Z`);
    clipRect.setAttribute('x', -big);
    clipRect.setAttribute('width', big * 2);
    clipRect.setAttribute('y', heroY - 1);
    clipRect.setAttribute('height', Math.max(0, h - heroY + 1));
    ticker.style.setProperty('--ribbon-band', `${(fs * 1.55).toFixed(1)}px`);

    // Mide un grupo de palabras para que el bucle empalme sin saltos.
    textPath.replaceChildren();
    fillGroup(textPath);
    groupLen = textPath.getComputedTextLength() || 600;
    const copies = Math.ceil(path.getTotalLength() / groupLen) + 2;
    for (let i = 1; i < copies; i++) fillGroup(textPath);
  };

  let visible = true;
  let last = 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (visible && groupLen) {
      offset = (offset + SPEED * dt) % groupLen;
      textPath.setAttribute('startOffset', (-offset).toFixed(2));
    }
    requestAnimationFrame(tick);
  };

  layout();
  document.fonts?.ready.then(layout);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(ticker);
  requestAnimationFrame(tick);
})();
