import {
  AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, TabStopType, TextRun,
} from "docx";
import { LABELS, designOf, fitOnePage } from "./pdf.js";

// Medidas en twips (1 pt = 20 twips). Márgenes iguales a los del PDF.
const PAGE = { a4: { width: 11906, height: 16838 }, letter: { width: 12240, height: 15840 } };
const MARGIN = { top: 840, bottom: 840, left: 1000, right: 1000 };

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const nonEmpty = (arr) => (arr || []).map(clean).filter(Boolean);

/** Genera un .docx editable con el mismo contenido y diseño que el PDF. */
export async function generateDocx(cvIn, paper = "a4", photo = null, design = "harvard") {
  const D = designOf(design);
  // Mismo recorte y tamaño de letra que el PDF, para que el Word también entre en una página.
  const fit = fitOnePage(cvIn, paper, photo?.data || null, design);
  const cv = fit.cv;
  const L = LABELS[cv.language] || LABELS.es;
  const page = PAGE[paper] || PAGE.a4;
  const contentWidth = page.width - MARGIN.left - MARGIN.right;
  const font = D.serif ? "Times New Roman" : "Arial";
  const accent = D.accent.replace("#", "");
  const align = D.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const size = Math.round(fit.size * 2); // en medios puntos (11 pt = 22)
  const out = [];

  const run = (text, opts = {}) => new TextRun({ text, font, size, ...opts });

  // Encabezado: foto (opcional), nombre y contacto
  const c = cv.contact || {};
  const contact = nonEmpty([c.location, c.email, c.phone, c.linkedin, c.website].map((s) =>
    clean(s).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")
  ));
  if (photo) {
    out.push(new Paragraph({
      alignment: align,
      children: [new ImageRun({ type: photo.type, data: photo.data, transformation: { width: 92, height: 92 } })],
    }));
  }
  out.push(new Paragraph({
    alignment: align,
    children: [run(clean(cv.name), { bold: true, size: size + D.nameGap * 2, color: accent })],
  }));
  if (contact.length) {
    out.push(new Paragraph({ alignment: align, spacing: { after: 60 }, children: [run(contact.join("  •  "), { size: size - 1 })] }));
  }

  const heading = (title) => out.push(new Paragraph({
    alignment: align,
    spacing: { before: Math.round(fit.size * 14), after: Math.round(fit.size * 6) },
    border: { bottom: { style: BorderStyle.SINGLE, size: D.serif ? 6 : 12, color: D.ruleColor.replace("#", ""), space: 1 } },
    children: [run(title.toUpperCase(), { bold: true, size: size + 2, color: accent, characterSpacing: 12 })],
  }));

  // Fila con texto a la izquierda y otro alineado a la derecha (lugar / fechas)
  const row = (left, right, leftOpts, before = 0) => {
    left = clean(left);
    right = clean(right);
    if (!left && !right) return;
    out.push(new Paragraph({
      spacing: { before },
      tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
      children: [run(left, leftOpts), ...(right ? [run("\t" + right, { bold: leftOpts.bold && !leftOpts.italics })] : [])],
    }));
  };
  const bullets = (items) => {
    for (const b of nonEmpty(items)) out.push(new Paragraph({ bullet: { level: 0 }, children: [run(b)] }));
  };
  const entry = (e, first) => {
    row(e.organization, e.location, { bold: true }, first ? 0 : Math.round(fit.size * 7));
    row(e.role, e.dates, { italics: true });
    bullets(e.bullets);
  };

  if (clean(cv.summary)) {
    heading(L.summary);
    out.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [run(clean(cv.summary))] }));
  }
  const experience = () => {
    const items = (cv.experience || []).filter((e) => clean(e.organization) || clean(e.role));
    if (!items.length) return;
    heading(L.experience);
    items.forEach((e, i) => entry(e, i === 0));
  };
  const education = () => {
    const items = (cv.education || []).filter((e) => clean(e.institution) || clean(e.degree));
    if (!items.length) return;
    heading(L.education);
    items.forEach((e, i) => entry({ organization: e.institution, location: e.location, role: e.degree, dates: e.dates, bullets: e.details }, i === 0));
  };
  if (cv.experience_first) { experience(); education(); } else { education(); experience(); }

  for (const sec of cv.extra_sections || []) {
    const items = (sec.items || []).filter((e) => clean(e.organization) || clean(e.role) || nonEmpty(e.bullets).length);
    if (!clean(sec.title) || !items.length) continue;
    heading(clean(sec.title));
    items.forEach((e, i) => entry(e, i === 0));
  }

  const skills = (cv.skills || []).filter((s) => clean(s.items));
  if (skills.length) {
    heading(L.skills);
    for (const s of skills) {
      const label = clean(s.label);
      out.push(new Paragraph({
        spacing: { after: 40 },
        children: label ? [run(`${label}: `, { bold: true }), run(clean(s.items))] : [run(clean(s.items))],
      }));
    }
  }

  const doc = new Document({
    creator: clean(cv.name),
    title: `CV - ${clean(cv.name)}`,
    styles: { default: { document: { run: { font, size } } } },
    sections: [{ properties: { page: { size: page, margin: MARGIN } }, children: out }],
  });
  return Packer.toBuffer(doc);
}
