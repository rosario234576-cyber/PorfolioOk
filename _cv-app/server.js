import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJobPosting } from "./lib/job.js";
import { adaptCv, refineCv, generalTarget, isConfigured, transcribeJob } from "./lib/ai.js";
import { generatePdf, fitOnePage } from "./lib/pdf.js";
import { generateDocx } from "./lib/docx.js";
import { writeLetter, letterPdf, letterDocx } from "./lib/letter.js";
import { authRequired, isAuthed, currentUser, login, logout, requireAuth } from "./lib/auth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.set("trust proxy", 1); // detrás del proxy HTTPS del hosting
app.use(express.json({ limit: "25mb" })); // las correcciones pueden traer capturas
app.use(express.static(path.join(here, "public")));

app.get("/api/status", (req, res) =>
  { const user = currentUser(req); res.json({ configured: isConfigured(), authRequired: authRequired(), authed: user !== null, user: user || "" }); }
);
app.post("/api/login", login);
app.post("/api/logout", logout);
app.use("/api", requireAuth);

/** Convierte el archivo subido en algo que la IA puede leer. */
async function readCv(file) {
  const name = file.originalname.toLowerCase();
  if (file.mimetype === "application/pdf" || name.endsWith(".pdf")) {
    return { cvPdfBase64: file.buffer.toString("base64") };
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    return { cvText: value };
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || file.mimetype.startsWith("text/")) {
    return { cvText: file.buffer.toString("utf8") };
  }
  throw new Error("Formato no soportado. Subí tu CV en PDF, DOCX o TXT.");
}

/** Capturas enviadas como data URL (png, jpeg o webp), máximo 6. */
function imagesFrom(list) {
  return (Array.isArray(list) ? list : []).slice(0, 6).map((u) => String(u).match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/))
    .filter(Boolean).map((m) => ({ mime: m[1], data: m[2] }));
}

/** Lee la oferta una sola vez; el navegador reutiliza el texto para cada CV. */
app.post("/api/job", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    if (!url) throw new Error("Pegá el link de la oferta o su descripción.");
    res.json({ text: await fetchJobPosting(url) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** Lee capturas de la oferta (cuando no hay link a mano) y devuelve su texto. */
app.post("/api/job-image", async (req, res) => {
  try {
    const images = imagesFrom(req.body?.images);
    if (!images.length) throw new Error("Subí al menos una captura de la oferta.");
    res.json({ text: await transcribeJob(images) });
  } catch (err) {
    console.error("[job-image]", err);
    res.status(400).json({ error: friendly(err) });
  }
});

app.post("/api/adapt", upload.fields([{ name: "cv", maxCount: 1 }, { name: "extraImage", maxCount: 6 }, { name: "linkedin", maxCount: 1 }]), async (req, res) => {
  if (req.user) console.log(`[uso] ${req.user} adapta un CV`);
  try {
    const cvFile = req.files?.cv?.[0];
    if (!cvFile) throw new Error("Subí tu CV.");
    const jobUrl = String(req.body.jobUrl || "").trim();
    let jobText = String(req.body.jobText || "").trim();
    const role = String(req.body.role || "").trim().slice(0, 200);
    if (!jobText && req.body.mode === "general") jobText = generalTarget(role, String(req.body.details || "").trim().slice(0, 1500));
    if (!jobText && !jobUrl) throw new Error("Pegá el link de la oferta o escribí el puesto.");

    const cv = await readCv(cvFile);
    const extraImages = (req.files?.extraImage || [])
      .filter((f) => /^image\/(png|jpeg|webp)$/.test(f.mimetype))
      .map((f) => ({ mime: f.mimetype, data: f.buffer.toString("base64") }));
    if (cv.cvText !== undefined && cv.cvText.trim().length < 50) {
      throw new Error("No pude leer texto en tu CV. Probá con otro formato.");
    }
    if (!jobText) jobText = await fetchJobPosting(jobUrl);

    const extraInfo = String(req.body.extraInfo || "").trim().slice(0, 3000);
    const li = req.files?.linkedin?.[0];
    if (li && !(li.mimetype === "application/pdf" || /\.pdf$/i.test(li.originalname))) throw new Error("El perfil de LinkedIn tiene que ser el PDF que descarga LinkedIn (Más → Guardar en PDF).");
    const linkedinPdfBase64 = li ? li.buffer.toString("base64") : "";
    const result = await adaptCv({ ...cv, jobText, jobUrl, extraInfo, extraImages, linkedinPdfBase64, language: req.body.language });
    res.json(result);
  } catch (err) {
    console.error("[adapt]", err);
    res.status(err.status && err.status >= 500 ? 502 : 400).json({ error: friendly(err) });
  }
});

/** Corrige un CV ya adaptado con información que aporta la persona. */
app.post("/api/refine", async (req, res) => {
  if (req.user) console.log(`[uso] ${req.user} corrige un CV`);
  try {
    const { cv, corrections, jobUrl, language, role, details } = req.body || {};
    let jobText = String(req.body?.jobText || "").trim();
    if (!jobText && req.body?.mode === "general") jobText = generalTarget(String(role).trim().slice(0, 200), String(details || "").trim().slice(0, 1500));
    if (!cv?.name) throw new Error("Faltan los datos del CV.");
    if (!String(corrections || "").trim() && !imagesFrom(req.body?.images).length) throw new Error("Escribí qué querés corregir o agregar, o pegá una captura.");
    if (!String(jobText || "").trim()) throw new Error("Falta la descripción de la oferta.");
    res.json(await refineCv({ cv, corrections: String(corrections).slice(0, 4000), images: imagesFrom(req.body?.images), jobText, jobUrl, language }));
  } catch (err) {
    console.error("[refine]", err);
    res.status(400).json({ error: friendly(err) });
  }
});

/** Descarga el CV en PDF o Word, con el diseño y la hoja elegidos. */
async function exportCv(req, res, forced) {
  try {
    const { cv, paper, photo, design } = req.body || {};
    const format = forced || (req.body?.format === "docx" ? "docx" : "pdf");
    if (!cv?.name) throw new Error("Faltan los datos del CV.");
    let photoBuf = null;
    let photoType = "jpg";
    const m = typeof photo === "string" && photo.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (m) {
      photoBuf = Buffer.from(m[2], "base64");
      photoType = m[1] === "png" ? "png" : "jpg";
    }
    const base = `CV ${cv.name}${cv.analysis?.company ? " - " + cv.analysis.company : ""}`.replace(/[\\/:*?"<>|]/g, "");
    // Se ajusta a una página una sola vez y se usa el mismo recorte para PDF y Word.
    const fit = fitOnePage(cv, paper, photoBuf, design);
    res.setHeader("X-Cv-Trimmed", String(fit.trimmed));
    res.setHeader("Access-Control-Expose-Headers", "X-Cv-Trimmed");
    let body, type, file;
    if (format === "docx") {
      body = await generateDocx(fit.cv, paper, photoBuf ? { data: photoBuf, type: photoType } : null, design);
      type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      file = base + ".docx";
    } else {
      body = await generatePdf(fit.cv, paper, photoBuf, design);
      type = "application/pdf";
      file = base + ".pdf";
    }
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file)}`);
    res.send(body);
  } catch (err) {
    console.error("[export]", err);
    res.status(400).json({ error: err.message });
  }
}
app.post("/api/export", (req, res) => exportCv(req, res));
app.post("/api/pdf", (req, res) => exportCv(req, res, "pdf"));

/** Escribe la carta de presentación a partir del CV adaptado y la oferta. */
app.post("/api/letter", async (req, res) => {
  try {
    const { cv, jobUrl, mode, role, details, tone, length, recipient, company, notes } = req.body || {};
    let jobText = String(req.body?.jobText || "").trim();
    if (!jobText && mode === "general") jobText = generalTarget(String(role || "").trim().slice(0, 200), String(details || "").trim().slice(0, 1500));
    if (!cv?.name) throw new Error("Faltan los datos del CV.");
    if (!jobText) throw new Error("Falta la descripción de la oferta.");
    const clip = (v, n) => String(v || "").trim().slice(0, n);
    res.json(await writeLetter({
      cv, jobText, jobUrl,
      tone: clip(tone, 20), length: clip(length, 20), recipient: clip(recipient, 120),
      company: clip(company, 120), notes: clip(notes, 2000),
    }));
  } catch (err) {
    console.error("[letter]", err);
    res.status(400).json({ error: friendly(err) });
  }
});

/** Descarga la carta en PDF o Word, con el mismo diseño que el CV. */
app.post("/api/letter/export", async (req, res) => {
  try {
    const { letter, cv, paper, design } = req.body || {};
    if (!cv?.name || !letter?.paragraphs?.length) throw new Error("Primero generá la carta.");
    const docx = req.body?.format === "docx";
    const body = docx ? await letterDocx(letter, cv, paper, design) : await letterPdf(letter, cv, paper, design);
    const file = `Carta de presentación ${cv.name}${cv.analysis?.company ? " - " + cv.analysis.company : ""}.${docx ? "docx" : "pdf"}`.replace(/[\\/:*?"<>|]/g, "");
    res.setHeader("Content-Type", docx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file)}`);
    res.send(body);
  } catch (err) {
    console.error("[letter-export]", err);
    res.status(400).json({ error: err.message });
  }
});

function friendly(err) {
  if (err.status === 401) return "La clave de API no es válida. Revisá el archivo .env.";
  if (/credit balance/i.test(err.message || "")) {
    return "Tu cuenta de Claude Console no tiene saldo. Cargá crédito en «Añadir fondos» (console.anthropic.com) y probá de nuevo.";
  }
  if (err.status === 429) return "Demasiadas solicitudes seguidas. Esperá un minuto y probá de nuevo.";
  if (err.status === 529 || err.status >= 500) return "El servicio de IA está saturado. Probá de nuevo en unos segundos.";
  return err.message || "Ocurrió un error inesperado.";
}

app.listen(PORT, () => {
  console.log(`\n  CV Adapter listo en  http://localhost:${PORT}\n`);
  if (!isConfigured()) console.log("  ⚠  Falta GEMINI_API_KEY en el archivo .env\n");
});
