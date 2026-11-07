import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJobPosting } from "./lib/job.js";
import { adaptCv, isConfigured } from "./lib/ai.js";
import { generatePdf } from "./lib/pdf.js";
import { authRequired, isAuthed, login, logout, requireAuth } from "./lib/auth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.set("trust proxy", 1); // detrás del proxy HTTPS del hosting
app.use(express.json({ limit: "2mb" }));
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
    if (!jobText && !jobUrl) throw new Error("Pegá el link de la oferta o su descripción.");

    const cv = await readCv(req.file);
    if (cv.cvText !== undefined && cv.cvText.trim().length < 50) {
      throw new Error("No pude leer texto en tu CV. Probá con otro formato.");
    }
    if (!jobText) jobText = await fetchJobPosting(jobUrl);

    const result = await adaptCv({ ...cv, jobText, jobUrl, language: req.body.language });
    res.json(result);
  } catch (err) {
    console.error("[adapt]", err);
    res.status(err.status && err.status >= 500 ? 502 : 400).json({ error: friendly(err) });
  }
});

app.post("/api/pdf", async (req, res) => {
  try {
    const { cv, paper, photo } = req.body || {};
    if (!cv?.name) throw new Error("Faltan los datos del CV.");
    let photoBuf = null;
    const m = typeof photo === "string" && photo.match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (m) photoBuf = Buffer.from(m[2], "base64");
    const pdf = await generatePdf(cv, paper, photoBuf);
    const file = `CV ${cv.name}${cv.analysis?.company ? " - " + cv.analysis.company : ""}.pdf`.replace(/[\\/:*?"<>|]/g, "");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file)}`);
    res.send(pdf);
  } catch (err) {
    console.error("[pdf]", err);
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
  if (!isConfigured()) console.log("  ⚠  Falta ANTHROPIC_API_KEY en el archivo .env\n");
});
