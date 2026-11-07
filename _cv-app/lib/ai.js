import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";

const str = { type: "string" };
const strList = { type: "array", items: str };
const obj = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const entry = obj({
  organization: str,
  location: str,
  role: str,
  dates: str,
  bullets: strList,
});

/** Estructura del CV adaptado + análisis de la oferta. */
const CV_SCHEMA = obj({
  language: { type: "string", enum: ["es", "en", "pt"] },
  name: str,
  contact: obj({ location: str, email: str, phone: str, linkedin: str, website: str }),
  summary: str,
  experience_first: { type: "boolean" },
  experience: { type: "array", items: entry },
  education: {
    type: "array",
    items: obj({ institution: str, location: str, degree: str, dates: str, details: strList }),
  },
  extra_sections: { type: "array", items: obj({ title: str, items: { type: "array", items: entry } }) },
  skills: { type: "array", items: obj({ label: str, items: str }) },
  analysis: obj({
    job_title: str,
    company: str,
    match_before: { type: "integer" },
    match_after: { type: "integer" },
    keywords_matched: strList,
    keywords_missing: strList,
    changes: strList,
    tips: strList,
  }),
});

const SYSTEM = `Sos un reclutador senior y redactor experto de CVs. Adaptás el CV de una persona a una oferta laboral concreta para maximizar sus chances de pasar el filtro ATS y la lectura humana, en formato Harvard (Harvard Office of Career Services).

Reglas innegociables:
- DATOS FIJOS: copiá exactamente del CV original los nombres de los puestos (role), empresas, instituciones, títulos académicos y fechas. No les agregues palabras ni los "mejores" (por ejemplo, no conviertas "Community Manager" en "Community Manager & Performance Analyst"). Solo podés unificar el formato de las fechas y corregir mayúsculas u ortografía. Si un dato no figura en el CV (por ejemplo, la ubicación de un trabajo), dejá ese campo vacío en lugar de suponerlo.
- VERACIDAD: nunca inventes empleos, títulos, fechas, empresas, cifras, certificaciones ni herramientas que el CV no respalde. Podés reformular, reordenar, priorizar, condensar y usar el vocabulario de la oferta para describir lo que la persona realmente hizo. Si una métrica no existe, no la crees.
- Si la oferta pide algo que el CV no muestra, NO lo agregues al CV: listalo en analysis.keywords_missing y, si corresponde, sugerí en analysis.tips cómo podría cubrirlo honestamente.
- Idioma: escribí el CV en el idioma indicado por el usuario; si es "auto", usá el idioma de la oferta. "language" debe reflejar el idioma final.

Estilo Harvard:
- Viñetas que empiezan con un verbo de acción fuerte CONJUGADO en primera persona: pretérito para logros ("Lideré", "Analicé", "Reduje") o presente para tareas actuales ("Coordino"). En inglés, pasado ("Led", "Analyzed"). Nunca en infinitivo ("Analizar") ni gerundio. Concisas (1–2 líneas), orientadas a logros y resultados, sin pronombres personales ni punto final.
- Priorizá y ordená viñetas por relevancia para la oferta; 3–5 viñetas en experiencias relevantes, 1–2 en las poco relevantes. Podés omitir experiencias muy antiguas o irrelevantes si el CV es largo.
- Objetivo: 1 página para menos de ~10 años de experiencia; máximo 2 páginas.
- summary: 2–3 líneas, específico para este puesto, sin clichés. Dejalo vacío ("") solo si no aporta.
- experience_first: true si la persona tiene experiencia laboral relevante; false si es estudiante o recién graduada.
- Fechas homogéneas (ej. "Mar 2021 – Presente" / "Mar 2021 – Present").
- skills: 2–4 líneas con etiqueta (ej. "Técnicas", "Herramientas", "Idiomas", "Certificaciones"), priorizando las que pide la oferta y la persona realmente tiene.
- extra_sections: liderazgo, voluntariado, proyectos, etc., solo si existen en el CV y suman.
- Campos sin dato: string vacío "".

Análisis (en español, para la persona):
- match_before / match_after: porcentaje 0–100 estimado de compatibilidad con la oferta antes y después de adaptar (sé realista).
- keywords_matched: palabras clave de la oferta que el CV adaptado cubre. keywords_missing: requisitos de la oferta que el CV no respalda.
- changes: lista breve de los cambios concretos que hiciste. tips: 2–4 consejos accionables para la postulación.`;

let client;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error(
      "Falta la clave de API. Pegá tu GEMINI_API_KEY en el archivo .env y reiniciá la app."
    );
  }
  client ??= new Anthropic();
  return client;
}

const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const hasGemini = () => Boolean(process.env.GEMINI_API_KEY);

export function isConfigured() {
  return hasGemini() || hasClaude();
}

/** Texto del pedido (igual para cualquier proveedor). */
export function userPrompt({ jobText, jobUrl, language }) {
  return `<oferta_laboral${jobUrl ? ` url="${jobUrl}"` : ""}>\n${jobText}\n</oferta_laboral>

Idioma del CV final: ${language || "auto"}.
Adaptá el CV a esta oferta siguiendo las reglas y devolvé el resultado con la estructura indicada.`;
}
export { CV_SCHEMA, SYSTEM };

/**
 * Usa Gemini si hay GEMINI_API_KEY; si no, Claude.
 * @param {{cvPdfBase64?: string, cvText?: string, jobText: string, jobUrl?: string, language: string}} input
 */
export async function adaptCv(input) {
  if (hasGemini()) {
    const { adaptCvGemini } = await import("./gemini.js");
    return adaptCvGemini(input);
  }
  return adaptCvClaude(input);
}

async function adaptCvClaude({ cvPdfBase64, cvText, jobText, jobUrl, language }) {
  const content = [];
  if (cvPdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: cvPdfBase64 },
      title: "CV actual",
    });
  } else {
    content.push({ type: "text", text: `<cv_actual>\n${cvText}\n</cv_actual>` });
  }
  content.push({ type: "text", text: userPrompt({ jobText, jobUrl, language }) });

  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: CV_SCHEMA },
    },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("La IA no pudo procesar esta solicitud. Revisá el contenido del CV o de la oferta.");
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("El CV es demasiado extenso para procesarlo de una vez. Probá con una versión más corta.");
  }
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("La respuesta de la IA llegó incompleta. Intentá de nuevo.");
  }
}
