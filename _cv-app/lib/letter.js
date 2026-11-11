import PDFDocument from "pdfkit";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import { generateJson, obj, str, strList } from "./ai.js";
import { PAPER, designOf, registerFonts, toBuffer } from "./pdf.js";

// ---------- Generación con IA ----------

const LETTER_SCHEMA = obj({
  subject: str,
  greeting: str,
  paragraphs: strList,
  closing: str,
});

const LETTER_SYSTEM = `Sos un reclutador senior que escribe cartas de presentación que consiguen entrevistas. Escribís la carta de la persona a partir de su CV (ya adaptado) y de la oferta o del puesto al que apunta.

Reglas innegociables:
- VERACIDAD: usá solo hechos del CV y de la información que aporte la persona. Nunca inventes empresas, cifras, logros, herramientas ni títulos.
- Idioma: el mismo del CV (campo "language": es, en o pt). Si es español, usá un español neutro, con "usted" si el tono es formal y "vos/tú" nunca en tono formal.
- Primera persona, voz activa, sin clichés ("me dirijo a usted", "soy una persona proactiva", "trabajo en equipo") ni frases vacías.
- Estructura (paragraphs, 3 o 4 párrafos):
  1. Apertura: qué puesto busca y por qué esa empresa o ese tipo de rol, en 2–3 frases concretas.
  2. 1–2 párrafos con 2 o 3 logros o experiencias del CV que respondan a lo que pide la oferta, con resultados si existen. Usá las palabras clave de la oferta de forma natural.
  3. Cierre: qué aportaría y una invitación clara a conversar.
- Largo: "corta" ≈ 150–200 palabras; "media" ≈ 230–300 palabras. Nunca más de una página.
- Tono: "formal" (corporativo, sobrio) o "cercano" (cálido, directo, igual de profesional).
- greeting: el saludo. Si hay destinatario, usalo ("Estimada Sra. Pérez:"). Si no, uno neutro ("Estimado equipo de selección:" / "Dear Hiring Team,").
- closing: la despedida sin el nombre (ej. "Saludos cordiales," / "Best regards,"). El nombre lo agrega la app.
- subject: asunto corto para usar en el mail (ej. "Postulación – Diseñadora Gráfica Senior").
- Si no hay una oferta concreta (modo puesto en general), no nombres ninguna empresa: hablá del tipo de puesto y de equipo.`;

/**
 * Escribe la carta a partir del CV adaptado y la oferta.
 * @param {{cv: object, jobText: string, jobUrl?: string, tone?: string, length?: string, recipient?: string, company?: string, notes?: string}} input
 */
export async function writeLetter({ cv, jobText, jobUrl, tone, length, recipient, company, notes }) {
  const { analysis, ...cvData } = cv;
  const text = `<oferta_laboral${jobUrl ? ` url="${jobUrl}"` : ""}>
${jobText}
</oferta_laboral>

<cv_adaptado formato="json">
${JSON.stringify(cvData, null, 2)}
</cv_adaptado>

Puesto detectado: ${analysis?.job_title || "(sin dato)"}
Empresa: ${company || analysis?.company || "(sin dato)"}
Tono: ${tone === "cercano" ? "cercano" : "formal"}
Largo: ${length === "corta" ? "corta" : "media"}
Destinatario: ${recipient || "(no indicado)"}
${notes ? `<lo_que_la_persona_quiere_destacar>\n${notes}\n</lo_que_la_persona_quiere_destacar>\nEsto lo confirma la persona: podés usarlo como hecho verdadero.\n` : ""}
Escribí la carta siguiendo las reglas.`;
  const res = await generateJson(LETTER_SYSTEM, LETTER_SCHEMA, text);
  return {
    subject: String(res.subject || ""),
    greeting: String(res.greeting || ""),
    paragraphs: (res.paragraphs || []).map(String).filter((p) => p.trim()),
    closing: String(res.closing || ""),
  };
}

// ---------- Exportación ----------

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const MONTHS = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
function dateLine(cv) {
  const lang = MONTHS[cv.language] ? cv.language : "es";
  const d = new Date();
  const city = clean(cv.contact?.location).split(",")[0];
  const date = lang === "en"
    ? `${MONTHS.en[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : `${d.getDate()} de ${MONTHS[lang][d.getMonth()]} de ${d.getFullYear()}`;
  return city ? `${city}, ${date}` : date;
}
const contactLine = (cv) => {
  const c = cv.contact || {};
  return [c.location, c.email, c.phone, c.linkedin, c.website]
    .map((s) => clean(s).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""))
    .filter(Boolean).join("  •  ");
};

function buildLetter(letter, cv, paper, size, D) {
  const doc = new PDFDocument({
    size: PAPER[paper] || "A4",
    margins: { top: 54, bottom: 54, left: 64, right: 64 },
    bufferPages: true,
    info: { Title: `Carta de presentación - ${clean(cv.name)}`, Author: clean(cv.name), Creator: "CV Adapter" },
  });
  registerFonts(doc, D);
  const X = doc.page.margins.left;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.lineGap(size * 0.25);

  // Encabezado igual al del CV elegido
  doc.font("bold").fontSize(size + D.nameGap).fillColor(D.accent).text(clean(cv.name), X, doc.page.margins.top, { width: W, align: D.align });
  doc.fillColor("#000000");
  const contact = contactLine(cv);
  if (contact) doc.moveDown(0.15).font("regular").fontSize(size - 1).text(contact, X, doc.y, { width: W, align: D.align });
  const y = doc.y + 6;
  doc.moveTo(X, y).lineTo(X + W, y).lineWidth(D.ruleWidth).strokeColor(D.ruleColor).stroke();
  doc.y = y + size * 1.6;

  doc.font("regular").fontSize(size).text(dateLine(cv), X, doc.y, { width: W, align: "right" });
  doc.moveDown(1.2);
  if (clean(letter.greeting)) doc.text(clean(letter.greeting), X, doc.y, { width: W });
  doc.moveDown(0.8);
  for (const p of letter.paragraphs || []) {
    if (!clean(p)) continue;
    doc.text(clean(p), X, doc.y, { width: W, align: "justify" });
    doc.moveDown(0.8);
  }
  doc.moveDown(0.4);
  if (clean(letter.closing)) doc.text(clean(letter.closing), X, doc.y, { width: W });
  doc.moveDown(1.4);
  doc.font("bold").text(clean(cv.name), X, doc.y, { width: W });
  return doc;
}

/** PDF de la carta, en una página (achica la letra si hace falta). */
export async function letterPdf(letter, cv, paper = "a4", design = "harvard") {
  const D = designOf(design);
  for (const size of [11.5, 11, 10.5, 10]) {
    const doc = buildLetter(letter, cv, paper, size, D);
    if (doc.bufferedPageRange().count === 1) return toBuffer(doc);
    doc.end();
  }
  return toBuffer(buildLetter(letter, cv, paper, 10, D));
}

/** Word (.docx) editable de la carta. */
export async function letterDocx(letter, cv, paper = "a4", design = "harvard") {
  const D = designOf(design);
  const font = D.serif ? "Times New Roman" : "Arial";
  const accent = D.accent.replace("#", "");
  const align = D.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const size = 23;
  const run = (text, o = {}) => new TextRun({ text, font, size, ...o });
  const page = paper === "letter" ? { width: 12240, height: 15840 } : { width: 11906, height: 16838 };
  const children = [
    new Paragraph({ alignment: align, children: [run(clean(cv.name), { bold: true, size: size + D.nameGap * 2, color: accent })] }),
  ];
  const contact = contactLine(cv);
  if (contact) children.push(new Paragraph({
    alignment: align,
    border: { bottom: { style: "single", size: D.serif ? 6 : 12, color: D.ruleColor.replace("#", ""), space: 6 } },
    children: [run(contact, { size: size - 2 })],
  }));
  children.push(
    new Paragraph({ spacing: { before: 360, after: 240 }, alignment: AlignmentType.RIGHT, children: [run(dateLine(cv))] }),
    new Paragraph({ spacing: { after: 200 }, children: [run(clean(letter.greeting))] }),
    ...(letter.paragraphs || []).filter((p) => clean(p)).map((p) =>
      new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 300 }, children: [run(clean(p))] })),
    new Paragraph({ spacing: { before: 120, after: 360 }, children: [run(clean(letter.closing))] }),
    new Paragraph({ children: [run(clean(cv.name), { bold: true })] }),
  );
  const doc = new Document({
    creator: clean(cv.name),
    title: `Carta de presentación - ${clean(cv.name)}`,
    styles: { default: { document: { run: { font, size } } } },
    sections: [{ properties: { page: { size: page, margin: { top: 1080, bottom: 1080, left: 1280, right: 1280 } } }, children }],
  });
  return Packer.toBuffer(doc);
}
