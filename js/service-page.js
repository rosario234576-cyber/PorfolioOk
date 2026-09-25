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
  ["../assets/proyectos/Armado de pc (Arg)/Video/1080x1920.mp4", "armado de pc"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Karla. ferval/Video/Parquequinta.mp4", "karla ferval"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Tu plan futuro/Videos/Tuplanfuturo-Video1.mp4", "tu plan futuro"],
  ["../assets/proyectos/Asesoras Inmobiliaria ( Chile)/Contenido de redes/Tu plan futuro/Videos/Video1-OCTUBRE.mp4", "tu plan futuro"],
  ["../assets/proyectos/CampanasAds/CampañaPuertoMontt/Video/Videopuertomontt.mp4", "campaña puerto montt"],
  ["../assets/proyectos/CampanasAds/Resultados/2026-07-2119-39-56.mp4", "resultados de campaña"],
  ["../assets/proyectos/Distribuidora ( Ecuador )/Video/08bc8b58-af64-49f3-afca-33a96a949324.mp4", "distribuidora"],
  ["../assets/proyectos/Distribuidora ( Ecuador )/Video/8620a042-ee78-423b-a843-beeae3a2118f.mp4", "distribuidora"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/1.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/2.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/3.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/4.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/5.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/7.mp4", "invesmar"],
  ["../assets/proyectos/Invesmar- (Chile)/Videos/8.mp4", "invesmar"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/35093dec-b60d-4371-b8dd-e84911aa3f82.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/46655fc4-857f-402a-99e1-6c0dd319a0ad.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/4a93e1d7-e318-4be5-b207-7b308ef87ed4.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/505a44c8-109b-477a-810c-bd90c9a0b3ab.mp4", "maximus gaming"],
  ["../assets/proyectos/Maximus gaming (Argentina)/Videos/ddc00307-f1ed-4d4d-93fa-5367d3b4a0ee.mp4", "maximus gaming"],
  ["../assets/proyectos/Noticias (Méx y Arg)/Video/Newsline report 2.mp4", "newsline report"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/1.mp4", "gaming"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/2.mp4", "gaming"],
  ["../assets/proyectos/Videojuegos (Ecuador)/Videos/3.mp4", "gaming"]
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

let previewVideoCards = [];
let previewVideoObserver = null;

const playMutedPreview = (video) => {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
};

const resumeVisiblePreviewVideos = () => {
  if (document.hidden || document.querySelector(".service-lightbox.is-open")) return;
  previewVideoCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const video = card.querySelector("video");
    if (!video) return;
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (visible) playMutedPreview(video);
    else video.pause();
  });
};

const setupVideoPreviewCards = () => {
  previewVideoCards = [...document.querySelectorAll(".video-gallery-card, .video-intro-card")];
  previewVideoCards.forEach((card) => {
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

    video.controls = false;
    video.removeAttribute("autoplay");
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.loop = true;
    video.preload = "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.addEventListener("loadeddata", () => card.classList.add("is-video-ready"), { once: true });
    const removeBrokenCard = () => {
      video.pause();
      card.remove();
      previewVideoObserver?.unobserve(card);
    };
    video.addEventListener("error", removeBrokenCard, { once: true });
    video.querySelectorAll("source").forEach((source) => source.addEventListener("error", removeBrokenCard, { once: true }));

    const openCardVideo = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      openLightbox(video);
    };
    overlay.addEventListener("click", openCardVideo);
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openCardVideo(event);
    });
  });

  previewVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      if (!video) return;
      if (entry.isIntersecting && !document.querySelector(".service-lightbox.is-open")) playMutedPreview(video);
      else video.pause();
    });
  }, { rootMargin: "60px 0px", threshold: 0.18 });

  previewVideoCards.forEach((card) => previewVideoObserver.observe(card));
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

const stopVideoPlayback = (video, { reset = true, release = false } = {}) => {
  if (!video) return;
  try { video.pause(); } catch (_) {}
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  if (reset) {
    try { video.currentTime = 0; } catch (_) {}
  }
  if (video.srcObject) {
    video.srcObject.getTracks?.().forEach((track) => track.stop());
    video.srcObject = null;
  }
  if (document.pictureInPictureElement === video) {
    document.exitPictureInPicture?.().catch(() => {});
  }
  if (release) {
    video.removeAttribute("autoplay");
    video.removeAttribute("src");
    video.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
    try { video.load(); } catch (_) {}
  }
};

const stopAllVideoAudio = (except = null) => {
  document.querySelectorAll("video").forEach((video) => {
    if (video !== except) stopVideoPlayback(video, { reset: false });
  });
};
const openLightbox = (source) => {
  closeLightbox({ resumePreviews: false });
  stopAllVideoAudio();

  const tagName = source.tagName.toLowerCase();
  const media = source.cloneNode(true);
  const title = getCaption(source);

  lightboxMedia.replaceChildren(media);
  lightboxKicker.textContent = getClientName(source);
  lightboxTitle.textContent = title;
  lightboxText.textContent = buildDescription(source);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (tagName === "video") {
    media.controls = true;
    media.muted = false;
    media.defaultMuted = false;
    media.loop = false;
    media.autoplay = false;
    media.preload = "auto";
    media.volume = 1;
    media.currentTime = 0;
    media.removeAttribute("muted");
    media.removeAttribute("loop");
    media.setAttribute("controls", "controls");
    const syncMuteControl = () => {
      const muted = media.muted || media.volume === 0;
      lightboxCta.textContent = muted ? "activar audio" : "silenciar audio";
      lightboxCta.setAttribute("aria-pressed", String(muted));
      lightboxCta.classList.toggle("is-muted", muted);
      if (muted) stopAllVideoAudio(media);
    };
    media.addEventListener("volumechange", syncMuteControl);
    media.addEventListener("webkitendfullscreen", () => closeLightbox(), { once: true });
    syncMuteControl();
    const playPromise = media.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
  }

  lightboxClose.focus();
};

window.openServiceLightbox = openLightbox;

function closeLightbox({ resumePreviews = true } = {}) {
  lightboxMedia.querySelectorAll("video").forEach((video) => stopVideoPlayback(video, { release: true }));
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxMedia.replaceChildren();
  stopAllVideoAudio();
  if (resumePreviews) requestAnimationFrame(resumeVisiblePreviewVideos);
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxCta.addEventListener("click", () => {
  const video = lightboxMedia.querySelector("video");
  if (!video) return;
  const shouldMute = !(video.muted || video.volume === 0);
  video.muted = shouldMute;
  video.defaultMuted = shouldMute;
  video.volume = shouldMute ? 0 : 1;
  if (!shouldMute) {
    stopAllVideoAudio(video);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
  }
});
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});



document.addEventListener("play", (event) => {
  const video = event.target;
  if (!(video instanceof HTMLVideoElement)) return;
  if (!video.muted && video.volume > 0) stopAllVideoAudio(video);
}, true);

document.addEventListener("volumechange", (event) => {
  const video = event.target;
  if (!(video instanceof HTMLVideoElement)) return;
  if (!video.muted && video.volume > 0) stopAllVideoAudio(video);
}, true);
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && lightbox.classList.contains("is-open")) closeLightbox();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (lightbox.classList.contains("is-open")) closeLightbox();
    else stopAllVideoAudio();
  }
});
window.addEventListener("pagehide", () => {
  lightboxMedia.querySelectorAll("video").forEach((video) => stopVideoPlayback(video, { release: true }));
  stopAllVideoAudio();
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

const serviceStoryData = {
  "diseno-de-piezas": {
    label: "sistema visual",
    title: "Piezas que no viven aisladas.",
    intro: "Cada formato forma parte de una misma conversación: captar atención, ordenar el mensaje y hacer reconocible a la marca.",
    challenge: "Transformar contenidos distintos en una presencia consistente, sin perder claridad ni velocidad de lectura.",
    approach: "Definimos jerarquías, ritmo, tipografía y recursos gráficos que se adaptan a feed, historias y campañas.",
    impact: "El usuario reconoce la marca antes de leerla y encuentra rápido qué mirar, entender o hacer."
  },
  "edicion-de-video": {
    label: "narrativa audiovisual",
    title: "El ritmo también diseña.",
    intro: "La edición conecta imagen, sonido y mensaje para sostener la atención desde el primer segundo hasta el cierre.",
    challenge: "Concentrar una idea en pocos segundos sin que el contenido pierda identidad ni intención.",
    approach: "Trabajamos apertura, cortes, tipografía en movimiento y cadencia según la plataforma y la audiencia.",
    impact: "Una pieza más fácil de seguir, recordar y compartir, pensada para el comportamiento real del usuario."
  },
  "campanas-ads": {
    label: "campañas digitales",
    title: "Creatividad con una dirección clara.",
    intro: "Una campaña no es una suma de anuncios: es un recorrido visual que acompaña al usuario desde el impacto hasta la acción.",
    challenge: "Detener el scroll y comunicar una propuesta de valor en un entorno saturado de estímulos.",
    approach: "Construimos conceptos, variaciones y formatos con mensajes jerarquizados para cada etapa de campaña.",
    impact: "El sistema mantiene coherencia mientras cada anuncio cumple una función concreta dentro del recorrido."
  },
  "fotografia": {
    label: "dirección de imagen",
    title: "La imagen como primer contacto.",
    intro: "Antes de explicar un producto, la fotografía ya transmite textura, escala, actitud y una promesa de marca.",
    challenge: "Mostrar el producto con intención y diferenciarlo sin alejarlo de cómo lo verá la persona.",
    approach: "Definimos luz, encuadre, fondos y secuencia para crear una serie útil en distintos puntos de contacto.",
    impact: "Las imágenes construyen confianza, despiertan interés y facilitan una decisión más informada."
  },
  "gigantografia-brandeo": {
    label: "marca en el espacio",
    title: "Del diseño al lugar que se habita.",
    intro: "Cuando la identidad sale de la pantalla, escala, distancia y recorrido pasan a ser parte del mensaje.",
    challenge: "Llevar la marca a gran formato sin perder legibilidad, personalidad ni relación con el entorno.",
    approach: "Diseñamos por capas de lectura: impacto a distancia, información cercana y detalles de reconocimiento.",
    impact: "El espacio orienta, comunica y se convierte en una experiencia coherente con la marca."
  },
  "papeleria": {
    label: "identidad tangible",
    title: "Una marca que también se puede tocar.",
    intro: "La papelería convierte el sistema visual en objetos cotidianos y hace que cada intercambio se sienta cuidado.",
    challenge: "Mantener consistencia entre piezas, tamaños, materiales y necesidades de uso muy diferentes.",
    approach: "Ordenamos grillas, jerarquías y terminaciones para que cada soporte funcione solo y como parte del conjunto.",
    impact: "La experiencia se vuelve reconocible y profesional desde el primer contacto físico."
  },
  "packaging": {
    label: "diseño de empaque",
    title: "Del plano al objeto.",
    intro: "El packaging protege, informa y presenta. Su diseño empieza en la estructura y termina en la experiencia de abrirlo.",
    challenge: "Hacer convivir información, identidad y requisitos técnicos en una superficie limitada.",
    approach: "Diseñamos sobre el troquel, probamos jerarquías y anticipamos cómo se descubre cada cara del objeto.",
    impact: "Un empaque claro, memorable y preparado para funcionar tanto en exhibición como en las manos del usuario."
  },
  "indumentaria": {
    label: "identidad aplicada",
    title: "La marca toma cuerpo.",
    intro: "En indumentaria, el diseño se mueve, cambia de escala y convive con quien lo usa.",
    challenge: "Traducir la identidad a prendas reales sin perder presencia, comodidad ni posibilidades de producción.",
    approach: "Ajustamos composición, ubicación, contraste y técnica para cada prenda y contexto de uso.",
    impact: "La persona no solo ve la marca: la incorpora, la reconoce y la lleva consigo."
  },
  "gestion-de-redes": {
    label: "ecosistema de contenidos",
    title: "Una voz que se reconoce en movimiento.",
    intro: "Gestionar redes es sostener una conversación: cada publicación tiene un rol y todas construyen percepción.",
    challenge: "Mantener frecuencia y variedad sin que la identidad ni el objetivo se diluyan.",
    approach: "Organizamos pilares, formatos y ritmos editoriales para conectar estrategia, diseño y comunidad.",
    impact: "El usuario encuentra continuidad, entiende qué ofrece la marca y sabe cómo vincularse con ella."
  },
  "cuentas-gestionadas": {
    label: "dirección continua",
    title: "Consistencia que se construye en el tiempo.",
    intro: "Una cuenta gestionada conecta decisiones diarias con una dirección de marca que se sostiene mes a mes.",
    challenge: "Responder a oportunidades nuevas sin perder tono, orden ni objetivos de comunicación.",
    approach: "Combinamos planificación, sistemas flexibles y lectura de resultados para ajustar el contenido.",
    impact: "La experiencia se siente estable para el usuario y ágil para la marca."
  },
  "diseno-web": {
    label: "experiencia digital",
    title: "Recorridos que conectan intención y acción.",
    intro: "Una web no se limita a mostrar: orienta, responde preguntas y acompaña a la persona hasta el siguiente paso.",
    challenge: "Ordenar mucha información sin perder personalidad, velocidad ni una ruta de navegación clara.",
    approach: "Diseñamos jerarquías, estados, llamados a la acción y momentos visuales según el recorrido del usuario.",
    impact: "La interacción se vuelve intuitiva, la propuesta se entiende y cada sección invita a continuar."
  }
};

const serviceSlug = location.pathname.split("/").pop().replace(/\\.html$/i, "");
const normalizedServiceSlug = serviceSlug.split(".html")[0];
const serviceStory = serviceStoryData[normalizedServiceSlug];
document.body.classList.add("project-page", `project-${normalizedServiceSlug}`);

if (serviceStory && !document.querySelector("[data-case-story]")) {
  const caseStory = document.createElement("section");
  caseStory.className = "case-story";
  caseStory.dataset.caseStory = "";
  caseStory.innerHTML = `
    <div class="case-story-progress" aria-hidden="true"><span></span></div>
    <div class="case-story-shell">
      <header class="case-story-intro" data-reveal>
        <span class="case-story-kicker">proyecto / proceso / experiencia</span>
        <p class="case-story-label">${serviceStory.label}</p>
        <h2 data-split>${serviceStory.title}</h2>
        <p class="case-story-lead">${serviceStory.intro}</p>
      </header>
      <div class="case-story-steps">
        <article data-reveal><span>01</span><small>desafío</small><p>${serviceStory.challenge}</p></article>
        <article data-reveal><span>02</span><small>decisión</small><p>${serviceStory.approach}</p></article>
        <article data-reveal><span>03</span><small>experiencia</small><p>${serviceStory.impact}</p></article>
      </div>
      <div class="case-story-bridge" data-reveal>
        <span>de la idea al uso real</span>
        <p>La pieza es el resultado visible. Debajo hay una decisión pensada para que la marca y la persona se entiendan mejor.</p>
      </div>
    </div>
  `;
  const heroSection = document.querySelector(".service-hero");
  const immediateNote = heroSection?.nextElementSibling?.matches(".service-note")
    ? heroSection.nextElementSibling
    : null;
  const anchor = immediateNote || heroSection;
  anchor?.insertAdjacentElement("afterend", caseStory);

  document.querySelectorAll(".client-work").forEach((project, index) => {
    const head = project.querySelector(".client-head");
    if (!head || project.querySelector(".project-reading-key")) return;
    const tags = [...project.querySelectorAll(".client-tags span")].slice(0, 2).map((tag) => tag.textContent.trim()).join(" + ");
    const reading = document.createElement("div");
    reading.className = "project-reading-key";
    reading.innerHTML = `
      <span>proyecto ${String(index + 1).padStart(2, "0")}</span>
      <p><b>necesidad</b>${tags || serviceStory.label}</p>
      <p><b>decisión</b>un sistema visual flexible y reconocible</p>
      <p><b>uso</b>claridad para la marca y para quien la mira</p>
    `;
    head.insertAdjacentElement("afterend", reading);
  });
}

const enhanceProjectChapters = () => {
  const chapters = [...document.querySelectorAll("main > section")].filter((section) =>
    !section.matches(".service-hero,.service-note,.case-story,.service-end,[hidden]")
  );

  chapters.forEach((section, index) => {
    section.classList.add("project-chapter");
    section.style.setProperty("--project-chapter", index + 1);
    if (!section.id) section.id = `capitulo-${index + 1}`;
    if (section.querySelector(":scope > .project-chapter-index")) return;
    const marker = document.createElement("span");
    marker.className = "project-chapter-index";
    marker.setAttribute("aria-hidden", "true");
    marker.innerHTML = `<b>${String(index + 1).padStart(2, "0")}</b><i>capítulo</i>`;
    section.prepend(marker);
  });
};

enhanceProjectChapters();
window.addEventListener("DOMContentLoaded", enhanceProjectChapters, { once: true });

const updateServiceScroll = () => {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
  document.documentElement.style.setProperty("--service-scroll", `${progress}%`);
  const caseStorySection = document.querySelector("[data-case-story]");
  if (caseStorySection) {
    const storyRect = caseStorySection.getBoundingClientRect();
    const storyRange = Math.max(1, storyRect.height + window.innerHeight);
    const storyProgress = Math.min(1, Math.max(0, (window.innerHeight - storyRect.top) / storyRange));
    caseStorySection.style.setProperty("--case-progress", storyProgress.toFixed(3));
    caseStorySection.style.setProperty("--case-progress-pct", `${storyProgress * 100}%`);
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
    stopAllVideoAudio(video);
    shell.classList.add("is-playing");
    video.controls = true;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.removeAttribute("muted");
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
