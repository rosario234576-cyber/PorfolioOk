import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJobPosting } from "./lib/job.js";
import { adaptCv, refineCv, generalTarget, isConfigured } from "./lib/ai.js";
import { generatePdf, fitOnePage } from "./lib/pdf.js";
import { generateDocx } from "./lib/docx.js";
import { authRequired, isAuthed, login, logout, requireAuth } from "./lib/auth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.set("trust proxy", 1); // detrás del proxy HTTPS del hosting
app.use(express.json({ limit: "4mb" }));
app.use(express.static(path.join(here, "public")));

app.get("/api/status", (req, res) =>
  res.json({ configured: isConfigured(), authRequired: authRequired(), authed: isAuthed(req) })
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

app.post("/api/adapt", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) throw new Error("Subí tu CV.");
    const jobUrl = String(req.body.jobUrl || "").trim();
    let jobText = String(req.body.jobText || "").trim();
    const role = String(req.body.role || "").trim().slice(0, 200);
    if (!jobText && req.body.mode === "general") jobText = generalTarget(role, String(req.body.details || "").trim().slice(0, 1500));
    if (!jobText && !jobUrl) throw new Error("Pegá el link de la oferta o escribí el puesto.");

    const cv = await readCv(req.file);
    if (cv.cvText !== undefined && cv.cvText.trim().length < 50) {
      throw new Error("No pude leer texto en tu CV. Probá con otro formato.");
    }
    if (!jobText) jobText = await fetchJobPosting(jobUrl);

    const extraInfo = String(req.body.extraInfo || "").trim().slice(0, 3000);
    const result = await adaptCv({ ...cv, jobText, jobUrl, extraInfo, language: req.body.language });
    res.json(result);
  } catch (err) {
    console.error("[adapt]", err);
    res.status(err.status && err.status >= 500 ? 502 : 400).json({ error: friendly(err) });
  }
});

/** Corrige un CV ya adaptado con información que aporta la persona. */
app.post("/api/refine", async (req, res) => {
  try {
    const { cv, corrections, jobUrl, language, role, details } = req.body || {};
    let jobText = String(req.body?.jobText || "").trim();
    if (!jobText && req.body?.mode === "general") jobText = generalTarget(String(role).trim().slice(0, 200), String(details || "").trim().slice(0, 1500));
    if (!cv?.name) throw new Error("Faltan los datos del CV.");
    if (!String(corrections || "").trim()) throw new Error("Escribí qué querés corregir o agregar.");
    if (!String(jobText || "").trim()) throw new Error("Falta la descripción de la oferta.");
    res.json(await refineCv({ cv, corrections: String(corrections).slice(0, 4000), jobText, jobUrl, language }));
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
  if (!isConfigured()) console.log("  ⚠  Falta ANTHROPIC_API_KEY en el archivo .env\n");
});
