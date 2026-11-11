import { GoogleGenAI } from "@google/genai";
import { CV_SCHEMA, SYSTEM, userPrompt } from "./ai.js";

// Cadena de modelos: principal y respaldos (cada uno con su propio cupo gratis diario).
// Configurable con GEMINI_MODEL y GEMINI_FALLBACK_MODEL (lista separada por comas).
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite,gemini-3.1-flash-lite")
  .split(",").map((m) => m.trim()).filter(Boolean);
const MODELS = [...new Set([MODEL, ...FALLBACKS])];
const NETWORK_RE = /fetch failed|ECONNRESET|ETIMEDOUT|socket|network|Unable to make request/i;

// Modelos que agotaron su cupo gratis: se saltean hasta que se renueva.
const exhaustedUntil = new Map();
/** Lee "Please retry in 5h50m6s" (o "in 30s") del mensaje de Google y lo pasa a milisegundos. */
function retryAfterMs(detail) {
  const m = String(detail).match(/retry in\s+((?:\d+h)?(?:\d+m)?(?:[\d.]+s)?)/i);
  if (!m || !m[1]) return null;
  const h = +(m[1].match(/(\d+)h/)?.[1] || 0), min = +(m[1].match(/(\d+)m/)?.[1] || 0), s = +(m[1].match(/([\d.]+)s/)?.[1] || 0);
  const ms = ((h * 60 + min) * 60 + s) * 1000;
  return ms > 0 ? ms : null;
}
function humanWait(ms) {
  const min = Math.max(1, Math.ceil(ms / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

let client;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

/** Copia del esquema sin "additionalProperties" (Gemini acepta un subconjunto de JSON Schema). */
function geminiSchema(node) {
  if (Array.isArray(node)) return node.map(geminiSchema);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) if (k !== "additionalProperties") out[k] = geminiSchema(v);
  return out;
}
const SCHEMA = geminiSchema(CV_SCHEMA);

/** Código HTTP y detalle de un error de la API de Google (o null si no es un error de la API). */
function apiInfo(err) {
  const status = err?.status ?? err?.statusCode;
  if (typeof status !== "number") return null;
  let detail = "";
  try {
    const body = typeof err.body === "string" ? JSON.parse(err.body) : err.body;
    detail = [].concat(body)[0]?.error?.message || "";
  } catch { /* cuerpo no JSON */ }
  return { status, detail: detail || err.message || "" };
}

async function run(model, input, system = SYSTEM, schema = SCHEMA) {
  const t0 = Date.now();
  const res = await getClient().interactions.create({
    model,
    system_instruction: system,
    // API v1: las partes del mensaje van dentro de un paso "user_input"
    input: [{ type: "user_input", content: input }],
    response_format: { type: "text", mime_type: "application/json", schema },
    generation_config: { thinking_level: process.env.GEMINI_THINKING || "low", max_output_tokens: 32000 },
  });
  console.log(`[gemini] ${model} · ${((Date.now() - t0) / 1000).toFixed(0)} s · ${res.status}`);
  return res;
}

export async function adaptCvGemini({ cvPdfBase64, cvText, jobText, jobUrl, language, extraInfo, extraImages, linkedinPdfBase64 }) {
  const input = [];
  if (cvPdfBase64) {
    input.push({ type: "text", text: "Este es el CV actual de la persona:" });
    input.push({ type: "document", data: cvPdfBase64, mime_type: "application/pdf" });
  } else {
    input.push({ type: "text", text: `<cv_actual>\n${cvText}\n</cv_actual>` });
  }
  if (linkedinPdfBase64) {
    input.push({ type: "text", text: "Este es el perfil completo de LinkedIn de la persona:" });
    input.push({ type: "document", data: linkedinPdfBase64, mime_type: "application/pdf" });
  }
  for (const im of extraImages || []) input.push({ type: "image", data: im.data, mime_type: im.mime });
  input.push({ type: "text", text: userPrompt({ jobText, jobUrl, language, extraInfo, extraImages, linkedinPdfBase64 }) });
  return callGemini(input, SYSTEM, SCHEMA);
}

/** Pedido genérico de texto → JSON con el sistema y esquema indicados (ej. carta de presentación). */
export async function jsonGemini(text, system, schema, images = []) {
  const input = images.map((im) => ({ type: "image", data: im.data, mime_type: im.mime }));
  input.push({ type: "text", text });
  return callGemini(input, system, geminiSchema(schema));
}

async function callGemini(input, system, schema) {
  let interaction;
  // Recorre la cadena de modelos. Cada modelo tiene su propio cupo gratis:
  // - límite alcanzado (429) o modelo no disponible → pasa directo al siguiente
  // - Google saturado (5xx) o corte de conexión → un reintento tras una pausa y, si sigue, el siguiente
  // - cualquier otro error (clave inválida, pedido inválido) → se informa enseguida
  let lastErr;
  let quotaHit = false;
  const now = Date.now();
  const available = MODELS.filter((m) => !(exhaustedUntil.get(m) > now));
  if (!available.length) {
    throw new Error(`Llegaste al límite gratuito diario de Gemini en todos los modelos. Se renueva en ${humanWait(Math.min(...MODELS.map((m) => exhaustedUntil.get(m))) - now)}.`);
  }
  outer: for (const model of available) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        interaction = await run(model, input, system, schema);
        lastErr = null;
        break outer;
      } catch (err) {
        const info = apiInfo(err);
        console.warn(`[gemini] ${model} falló:`, info?.status ?? err.message);
        lastErr = err;
        const network = !info && NETWORK_RE.test(String(err?.message));
        const busy = network || (info && info.status >= 500);
        const quota = info?.status === 429;
        const badModel = info && (info.status === 404 || (info.status === 400 && /model/i.test(info.detail)));
        if (quota) {
          quotaHit = true;
          // Recordamos el modelo sin cupo hasta que Google diga que se renueva (o 1 hora si no lo dice).
          exhaustedUntil.set(model, Date.now() + (retryAfterMs(info.detail) ?? 60 * 60 * 1000));
        }
        if (quota || badModel) continue outer;
        if (busy && attempt === 0) { await new Promise((r) => setTimeout(r, 3000)); continue; }
        if (busy) continue outer;
        break outer;
      }
    }
  }
  if (lastErr) {
    // Si algún modelo agotó su cupo y los demás también fallaron, avisamos del límite diario.
    if (quotaHit && apiInfo(lastErr)?.status !== 400) {
      throw new Error("Llegaste al límite gratuito diario de Gemini (cada modelo permite unos 20 CVs por día). Se renueva cada 24 horas; volvé a intentar más tarde.");
    }
    throw friendlyGemini(lastErr);
  }

  if (interaction.status && interaction.status !== "completed") {
    throw new Error(
      interaction.status === "incomplete"
        ? "El CV es demasiado extenso para procesarlo de una vez. Probá con una versión más corta."
        : "Gemini no pudo completar la adaptación. Intentá de nuevo."
    );
  }
  try {
    return JSON.parse(interaction.output_text || "");
  } catch {
    throw new Error("La respuesta de Gemini llegó incompleta. Intentá de nuevo.");
  }
}

function friendlyGemini(err) {
  const info = apiInfo(err);
  if (!info) {
    if (NETWORK_RE.test(String(err?.message))) {
      return new Error("No se pudo conectar con Gemini (se cortó la conexión). Revisá tu internet y tocá «Reintentar».");
    }
    return err;
  }
  const e = new Error(info.detail);
  if (info.status === 429) e.message = "Llegaste al límite gratuito de Gemini por ahora. Esperá un minuto (o hasta mañana si es el límite diario) y tocá «Reintentar».";
  else if (/api key/i.test(info.detail)) e.message = "La clave de Gemini no es válida. Revisá GEMINI_API_KEY en el archivo .env.";
  else if (info.status === 401 || info.status === 403) e.message = "La clave de Gemini no es válida o no tiene permiso. Revisá GEMINI_API_KEY en el archivo .env.";
  else if (info.status >= 500) e.message = "Gemini está saturado en este momento. Probá de nuevo en unos segundos.";
  else e.message = `Gemini devolvió un error: ${info.detail}`;
  return e;
}
