(() => {
  const script = document.currentScript;
  const base = new URL("../assets/burst/", script?.src || location.href);
  const icons = ["gato", "sello", "astro", "posando1", "posando2", "posando3", "vinetas", "fachero", "saltando"];
  const tallIcons = new Set(["astro", "posando1", "posando2", "posando3", "saltando"]);
  const PARTICLES_PER_BURST = 42;
  const MAX_PARTICLES = 160;

  const wrap = document.createElement("div");
  wrap.className = "icon-burst";
  wrap.innerHTML = `<button class="icon-burst-button" type="button" aria-label="Lanzar gatitos de Inkkstudios" title="¡Tocame!"><img src="${new URL("gato.webp", base)}" alt=""></button>`;
  document.body.append(wrap);
  const button = wrap.querySelector("button");

  const layer = document.createElement("div");
  layer.className = "icon-burst-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);

  // Precarga al primer acercamiento para que la explosión salga completa.
  let preloaded = false;
  const preload = () => {
    if (preloaded) return;
    preloaded = true;
    icons.forEach((name) => { new Image().src = new URL(`${name}.webp`, base); });
  };
  button.addEventListener("pointerenter", preload, { once: true });
  button.addEventListener("focus", preload, { once: true });
  setTimeout(preload, 2500);

  const random = (min, max) => min + Math.random() * (max - min);
  let particles = [];
  let frame = null;

  const spawn = () => {
    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const reach = Math.max(window.innerWidth, window.innerHeight);
    const sizeScale = window.innerWidth < 760 ? 0.72 : 1;
    const now = performance.now();

    for (let i = 0; i < PARTICLES_PER_BURST; i += 1) {
      const name = icons[(i + Math.floor(Math.random() * icons.length)) % icons.length];
      const img = document.createElement("img");
      img.src = new URL(`${name}.webp`, base);
      img.alt = "";
      img.draggable = false;
      const size = random(40, 88) * sizeScale * (tallIcons.has(name) ? 1.15 : 1);
      img.style.width = `${size}px`;
      layer.append(img);

      // Sale hacia arriba y a la izquierda en abanico, como fuegos artificiales.
      const angle = random(Math.PI * 0.95, Math.PI * 1.62);
      const speed = random(0.55, 1.35) * reach * 1.25;
      particles.push({
        img,
        size,
        x: originX - size / 2,
        y: originY - size / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        // Cada gato sale con su propio punto de vista: espejado o no, más o menos inclinado.
        flip: Math.random() < 0.5 ? -1 : 1,
        rotation: random(-30, 30),
        spin: random(-420, 420),
        born: now + random(0, 90),
        life: random(1900, 2700)
      });
    }

    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES).forEach((p) => p.img.remove());
    }
    if (!frame) frame = requestAnimationFrame(tick);
  };

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const gravity = window.innerHeight * 2.4;

    particles = particles.filter((p) => {
      const age = now - p.born;
      if (age < 0) {
        p.img.style.opacity = "0";
        return true;
      }
      if (age > p.life) {
        p.img.remove();
        return false;
      }
      p.vy += gravity * dt;
      p.vx *= 1 - 0.9 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
      const pop = Math.min(1, age / 180);
      const scale = pop < 1 ? 0.3 + pop * 0.85 : 1.15 - Math.min(0.15, (age - 180) / 1200);
      const fadeStart = p.life - 550;
      p.img.style.opacity = age > fadeStart ? String(Math.max(0, 1 - (age - fadeStart) / 550)) : "1";
      p.img.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg) scale(${scale * p.flip}, ${scale})`;
      return true;
    });

    frame = particles.length ? requestAnimationFrame(tick) : null;
  };

  button.addEventListener("click", () => {
    preload();
    button.classList.remove("is-popping");
    void button.offsetWidth;
    button.classList.add("is-popping");
    last = performance.now();
    spawn();
  });
  button.addEventListener("animationend", () => button.classList.remove("is-popping"));
})();
