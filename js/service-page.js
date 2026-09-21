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

document.querySelectorAll(".client-work").forEach((client, index) => {
  client.style.setProperty("--client-delay", `${Math.min(index * 0.05, 0.2)}s`);
  const title = client.querySelector(".client-copy h2");
  const titleLength = title?.textContent.trim().length || 0;

  if (titleLength > 26) {
    title.classList.add("is-extra-long-title");
  } else if (titleLength > 16) {
    title.classList.add("is-long-title");
  }
});

const lazyLoadVideos = () => {
  const videos = document.querySelectorAll("video[data-lazy='true']");
  if (!videos.length) return;

  if (!("IntersectionObserver" in window)) {
    videos.forEach((video) => {
      if (video.dataset.src) {
        const source = video.querySelector("source[data-src]");
        if (source) {
          source.src = source.dataset.src;
        } else {
          video.src = video.dataset.src;
        }
        video.load();
      }
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const video = entry.target;
        const source = video.querySelector("source[data-src]");

        if (source) {
          source.src = source.dataset.src;
        } else if (video.dataset.src) {
          video.src = video.dataset.src;
        }

        video.load();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }

        currentObserver.unobserve(video);
      });
    },
    { rootMargin: "180px 0px" }
  );

  videos.forEach((video) => observer.observe(video));
};

const videoCatalog = [
  ["../assets/Video.mp4", "showreel"],
  ["../assets/proyectos/Distribuidora ( Ecuador )/Video/8620a042-ee78-423b-a843-beeae3a2118f.mp4", "distribuidora"],
  ["../assets/proyectos/Distribuidora ( Ecuador )/Video/08bc8b58-af64-49f3-afca-33a96a949324.mp4", "distribuidora"],
  ["../assets/proyectos/Armado de pc (Arg)/Video/1080x1920.mp4", "armado de pc"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/8.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/7.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/5.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/4.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/3.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/2.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/1.mp4", "invesmar"],
  ["../assets/proyectos/Tienda Cosmética ( Argentina )/Historias/Cierre vitae (3).mp4", "tienda cosmetica"],
  ["../assets/proyectos/Invesmar- (Chile)/Historias/4.mp4", "invesmar historias"],
  ["../assets/proyectos/Invesmar- (Chile)/Historias/3.mp4", "invesmar historias"],
  ["../assets/proyectos/CampanasAds/CampañaPuertoMontt/Video/Videopuertomontt.mp4", "campana puerto montt"],
  ["../assets/proyectos/Noticias (Méx y Arg)/Video/Newsline report 2.mp4", "newsline report"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/04 - Video Julio/Video julio.mp4", "asesoras inmobiliaria"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Tu plan futuro/Videos/Video1-OCTUBRE.mp4", "tu plan futuro"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Tu plan futuro/Videos/Tuplanfuturo-Video1.mp4", "tu plan futuro"],
  ["../assets/proyectos/Indumentaria (arg)/Historias/c (1).mp4", "indumentaria"],
  ["../assets/proyectos/Indumentaria (arg)/Historias/2.mp4", "indumentaria"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Karla. ferval/Video/Parquequinta.mp4", "parquequinta"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Karla. ferval/Post/Atelier Prat(1).mp4", "atelier prat"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/2.mp4", "hardcore gaming"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/1.mp4", "gaming"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/3.mp4", "reels promocionales"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/ddc00307-f1ed-4d4d-93fa-5367d3b4a0ee.mp4", "esports"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/505a44c8-109b-477a-810c-bd90c9a0b3ab.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/4a93e1d7-e318-4be5-b207-7b308ef87ed4.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/46655fc4-857f-402a-99e1-6c0dd319a0ad.mp4", "tournament"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/35093dec-b60d-4371-b8dd-e84911aa3f82.mp4", "maximus gaming"]
];

const buildVideoGallery = () => {
  const gallery = document.querySelector(".video-gallery-grid");
  if (!gallery) return;

  gallery.replaceChildren(...videoCatalog.map(([source, label], index) => {
    const card = document.createElement("figure");
    card.className = "video-gallery-card reveal visible";
    card.innerHTML = `
      <video muted loop playsinline autoplay preload="metadata">
        <source src="${source}" type="video/mp4">
      </video>
      <button class="video-card-overlay" type="button" aria-label="Ver video completo">
        <span class="video-card-play" aria-hidden="true"></span>
        <span class="video-card-text">ver video</span>
      </button>
      <figcaption><b>${String(index + 1).padStart(2, "0")}</b><span>${label}</span></figcaption>
    `;
    return card;
  }));
};

const setupVideoPreviewCards = () => {
  document.querySelectorAll(".video-gallery-card, .video-intro-card").forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    const overlay = card.querySelector(".video-card-overlay") || document.createElement("button");
    if (!overlay.parentElement) {
      overlay.type = "button";
      overlay.className = "video-card-overlay";
      overlay.setAttribute("aria-label", "Ver video completo");
      overlay.innerHTML = '<span class="video-card-play" aria-hidden="true"></span><span class="video-card-text">ver video</span>';
      card.appendChild(overlay);
    }

    overlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const clonedVideo = video.cloneNode(true);
      clonedVideo.muted = false;
      clonedVideo.defaultMuted = false;
      clonedVideo.controls = true;
      clonedVideo.loop = false;
      clonedVideo.autoplay = true;
      clonedVideo.volume = 1;
      clonedVideo.currentTime = 0;
      clonedVideo.removeAttribute("muted");
      clonedVideo.setAttribute("controls", "controls");
      openLightbox(clonedVideo);
    });

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.load();
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }

    card.addEventListener("click", () => {
      const clonedVideo = video.cloneNode(true);
      clonedVideo.muted = false;
      clonedVideo.defaultMuted = false;
      clonedVideo.controls = true;
      clonedVideo.loop = false;
      clonedVideo.autoplay = true;
      clonedVideo.volume = 1;
      clonedVideo.currentTime = 0;
      clonedVideo.removeAttribute("muted");
      clonedVideo.setAttribute("controls", "controls");
      openLightbox(clonedVideo);
    });
  });
};

const heroPreviewVideos = document.querySelectorAll(".service-hero-preview video, .ads-loop-video");
const galleryVideos = document.querySelectorAll(".video-grid video");

const prepareVideo = (video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  const seekPreviewFrame = () => {
    const previewTime = Number(video.dataset.previewTime || 0);
    if (!previewTime || video.dataset.previewReady === "true") return;
    if (Number.isFinite(video.duration) && video.duration > previewTime) {
      video.currentTime = previewTime;
      video.dataset.previewReady = "true";
    }
  };

  video.addEventListener("loadedmetadata", seekPreviewFrame, { once: true });
};

heroPreviewVideos.forEach((video) => {
  prepareVideo(video);
  video.loop = true;
  video.setAttribute("loop", "");
  video.setAttribute("autoplay", "");
  video.preload = "auto";
  video.load();

  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  video.addEventListener("loadeddata", tryPlay, { once: true });
  video.addEventListener("canplay", tryPlay);
  video.addEventListener("mouseenter", () => video.pause());
  video.addEventListener("mouseleave", tryPlay);
  tryPlay();
});

galleryVideos.forEach((video) => {
  prepareVideo(video);
  video.loop = false;
  video.removeAttribute("loop");
  video.removeAttribute("autoplay");
  video.preload = "metadata";
  video.setAttribute("preload", "metadata");
  video.load();
});

buildVideoGallery();
setupVideoPreviewCards();
lazyLoadVideos();

const lightbox = document.createElement("div");
lightbox.className = "service-lightbox";
lightbox.setAttribute("aria-hidden", "true");
lightbox.innerHTML = `
  <div class="service-lightbox-inner" role="dialog" aria-modal="true" aria-label="Vista ampliada de proyecto">
    <button class="service-lightbox-close" type="button" aria-label="Cerrar vista ampliada">x</button>
    <div class="service-lightbox-media"></div>
    <div class="service-lightbox-copy">
      <span>proyecto</span>
      <h3></h3>
      <p></p>
      <button class="service-lightbox-cta" type="button">ver video completo</button>
    </div>
  </div>
`;
document.body.appendChild(lightbox);

const lightboxMedia = lightbox.querySelector(".service-lightbox-media");
const lightboxKicker = lightbox.querySelector(".service-lightbox-copy span");
const lightboxTitle = lightbox.querySelector(".service-lightbox-copy h3");
const lightboxText = lightbox.querySelector(".service-lightbox-copy p");
const lightboxCta = lightbox.querySelector(".service-lightbox-cta");
const lightboxClose = lightbox.querySelector(".service-lightbox-close");

const getClientName = (element) => {
  const client = element.closest(".client-work");
  return client?.querySelector(".client-copy h2")?.textContent.trim() || "Proyecto";
};

const getBlockName = (element) =>
  element.closest(".client-block")?.querySelector(".client-block-title h3")?.textContent.trim() || "Pieza visual";

const getCaption = (element) =>
  element.closest(".work-card")?.querySelector("figcaption")?.textContent.trim() || getBlockName(element);

const buildDescription = (element) => {
  const caption = getCaption(element).toLowerCase();
  const client = getClientName(element);
  const block = getBlockName(element).toLowerCase();
  return `${client} / ${block}. pieza seleccionada para ver el diseno con mas aire, detalle y contexto visual. formato: ${caption}.`;
};

const openLightbox = (source) => {
  const tagName = source.tagName.toLowerCase();
  const media = source.cloneNode(true);
  const title = getCaption(source);

  lightboxMedia.replaceChildren(media);
  lightboxKicker.textContent = getClientName(source);
  lightboxTitle.textContent = title;
  lightboxText.textContent = buildDescription(source);

  if (tagName === "video") {
    media.controls = true;
    media.muted = false;
    media.defaultMuted = false;
    media.loop = false;
    media.autoplay = true;
    media.preload = "auto";
    media.volume = 1;
    media.currentTime = 0;
    media.removeAttribute("muted");
    media.setAttribute("controls", "controls");
    const playPromise = media.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  lightboxClose.focus();
};

const closeLightbox = () => {
  const activeVideo = lightboxMedia.querySelector("video");
  if (activeVideo) {
    activeVideo.pause();
    activeVideo.currentTime = 0;
    activeVideo.removeAttribute("src");
    activeVideo.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
    activeVideo.load();
  }
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxMedia.replaceChildren();
};

lightboxClose.addEventListener("click", closeLightbox);
lightboxCta.addEventListener("click", () => {
  const video = lightboxMedia.querySelector("video");
  if (video) {
    video.muted = false;
    video.volume = 1;
    video.play();
  }
});
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }
});

document.querySelectorAll(".work-card").forEach((card) => {
  const clientName = getClientName(card);
  const caption = getCaption(card);

  if (!card.querySelector(".project-info")) {
    const info = document.createElement("div");
    info.className = "project-info";
    info.innerHTML = `<span>${caption}</span><strong>${clientName}</strong>`;
    card.appendChild(info);
  }

  card.querySelectorAll("img, video").forEach((media) => {
    media.tabIndex = 0;
    const showMediaError = () => {
      const mediaType = media.tagName.toLowerCase() === "video" ? "video" : "imagen";
      const errorMessage = `hubo un error en el ${mediaType}; en breve lo soluciono :)`;

      if (card.querySelector(".media-error")) return;

      card.classList.add("media-has-error");
      const errorBox = document.createElement("div");
      errorBox.className = "media-error";
      errorBox.innerHTML = `
        <div class="media-error-inner">
          <img src="../assets/Gatoposando3.png" alt="">
          <span>${errorMessage}</span>
        </div>
      `;
      card.appendChild(errorBox);
    };

    media.addEventListener("error", showMediaError);

    media.addEventListener("click", (event) => {
      event.stopPropagation();
      openLightbox(media);
    });
    media.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(media);
      }
    });
  });
});

document.querySelectorAll(".carousel-strip, .fashion-collage").forEach((strip) => {
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  strip.addEventListener("pointerdown", (event) => {
    isDown = true;
    startX = event.clientX;
    scrollLeft = strip.scrollLeft;
    strip.setPointerCapture(event.pointerId);
  });

  strip.addEventListener("pointermove", (event) => {
    if (!isDown) return;
    strip.scrollLeft = scrollLeft - (event.clientX - startX);
  });

  strip.addEventListener("pointerup", () => {
    isDown = false;
  });

  strip.addEventListener("pointercancel", () => {
    isDown = false;
  });
});

const catGuide = document.createElement("aside");
catGuide.className = "service-cat-guide";
catGuide.setAttribute("aria-live", "polite");
catGuide.innerHTML = `
  <div class="service-cat-bubble">
    <span class="service-cat-kicker">nota del gato</span>
    <span class="service-cat-text">baja tranqui: te voy marcando lo importante de cada proyecto.</span>
    <span class="service-cat-action">segui bajando</span>
  </div>
  <img class="service-cat-img" src="../assets/Gatoposando2.png" alt="">
`;

const scrollProgress = document.createElement("div");
scrollProgress.className = "service-scroll-progress";
scrollProgress.innerHTML = "<span></span>";

document.body.appendChild(catGuide);
document.body.appendChild(scrollProgress);

const catText = catGuide.querySelector(".service-cat-text");
const serviceMessages = [
  "mira como cambia el formato: feed, historia, banner o pieza impresa.",
  "si una pieza te interesa, tocala para verla grande y con mas aire.",
  "los carruseles de slices se leen mejor de izquierda a derecha.",
  "cada bloque junta piezas de un mismo sistema visual, no son imagenes sueltas.",
  "cuando el diseno respira, se entiende mejor la idea de la marca."
];

const updateServiceScroll = () => {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
  document.documentElement.style.setProperty("--service-scroll", `${progress}%`);
  catGuide.classList.toggle("is-visible", window.scrollY > 180);

  const clients = [...document.querySelectorAll(".client-work")];
  const currentClient = clients.find((client) => {
    const rect = client.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.3;
  });

  if (currentClient) {
    const title = currentClient.querySelector(".client-copy h2")?.textContent.trim();
    const tags = [...currentClient.querySelectorAll(".client-tags span")]
      .slice(0, 2)
      .map((tag) => tag.textContent.trim().toLowerCase())
      .join(" + ");
    catText.textContent = title
      ? `${title}: aca conviene mirar ${tags || "la variedad de piezas"} como sistema.`
      : serviceMessages[Math.floor(progress / 20) % serviceMessages.length];
  } else {
    catText.textContent = serviceMessages[Math.floor(progress / 20) % serviceMessages.length];
  }
};

updateServiceScroll();
window.addEventListener("scroll", updateServiceScroll, { passive: true });
window.addEventListener("resize", updateServiceScroll);

document.querySelectorAll("[data-video-shell]").forEach((shell) => {
  const video = shell.querySelector("[data-click-video]");
  const playButton = shell.querySelector("[data-video-play]");
  if (!video || !playButton) return;

  video.controls = false;
  video.removeAttribute("autoplay");
  video.pause();

  playButton.addEventListener("click", () => {
    shell.classList.add("is-playing");
    video.controls = true;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => shell.classList.remove("is-playing"));
    }
  });

  video.addEventListener("ended", () => {
    video.controls = false;
    video.currentTime = 0;
    shell.classList.remove("is-playing");
  });
});
