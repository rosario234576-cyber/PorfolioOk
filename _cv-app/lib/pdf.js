import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LABELS = {
  es: { summary: "Perfil Profesional", experience: "Experiencia", education: "Educación", skills: "Habilidades e Intereses" },
  en: { summary: "Summary", experience: "Experience", education: "Education", skills: "Skills & Interests" },
  pt: { summary: "Perfil Profissional", experience: "Experiência", education: "Formação Acadêmica", skills: "Competências e Interesses" },
};

const PAPER = { a4: "A4", letter: "LETTER" };

// Tinos: libre (Apache 2.0) y con las mismas medidas que Times New Roman.
// Viene en el paquete npm, así que el PDF sale igual en Windows y en el servidor.
const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "@fontsource", "tinos", "files");
const FONTS = {
  regular: "tinos-latin-400-normal.woff",
  bold: "tinos-latin-700-normal.woff",
  italic: "tinos-latin-400-italic.woff",
  boldItalic: "tinos-latin-700-italic.woff",
};
const HAS_TINOS = Object.values(FONTS).every((f) => fs.existsSync(path.join(FONT_DIR, f)));

// Diseños disponibles. Todos son de una sola columna, sin tablas ni gráficos, para que los ATS los lean bien.
const DESIGNS = {
  harvard: { serif: true, align: "center", accent: "#000000", ruleColor: "#000000", ruleWidth: 0.6, nameGap: 7 },
  ejecutivo: { serif: true, align: "left", accent: "#5b1a1a", ruleColor: "#5b1a1a", ruleWidth: 1.2, nameGap: 10 },
  moderno: { serif: false, align: "left", accent: "#1d3557", ruleColor: "#1d3557", ruleWidth: 1.4, nameGap: 11 },
  minimalista: { serif: false, align: "left", accent: "#111111", ruleColor: "#b5b5b5", ruleWidth: 0.5, nameGap: 9 },
};
export const designOf = (d) => DESIGNS[d] || DESIGNS.harvard;

function registerFonts(doc, design) {
  if (!design.serif) {
    doc.registerFont("regular", "Helvetica");
    doc.registerFont("bold", "Helvetica-Bold");
    doc.registerFont("italic", "Helvetica-Oblique");
    doc.registerFont("boldItalic", "Helvetica-BoldOblique");
    return;
  }
  if (HAS_TINOS) {
    for (const [k, f] of Object.entries(FONTS)) doc.registerFont(k, path.join(FONT_DIR, f));
  } else {
    doc.registerFont("regular", "Times-Roman");
    doc.registerFont("bold", "Times-Bold");
    doc.registerFont("italic", "Times-Italic");
    doc.registerFont("boldItalic", "Times-BoldItalic");
  }
}

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const nonEmpty = (arr) => (arr || []).map(clean).filter(Boolean);

function render(doc, cv, size, photo, D) {
  const L = LABELS[cv.language] || LABELS.es;
  const M = doc.page.margins;
  const X = M.left;
  const W = doc.page.width - M.left - M.right;
  const bottom = () => doc.page.height - M.bottom;
  const gap = size * 0.35;

  const ensure = (h) => {
    if (doc.y + h > bottom()) doc.addPage();
  };

  const row = (left, right, leftFont, rightFont) => {
    left = clean(left);
    right = clean(right);
    if (!left && !right) return;
    ensure(size * 1.4);
    const y = doc.y;
    doc.font(rightFont).fontSize(size);
    const rw = right ? doc.widthOfString(right) + 12 : 0;
    doc.font(leftFont).text(left, X, y, { width: W - rw });
    const leftEnd = doc.y;
    if (right) doc.font(rightFont).text(right, X, y, { width: W, align: "right" });
    doc.x = X;
    doc.y = Math.max(leftEnd, y + doc.currentLineHeight(true));
  };

  const bullets = (items) => {
    for (const b of nonEmpty(items)) {
      doc.font("regular").fontSize(size);
      const h = doc.heightOfString(b, { width: W - 18 });
      ensure(Math.min(h, size * 2.5));
      const y = doc.y;
      doc.text("•", X + 6, y, { width: 10 });
      doc.text(b, X + 18, y, { width: W - 18 });
      doc.x = X;
    }
  };

  const heading = (title) => {
    ensure(size * 4.5);
    doc.moveDown(0.55);
    doc.font("bold").fontSize(size + 1).fillColor(D.accent).text(title.toUpperCase(), X, doc.y, {
      width: W,
      align: D.align,
      characterSpacing: 0.6,
    });
    doc.fillColor("#000000");
    const y = doc.y + 1.5;
    doc.moveTo(X, y).lineTo(X + W, y).lineWidth(D.ruleWidth).strokeColor(D.ruleColor).stroke();
    doc.y = y + gap + 1;
    doc.x = X;
  };

  const entryBlock = (e, first) => {
    if (!first) doc.y += gap;
    row(e.organization, e.location, "bold", "bold");
    row(e.role, e.dates, "italic", "regular");
    bullets(e.bullets);
  };

  // Encabezado
  const c = cv.contact || {};
  const contact = nonEmpty([c.location, c.email, c.phone, c.linkedin, c.website].map((s) =>
    clean(s).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")
  ));
  const top = M.top;
  if (photo) {
    // Foto circular a la izquierda; nombre y contacto alineados a su derecha
    const d = 76;
    const tx = X + d + 18;
    const tw = W - d - 18;
    doc.font("bold").fontSize(size + D.nameGap);
    const nameH = doc.heightOfString(clean(cv.name), { width: tw });
    const half = Math.ceil(contact.length / 2);
    const contactText = contact.length > 2
      ? contact.slice(0, half).join("  •  ") + "\n" + contact.slice(half).join("  •  ")
      : contact.join("  •  ");
    doc.font("regular").fontSize(size - 0.5);
    const contactH = contact.length ? doc.heightOfString(contactText, { width: tw }) + 3 : 0;
    const ty = top + Math.max(0, (d - nameH - contactH) / 2);

    doc.save();
    doc.circle(X + d / 2, top + d / 2, d / 2).clip();
    doc.image(photo, X, top, { width: d, height: d });
    doc.restore();

    doc.font("bold").fontSize(size + D.nameGap).fillColor(D.accent).text(clean(cv.name), tx, ty, { width: tw });
    doc.fillColor("#000000");
    if (contact.length) {
      doc.y += 3;
      doc.font("regular").fontSize(size - 0.5).text(contactText, tx, doc.y, { width: tw });
    }
    doc.x = X;
    doc.y = Math.max(doc.y, top + d);
  } else {
    doc.font("bold").fontSize(size + D.nameGap).fillColor(D.accent).text(clean(cv.name), X, top, { width: W, align: D.align });
    doc.fillColor("#000000");
    if (contact.length) {
      doc.moveDown(0.15);
      doc.font("regular").fontSize(size - 0.5).text(contact.join("  •  "), X, doc.y, { width: W, align: D.align });
    }
  }

  if (clean(cv.summary)) {
    heading(L.summary);
    doc.font("regular").fontSize(size).text(clean(cv.summary), X, doc.y, { width: W, align: "justify" });
  }

  const experience = () => {
    const items = (cv.experience || []).filter((e) => clean(e.organization) || clean(e.role));
    if (!items.length) return;
    heading(L.experience);
    items.forEach((e, i) => entryBlock(e, i === 0));
  };
  const education = () => {
    const items = (cv.education || []).filter((e) => clean(e.institution) || clean(e.degree));
    if (!items.length) return;
    heading(L.education);
    items.forEach((e, i) =>
      entryBlock({ organization: e.institution, location: e.location, role: e.degree, dates: e.dates, bullets: e.details }, i === 0)
    );
  };

  if (cv.experience_first) {
    experience();
    education();
  } else {
    education();
    experience();
  }

  for (const sec of cv.extra_sections || []) {
    const items = (sec.items || []).filter((e) => clean(e.organization) || clean(e.role) || nonEmpty(e.bullets).length);
    if (!clean(sec.title) || !items.length) continue;
    heading(clean(sec.title));
    items.forEach((e, i) => entryBlock(e, i === 0));
  }

  const skills = (cv.skills || []).filter((s) => clean(s.items));
  if (skills.length) {
    heading(L.skills);
    for (const s of skills) {
      ensure(size * 1.4);
      const label = clean(s.label);
      doc.fontSize(size);
      if (label) {
        doc.font("bold").text(`${label}: `, X, doc.y, { width: W, continued: true });
        doc.font("regular").text(clean(s.items), { width: W });
      } else {
        doc.font("regular").text(clean(s.items), X, doc.y, { width: W });
      }
      doc.y += size * 0.15;
    }
  }
}

function build(cv, paper, size, photo, D) {
  const doc = new PDFDocument({
    size: PAPER[paper] || "A4",
    margins: { top: 42, bottom: 42, left: 50, right: 50 },
    bufferPages: true,
    info: { Title: `CV - ${clean(cv.name)}`, Author: clean(cv.name), Creator: "CV Adapter" },
  });
  registerFonts(doc, D);
  doc.lineGap(size * 0.12);
  render(doc, cv, size, photo, D);
  return doc;
}

const toBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

const SIZES = [11, 10.5, 10, 9.5, 9];
const pages = (cv, paper, size, photo, D) => {
  const doc = build(cv, paper, size, photo, D);
  const n = doc.bufferedPageRange().count;
  doc.end();
  return n;
};

/**
 * Quita una cosa de lo menos relevante. Orden: viñetas de secciones extra y de trabajos viejos,
 * después secciones extra completas y trabajos viejos enteros. Los 2 trabajos más recientes
 * conservan hasta 3 viñetas todo lo posible.
 */
function trimOnce(cv) {
  const exp = cv.experience || [];
  const minBullets = (e) => (exp.indexOf(e) > -1 && exp.indexOf(e) < 2 ? 3 : 1);
  const blocks = [...(cv.extra_sections || []).flatMap((s) => s.items || []), ...exp.slice().reverse()];
  const pick = blocks.find((e) => (e.bullets || []).length > minBullets(e));
  if (pick) { pick.bullets.pop(); return true; }
  for (const e of cv.education || []) if ((e.details || []).length) { e.details.pop(); return true; }
  if ((cv.extra_sections || []).length) { cv.extra_sections.pop(); return true; }
  if (exp.length > 2) { exp.pop(); return true; }
  const recent = exp.find((e) => (e.bullets || []).length > 1);
  if (recent) { recent.bullets.pop(); return true; }
  if ((cv.skills || []).length > 2) { cv.skills.pop(); return true; }
  return false;
}

/**
 * Ajusta el CV a UNA página: primero achica la letra (11 → 9 pt) y, si todavía no entra,
 * quita de a una las viñetas menos relevantes. Devuelve el CV ajustado y el tamaño de letra.
 */
export function fitOnePage(cv, paper = "a4", photo = null, design = "harvard") {
  const D = designOf(design);
  for (const size of SIZES) if (pages(cv, paper, size, photo, D) === 1) return { cv, size, trimmed: 0 };
  const copy = structuredClone(cv);
  const size = SIZES.at(-1);
  let trimmed = 0;
  while (trimmed < 60 && trimOnce(copy)) {
    trimmed++;
    if (pages(copy, paper, size, photo, D) === 1) return { cv: copy, size, trimmed };
  }
  return { cv: copy, size, trimmed };
}

/** Genera el PDF en una sola página. */
export async function generatePdf(cv, paper = "a4", photo = null, design = "harvard") {
  const D = designOf(design);
  const fit = fitOnePage(cv, paper, photo, design);
  return toBuffer(build(fit.cv, paper, fit.size, photo, D));
}
