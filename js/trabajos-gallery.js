const trabajosGalleryData = {
  redes: [
    ["Invesmar", "gráficas de redes", ["Invesmar/Post/1.jpg", "Invesmar/Post/2.jpg", "Invesmar/Post/3.jpg", "Invesmar/Post/4.jpg", "Invesmar/Post/5.jpg"]],
    ["Piramide DTF", "gráficas de redes", ["PiramideDtf/1.jpg", "PiramideDtf/2.jpg", "PiramideDtf/3.jpg", "PiramideDtf/4.jpg", "PiramideDtf/5.jpg", "PiramideDtf/Post2 S2.jpg"]],
    ["Tu Plan Futuro", "posteos", ["TuplanFuturo/Posteos/1.jpg", "TuplanFuturo/Posteos/2.jpg", "TuplanFuturo/Posteos/3.jpg", "TuplanFuturo/Posteos/4.jpg", "TuplanFuturo/Posteos/5.jpg", "TuplanFuturo/Posteos/6.jpg"]],
    ["Tu Plan Futuro", "firmas de mail", ["TuplanFuturo/Firmas de mail/Firma Flor Quiñones.jpg", "TuplanFuturo/Firmas de mail/Firma Diego Novoa.jpg", "TuplanFuturo/Firmas de mail/Mauricio nuñez diaz.jpg", "TuplanFuturo/Firmas de mail/Firma Karla Fernandez.jpg", "TuplanFuturo/Firmas de mail/Firma Pato Guajardo.jpg"]],
    ["Newsline Report", "gráficas editoriales", ["NewSlineReport/Post/1.jpg", "NewSlineReport/Post/2.jpg", "NewSlineReport/Post/3.jpg", "NewSlineReport/Post/4.jpg"]],
    ["Vitae Charm", "gráficas de producto", ["VitaeCharm/1.jpg", "VitaeCharm/2.jpg", "VitaeCharm/3.jpg", "VitaeCharm/4.jpg", "VitaeCharm/5.jpg", "VitaeCharm/6.jpg", "VitaeCharm/7.jpg"]],
    ["Palanca Store", "gráficas comerciales", ["PalancaStore/1.jpg", "PalancaStore/2.jpg", "PalancaStore/3.jpg", "PalancaStore/4.jpg", "PalancaStore/5.jpg", "PalancaStore/6.jpg"]],
    ["Electronic Games", "gráficas gaming", ["ElectronicGames/1.jpg", "ElectronicGames/2.jpg", "ElectronicGames/3.jpg", "ElectronicGames/4.jpg", "ElectronicGames/5.jpg", "ElectronicGames/6.jpg", "ElectronicGames/8.jpg", "ElectronicGames/10.jpg", "ElectronicGames/12.jpg", "ElectronicGames/13.jpg", "ElectronicGames/14.jpg", "ElectronicGames/15.jpg"]],
    ["Zona DTF", "gráficas comerciales", ["ZonaDtf/1.jpg", "ZonaDtf/2.jpg", "ZonaDtf/3.jpg", "ZonaDtf/4.jpg", "ZonaDtf/5.jpg"]],
    ["Zona del Verde", "gráficas de producto", ["ZonaDelVerde/1.jpg", "ZonaDelVerde/2.jpg", "ZonaDelVerde/3.jpg", "ZonaDelVerde/4.jpg", "ZonaDelVerde/5.jpg", "ZonaDelVerde/6.jpg", "ZonaDelVerde/7.jpg", "ZonaDelVerde/9.jpg", "ZonaDelVerde/10.jpg"]],
    ["Irazztech", "gráficas tech", ["Irazztech/1.jpg", "Irazztech/2.jpg", "Irazztech/3.jpg", "Irazztech/4.jpg"]]
  ],
  packaging: [
    ["Packaging", "diseño plano + troquel", ["Packaging/Plantilla_Troquel_Opcion_elegida.jpg"], "Primero aparece la pieza plana: estructura, medidas, pliegues y una gráfica lista para pasar a producción."],
    ["Packaging", "mockup impreso", ["Packaging/Mock_Up_Elegido/1.jpg", "Packaging/Mock_Up_Elegido/2.jpg", "Packaging/Mock_Up_Elegido/3.jpg", "Packaging/Mock_Up_Elegido/4.jpg", "Packaging/Mock_Up_Elegido/5.jpg"], "Después, el diseño se vuelve objeto: distintos ángulos para entender cómo funciona el packaging en volumen."],
    ["Electronic Games", "cartelería", ["Carteleria electronicgames/1.jpg", "Carteleria electronicgames/2.jpg", "Carteleria electronicgames/3.jpg"], "Una identidad pensada para verse a distancia y convertir el espacio físico en parte de la experiencia."],
    ["Tu Plan Futuro", "roll up", ["Tu plan Futuro/Roll Up/Impreso.jpg", "Tu plan Futuro/Roll Up/Mock up.jpg", "Tu plan Futuro/Roll Up/Pendón 80 x 200 cm.jpg"], "La marca sale de la pantalla y se adapta a una pieza clara, visible y lista para eventos."],
    ["Tu Plan Futuro", "banners publicitarios", ["Tu plan Futuro/Banner Publicitario/Banner Publicitario.jpg", "Tu plan Futuro/Banner Publicitario/Impreso.jpg", "Tu plan Futuro/Banner Publicitario/Mock up.jpg"], "Una misma dirección visual llevada a distintos soportes para sostener el mensaje en cada punto de contacto."],
    ["Tu Plan Futuro", "sistema de piezas", ["Tu plan Futuro/Credenciales/Impreso.jpg", "Tu plan Futuro/Llavero/Llavero.jpg"], "El sistema se completa con piezas pequeñas que ordenan, identifican y llevan la identidad más allá de la pantalla."]
  ],
  fotografia: [
    ["Maximus Gaming", "fotografía de producto", ["MaximusGaming/1.jpg", "MaximusGaming/2.jpg", "MaximusGaming/3.jpg", "MaximusGaming/4.jpg", "MaximusGaming/5.jpg", "MaximusGaming/6.jpg", "MaximusGaming/7.jpg", "MaximusGaming/8.jpg", "MaximusGaming/9.jpg", "MaximusGaming/10.jpg", "MaximusGaming/11.jpg", "MaximusGaming/12.jpg"]],
    ["Arvel Custom", "fotografía de producto", ["ArvelCustom/1.jpg", "ArvelCustom/2.jpg", "ArvelCustom/3.jpg", "ArvelCustom/4.jpg", "ArvelCustom/5.jpg", "ArvelCustom/6.jpg", "ArvelCustom/7.jpg", "ArvelCustom/8.jpg", "ArvelCustom/9.jpg", "ArvelCustom/10.jpg"]]
  ]
};

const getTrabajosType = () => {
  if (document.body.classList.contains("photography-page")) return "fotografia";
  if (location.pathname.endsWith("papeleria.html") || location.pathname.endsWith("packaging.html")) return "packaging";
  if (location.pathname.endsWith("diseno-de-piezas.html")) return "redes";
  return null;
};

const createTrabajosGallery = () => {
  const type = getTrabajosType();
  const legacySection = document.querySelector(".service-clients");
  const groups = trabajosGalleryData[type];
  const mountPoint = document.querySelector("#trabajos");
  if (!type || (!legacySection && !mountPoint) || !groups) return;

  if (legacySection) legacySection.hidden = true;
  const section = document.createElement("section");
  section.className = "service-clients trabajos-gallery-section";
  section.setAttribute("aria-label", "Trabajos seleccionados");
  section.innerHTML = `<div class="container"><div class="service-gallery-head"><span class="trabajos-kicker">selección de trabajos</span><h2>${type === "redes" ? "gráficas que se mueven" : type === "packaging" ? "objetos que se recuerdan" : "imágenes con intención"}</h2><p>Explorá cada serie sin perder el formato original de las piezas.</p></div><div class="trabajos-gallery-grid"></div></div>`;
  if (legacySection) {
    legacySection.parentNode.insertBefore(section, legacySection);
  } else {
    mountPoint.replaceWith(section);
  }

  const grid = section.querySelector(".trabajos-gallery-grid");
  groups.forEach(([client, category, files, story], groupIndex) => {
    const article = document.createElement("article");
    const layout = type === "packaging" ? (groupIndex === 0 ? "feature" : "project") : type === "fotografia" ? "contact-sheet" : groupIndex % 2 === 0 ? "editorial" : "sequence";
    article.className = `trabajos-client trabajos-layout-${layout}`;
    article.style.setProperty("--trabajos-delay", `${groupIndex * 70}ms`);
    const projectStory = story || `Una serie para ${client} donde cada ${category} mantiene el mismo criterio visual y ayuda a leer la marca como un sistema, no como piezas aisladas.`;
    article.innerHTML = `<header class="trabajos-client-head"><span>${String(groupIndex + 1).padStart(2, "0")}</span><div><small>${category}</small><h3>${client}</h3></div><b>${files.length} piezas</b></header><p class="trabajos-story">${projectStory}</p><div class="trabajos-project-layout"></div>`;
    const gallery = article.querySelector(".trabajos-project-layout");

    files.forEach((file, index) => {
      const figure = document.createElement("figure");
      figure.className = "trabajos-card";
      figure.style.setProperty("--card-delay", `${index * 45}ms`);
      const image = document.createElement("img");
      image.src = `../assets/Trabajos/${type === "redes" ? "Graficas de redes" : type === "packaging" ? "Packaging, Cartelería" : "Fotografia"}/${file}`;
      image.alt = `${client}, ${category}, pieza ${index + 1}`;
      image.loading = index < 3 ? "eager" : "lazy";
      figure.append(image);
      figure.innerHTML += `<figcaption>${String(index + 1).padStart(2, "0")} / ${category}</figcaption>`;
      figure.addEventListener("click", () => window.openServiceLightbox?.(image));
      gallery.append(figure);
    });
    grid.append(article);
  });
};

createTrabajosGallery();
