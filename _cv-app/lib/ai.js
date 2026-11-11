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
    gaps: {
      type: "array",
      items: obj({
        requirement: str,
        points: { type: "integer" },
        why: str,
        question: str,
        suggestion: str,
      }),
    },
    changes: strList,
    tips: strList,
  }),
});

const SYSTEM = `Sos un reclutador senior y redactor experto de CVs. Adaptás el CV de una persona a una oferta laboral concreta para maximizar sus chances de pasar el filtro ATS y la lectura humana, en formato Harvard (Harvard Office of Career Services).

Reglas innegociables:
- DATOS FIJOS: copiá exactamente del CV original los nombres de los puestos (role), empresas, instituciones, títulos académicos y fechas. No les agregues palabras ni los "mejores" (por ejemplo, no conviertas "Community Manager" en "Community Manager & Performance Analyst"). Solo podés unificar el formato de las fechas y corregir mayúsculas u ortografía. Si un dato no figura en el CV (por ejemplo, la ubicación de un trabajo), dejá ese campo vacío en lugar de suponerlo.
- VERACIDAD: nunca inventes empleos, títulos, fechas, empresas, cifras, certificaciones ni herramientas que el CV no respalde. Podés reformular, reordenar, priorizar, condensar y usar el vocabulario de la oferta para describir lo que la persona realmente hizo. Si una métrica no existe, no la crees.
- La "información extra de la persona" (si viene) cuenta como parte del CV: está respaldada y la podés usar.
- Si la oferta pide algo que el CV no muestra, NO lo agregues al CV: listalo en analysis.keywords_missing y, si corresponde, sugerí en analysis.tips cómo podría cubrirlo honestamente.
- Idioma: escribí el CV en el idioma indicado por el usuario; si es "auto", usá el idioma de la oferta. "language" debe reflejar el idioma final.

Estilo Harvard:
- Viñetas que empiezan con un verbo de acción fuerte CONJUGADO en primera persona: pretérito para logros ("Lideré", "Analicé", "Reduje") o presente para tareas actuales ("Coordino"). En inglés, pasado ("Led", "Analyzed"). Nunca en infinitivo ("Analizar") ni gerundio. Concisas (1–2 líneas), orientadas a logros y resultados, sin pronombres personales ni punto final.
- UNA SOLA PÁGINA, SIEMPRE (obligatorio, aunque el CV original tenga varias páginas): el contenido total no debe superar ~550 palabras. Para lograrlo, elegí lo más relevante para la oferta (o para el puesto general indicado): máximo 4 experiencias; 3–4 viñetas en las 2 más relevantes y 1–2 en las demás; omití experiencias antiguas o irrelevantes, cursos menores, referencias y datos personales que no suman (DNI, estado civil, edad, dirección completa).
- Priorizá y ordená viñetas por relevancia para la oferta.
- summary: 2–3 líneas como máximo, específico para este puesto, sin clichés. Dejalo vacío ("") solo si no aporta.
- experience_first: true si la persona tiene experiencia laboral relevante; false si es estudiante o recién graduada.
- Fechas homogéneas (ej. "Mar 2021 – Presente" / "Mar 2021 – Present").
- skills: 2–3 líneas con etiqueta (ej. "Técnicas", "Herramientas", "Idiomas", "Certificaciones"), priorizando las que pide la oferta y la persona realmente tiene.
- extra_sections: liderazgo, voluntariado, proyectos, etc., solo si existen en el CV y suman.
- Campos sin dato: string vacío "".

Análisis (en español, para la persona):
- match_before / match_after: porcentaje 0–100 estimado de compatibilidad con la oferta antes y después de adaptar (sé realista).
- keywords_matched: palabras clave de la oferta que el CV adaptado cubre. keywords_missing: requisitos de la oferta que el CV no respalda.
- gaps: lo que le falta al CV adaptado para llegar al 100%, ordenado de mayor a menor impacto (máximo 6). Cada uno:
  - requirement: el requisito o aspecto, corto (ej. "SQL", "Métricas de resultados", "Inglés avanzado").
  - points: cuántos puntos de porcentaje sumaría si el CV lo cubriera. La suma de todos los points debe ser igual a 100 − match_after.
  - why: por qué resta, en una frase (ej. "La oferta lo pide como requisito excluyente").
  - question: una pregunta directa a la persona para completarlo, en segunda persona (ej. "¿Usaste SQL? ¿Dónde y para qué?").
  - suggestion: qué hacer si no lo tiene, de forma honesta (curso, proyecto, portfolio, cómo mencionarlo en la entrevista).
  Incluí también aspectos de redacción que restan (ej. falta de cifras o resultados medibles) cuando apliquen. Si match_after es 100, gaps va vacío.
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

/**
 * Objetivo cuando no hay una oferta concreta: un puesto en general.
 * Se usa en lugar del texto de la oferta.
 */
export function generalTarget(role, details) {
  const target = role
    ? `Puesto objetivo: ${role}`
    : `Puesto objetivo: no fue indicado. Deducilo del propio CV: el rol más coherente con la experiencia, la formación y las herramientas de la persona (con su nivel de seniority real). No elijas un puesto que el CV no respalde.`;
  return `MODO PUESTO EN GENERAL: no hay una oferta específica.
${target}
${details ? `Detalles que indicó la persona (rubro, nivel, país, foco): ${details}\n` : ""}
Adaptá el CV para postularse a ofertas de ese puesto en general:
- Usá el vocabulario, las competencias y las herramientas que habitualmente piden las ofertas de ese puesto en el mercado${details ? " y según los detalles indicados" : ""}, siempre respaldado por el CV.
- Si el idioma pedido es "auto", escribí el CV en el mismo idioma del CV original.
- El perfil profesional debe presentar a la persona para ese rol, sin mencionar empresas a las que se postula.
- En el análisis: job_title = el puesto objetivo (el indicado o el que dedujiste del CV), company = "" (vacío). match_before / match_after: compatibilidad estimada con una oferta típica de ese puesto. keywords_matched / keywords_missing: competencias y herramientas típicas de ese puesto que el CV cubre o no. tips: consejos para buscar y postularse a ese tipo de puesto.`;
}

/** Texto del pedido (igual para cualquier proveedor). */
export function userPrompt({ jobText, jobUrl, language, extraInfo }) {
  const extra = extraInfo
    ? `\n<informacion_extra_de_la_persona>\n${extraInfo}\n</informacion_extra_de_la_persona>\nEsta información la confirma la propia persona como verdadera y no figura (o figura incompleta) en su CV: integrala donde corresponda (en la experiencia, educación, habilidades o perfil al que pertenece), con la misma prioridad que el CV original. No inventes nada más allá de lo que dice.\n`
    : "";
  return `<oferta_laboral${jobUrl ? ` url="${jobUrl}"` : ""}>\n${jobText}\n</oferta_laboral>
${extra}
Idioma del CV final: ${language || "auto"}.
Adaptá el CV a esta oferta siguiendo las reglas y devolvé el resultado con la estructura indicada.`;
}
export { CV_SCHEMA, SYSTEM, EDIT_SCHEMA, EDIT_SYSTEM };

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

// ---------- Correcciones: ediciones puntuales, sin volver a adaptar todo ----------

const ANALYSIS_SCHEMA = CV_SCHEMA.properties.analysis;

/** La IA devuelve solo las ediciones a aplicar y el análisis recalculado. */
const EDIT_SCHEMA = obj({
  edits: {
    type: "array",
    items: obj({
      action: { type: "string", enum: ["set", "add", "remove"] },
      path: str,
      index: { type: "integer" },
      value: str,
    }),
  },
  analysis: ANALYSIS_SCHEMA,
});

const EDIT_SYSTEM = `Sos un editor de CVs. Recibís un CV YA ADAPTADO a una oferta (en JSON) y nueva información que la persona confirma como verdadera. Tu trabajo es INTEGRAR esa información con la menor cantidad de ediciones posible. NO vuelvas a adaptar ni a reescribir el CV.

Reglas:
- Todo lo que la nueva información no toca debe quedar EXACTAMENTE igual: no reformules, no reordenes, no "mejores" otras viñetas, el perfil ni las habilidades.
- Cada edición es una de estas acciones sobre una ruta del JSON (segmentos separados por punto; los números son posiciones empezando en 0):
  - "set": reemplaza el valor de la ruta. Ej.: path "experience.0.role", value "Diseñadora Senior". Ej.: path "skills.1.items", value con la línea completa actualizada.
  - "add": inserta "value" en la lista de la ruta, en la posición "index" (-1 = al final). Ej.: path "experience.1.bullets", index -1, value "Animé piezas para redes en After Effects". Ej.: path "skills", index -1, value {"label":"Software","items":"After Effects"} escrito como JSON.
  - "remove": quita el elemento "index" de la lista de la ruta (value ""). Usalo solo si hace falta espacio para que el CV siga entrando en una página, y sobre lo menos relevante para la oferta.
- "value" siempre es texto. Para objetos (una experiencia o una habilidad nueva) escribí el objeto como JSON válido. Para "remove" usá "" e index la posición.
- Si la información ya está en el CV, no la dupliques: no hagas ninguna edición para eso.
- Agregá la información donde corresponde (en la experiencia, educación o habilidad a la que pertenece). Viñetas con verbo de acción conjugado, concisas, sin punto final, en el idioma del CV.
- Si la información cambia el enfoque del perfil, podés editar "summary" con un cambio mínimo (agregar o ajustar una frase), no reescribirlo.
- No inventes nada más allá de lo que la persona dice.

Análisis: devolvé el análisis completo recalculado. Partí del análisis anterior: mantené match_before igual; subí match_after según lo que la nueva información cubre; sacá de gaps y de keywords_missing lo que quedó cubierto y pasalo a keywords_matched; no agregues gaps nuevos que antes no estaban salvo que la información revele algo relevante. La suma de points de gaps = 100 − match_after. En "changes" listá solo los cambios de esta edición, en español. tips: dejalos como estaban salvo que dejen de aplicar.`;

/** Aplica una lista de ediciones sobre una copia del CV. Devuelve el CV nuevo y cuántas se aplicaron. */
export function applyEdits(cv, edits) {
  const out = structuredClone(cv);
  let applied = 0;
  const parseValue = (v) => {
    const t = String(v ?? "").trim();
    if (/^[\[{]/.test(t)) { try { return JSON.parse(t); } catch { /* texto */ } }
    return String(v ?? "");
  };
  // Las eliminaciones van de atrás hacia adelante para que no se corran las posiciones.
  const ordered = [...(edits || [])].sort((a, b) =>
    a.action === "remove" && b.action === "remove" && a.path === b.path ? b.index - a.index : 0
  );
  for (const e of ordered) {
    const segs = String(e.path || "").split(".").filter(Boolean).map((k) => (/^\d+$/.test(k) ? Number(k) : k));
    if (!segs.length || segs[0] === "analysis") continue;
    let parent = out;
    for (const k of segs.slice(0, -1)) {
      parent = parent?.[k];
      if (parent == null || typeof parent !== "object") break;
    }
    if (parent == null || typeof parent !== "object") continue;
    const last = segs.at(-1);
    if (e.action === "set") {
      if (!(last in parent)) continue;
      const v = parseValue(e.value);
      if (typeof parent[last] === "string" && typeof v !== "string") continue;
      parent[last] = v;
      applied++;
    } else if (e.action === "add" || e.action === "remove") {
      const list = parent[last];
      if (!Array.isArray(list)) continue;
      if (e.action === "add") {
        const v = parseValue(e.value);
        const dup = typeof v === "string" && list.some((x) => typeof x === "string" && x.trim().toLowerCase() === v.trim().toLowerCase());
        if (dup || (typeof v === "string" && !v.trim())) continue;
        const i = Number.isInteger(e.index) && e.index >= 0 && e.index <= list.length ? e.index : list.length;
        list.splice(i, 0, v);
        applied++;
      } else if (Number.isInteger(e.index) && e.index >= 0 && e.index < list.length) {
        list.splice(e.index, 1);
        applied++;
      }
    }
  }
  return { cv: out, applied };
}

/**
 * Integra información nueva de la persona en un CV ya adaptado, con ediciones puntuales:
 * lo que no se toca queda idéntico. Recalcula el análisis.
 * @param {{cv: object, corrections: string, jobText: string, jobUrl?: string, language: string}} input
 */
export async function refineCv({ cv, corrections, jobText, jobUrl }) {
  const { analysis, ...cvData } = cv;
  const text = `<oferta_laboral${jobUrl ? ` url="${jobUrl}"` : ""}>
${jobText}
</oferta_laboral>

<cv_adaptado_actual formato="json">
${JSON.stringify(cvData, null, 2)}
</cv_adaptado_actual>

<analisis_anterior formato="json">
${JSON.stringify(analysis || {}, null, 2)}
</analisis_anterior>

<informacion_nueva_de_la_persona>
${corrections}
</informacion_nueva_de_la_persona>

Devolvé solo las ediciones mínimas para integrar la información nueva y el análisis recalculado.`;

  let res;
  if (hasGemini()) {
    const { editCvGemini } = await import("./gemini.js");
    res = await editCvGemini(text);
  } else {
    res = await callClaude(EDIT_SYSTEM, EDIT_SCHEMA, [{ type: "text", text }]);
  }
  const { cv: updated, applied } = applyEdits(cvData, res.edits);
  const newAnalysis = { ...(analysis || {}), ...(res.analysis || {}) };
  // "Antes" se refiere siempre al CV original
  if (Number.isFinite(analysis?.match_before)) newAnalysis.match_before = analysis.match_before;
  if (!applied) {
    newAnalysis.changes = ["No hizo falta cambiar el CV: esa información ya estaba incluida."];
  }
  return { ...updated, analysis: newAnalysis };
}

async function adaptCvClaude({ cvPdfBase64, cvText, jobText, jobUrl, language, extraInfo }) {
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
  content.push({ type: "text", text: userPrompt({ jobText, jobUrl, language, extraInfo }) });
  return callClaude(SYSTEM, CV_SCHEMA, content);
}

async function callClaude(system, schema, content) {
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema },
    },
    system,
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
