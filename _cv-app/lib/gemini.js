import { GoogleGenAI } from "@google/genai";
import { CV_SCHEMA, SYSTEM, userPrompt } from "./ai.js";

// Modelo principal y de respaldo (configurables con GEMINI_MODEL / GEMINI_FALLBACK_MODEL).
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

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

async function run(model, input) {
  const t0 = Date.now();
  const res = await getClient().interactions.create({
    model,
    system_instruction: SYSTEM,
    // API v1: las partes del mensaje van dentro de un paso "user_input"
    input: [{ type: "user_input", content: input }],
    response_format: { type: "text", mime_type: "application/json", schema: SCHEMA },
    generation_config: { thinking_level: process.env.GEMINI_THINKING || "low", max_output_tokens: 32000 },
  });
  console.log(`[gemini] ${model} · ${((Date.now() - t0) / 1000).toFixed(0)} s · ${res.status}`);
  return res;
}

export async function adaptCvGemini({ cvPdfBase64, cvText, jobText, jobUrl, language }) {
  const input = [];
  if (cvPdfBase64) {
    input.push({ type: "text", text: "Este es el CV actual de la persona:" });
    input.push({ type: "document", data: cvPdfBase64, mime_type: "application/pdf" });
  } else {
    input.push({ type: "text", text: `<cv_actual>\n${cvText}\n</cv_actual>` });
  }
  input.push({ type: "text", text: userPrompt({ jobText, jobUrl, language }) });

  let interaction;
  try {
    interaction = await run(MODEL, input);
  } catch (err) {
    // Si el modelo principal no existe o no está habilitado en tu cuenta, probamos el de respaldo.
    const info = apiInfo(err);
    const badModel = info && (info.status === 404 || (info.status === 400 && /model/i.test(info.detail)));
    if (badModel && FALLBACK_MODEL !== MODEL) {
      try {
        interaction = await run(FALLBACK_MODEL, input);
      } catch (err2) {
        throw friendlyGemini(err2);
      }
    } else {
      throw friendlyGemini(err);
    }
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
  if (!info) return err;
  const e = new Error(info.detail);
  if (info.status === 429) e.message = "Llegaste al límite gratuito de Gemini por ahora. Esperá un minuto (o hasta mañana si es el límite diario) y tocá «Reintentar».";
  else if (/api key/i.test(info.detail)) e.message = "La clave de Gemini no es válida. Revisá GEMINI_API_KEY en el archivo .env.";
  else if (info.status === 401 || info.status === 403) e.message = "La clave de Gemini no es válida o no tiene permiso. Revisá GEMINI_API_KEY en el archivo .env.";
  else if (info.status >= 500) e.message = "Gemini está saturado en este momento. Probá de nuevo en unos segundos.";
  else e.message = `Gemini devolvió un error: ${info.detail}`;
  return e;
}
