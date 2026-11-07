import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LABELS = {
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

function registerFonts(doc) {
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

function render(doc, cv, size, photo) {
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
    doc.font("bold").fontSize(size + 1).text(title.toUpperCase(), X, doc.y, {
      width: W,
      align: "center",
      characterSpacing: 0.6,
    });
    const y = doc.y + 1.5;
    doc.moveTo(X, y).lineTo(X + W, y).lineWidth(0.6).strokeColor("#000").stroke();
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
    doc.font("bold").fontSize(size + 7);
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

    doc.font("bold").fontSize(size + 7).text(clean(cv.name), tx, ty, { width: tw });
    if (contact.length) {
      doc.y += 3;
      doc.font("regular").fontSize(size - 0.5).text(contactText, tx, doc.y, { width: tw });
    }
    doc.x = X;
    doc.y = Math.max(doc.y, top + d);
  } else {
    doc.font("bold").fontSize(size + 7).text(clean(cv.name), X, top, { width: W, align: "center" });
    if (contact.length) {
      doc.moveDown(0.15);
      doc.font("regular").fontSize(size - 0.5).text(contact.join("  •  "), X, doc.y, { width: W, align: "center" });
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

function build(cv, paper, size, photo) {
  const doc = new PDFDocument({
    size: PAPER[paper] || "A4",
    margins: { top: 42, bottom: 42, left: 50, right: 50 },
    bufferPages: true,
    info: { Title: `CV - ${clean(cv.name)}`, Author: clean(cv.name), Creator: "CV Adapter" },
  });
  registerFonts(doc);
  doc.lineGap(size * 0.12);
  render(doc, cv, size, photo);
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

/** Genera el PDF Harvard; achica la letra (hasta 9.5 pt) para que entre en 1 página si es posible. */
export async function generatePdf(cv, paper = "a4", photo = null) {
  for (const size of [11, 10.5, 10, 9.5]) {
    const doc = build(cv, paper, size, photo);
    if (doc.bufferedPageRange().count === 1) return toBuffer(doc);
    doc.end();
  }
  return toBuffer(build(cv, paper, 10.5, photo));
}
