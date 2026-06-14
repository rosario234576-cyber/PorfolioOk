const serviceRevealElements = document.querySelectorAll(
  ".reveal, .reveal-left, .reveal-right, .reveal-scale"
);
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  const setMenuOpen = (isOpen) => {
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menu" : "Abrir menu");
  };

  navToggle.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("nav-open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
    setMenuOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenuOpen(false);
  });
}

const serviceObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.12
  }
);

serviceRevealElements.forEach((el) => serviceObserver.observe(el));

const previewVideos = document.querySelectorAll(
  ".video-grid video, .service-hero-preview video"
);

previewVideos.forEach((video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("loop", "");
  video.setAttribute("autoplay", "");
  video.preload = "auto";

  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  video.addEventListener("loadeddata", tryPlay, { once: true });
  video.addEventListener("mouseenter", () => video.pause());
  video.addEventListener("mouseleave", tryPlay);
  tryPlay();
});
