const $ = (id) => document.getElementById(id);
const MAX_FILES = 15;
const CONCURRENCY = 2; // bajo para respetar el límite gratuito de Gemini

let queue = [];   // archivos elegidos antes de enviar
let jobs = [];    // { id, file, status: queued|working|done|error, result, error, photo, includePhoto }
let selectedId = null;
let result = null; // CV del job seleccionado (lo usa la vista previa editable)
let session = null; // { jobText, jobUrl, language }
let docTab = "cv";          // "cv" | "letter"
let letterView = "page";    // "page" | "edit"
let letterTimer = null;
let letterSeq = 0;

const has = (s) => String(s ?? "").trim().length > 0;
const extOf = (name) => (name.split(".").pop() || "").toUpperCase().slice(0, 4);

function el(tag, cls, children = []) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  for (const c of [].concat(children)) if (c !== null && c !== undefined && c !== false) n.append(c);
  return n;
}
function showError(id, msg) {
  $(id).textContent = msg || "";
  $(id).classList.toggle("hidden", !msg);
}
function show(view) {
  for (const v of ["login-view", "form-view", "result-view"]) $(v).classList.toggle("hidden", v !== view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- Cola de archivos ----------
function addFiles(list) {
  const ok = /\.(pdf|docx|txt|md)$/i;
  let skipped = 0;
  for (const f of list) {
    if (!ok.test(f.name)) { skipped++; continue; }
    if (queue.some((q) => q.name === f.name && q.size === f.size)) continue;
    if (queue.length >= MAX_FILES) { skipped++; continue; }
    queue.push(f);
  }
  showError("form-error", skipped ? `Se omitieron ${skipped} archivo(s): solo PDF, DOCX o TXT, hasta ${MAX_FILES}.` : "");
  renderQueue();
}
function renderQueue() {
  $("file-list").replaceChildren(...queue.map((f, i) => {
    const rm = el("button", "remove", "×");
    rm.type = "button";
    rm.setAttribute("aria-label", `Quitar ${f.name}`);
    rm.addEventListener("click", () => { queue.splice(i, 1); renderQueue(); });
    return el("li", "", [el("span", "ext", extOf(f.name)), el("span", "name", f.name), rm]);
  }));
  const n = queue.length;
  $("submit-label").textContent = n > 1 ? `Adaptar ${n} CVs` : "Adaptar CV";
}

$("cv-input").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
const dz = $("dropzone");
["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
["dragleave", "drop"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
// Permitir soltar en cualquier parte de la página del formulario
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  if (!$("form-view").classList.contains("hidden") && e.dataTransfer?.files?.length && !dz.contains(e.target)) addFiles(e.dataTransfer.files);
});

$("toggle-text").addEventListener("click", () => {
  $("job-text").classList.toggle("hidden");
  if (!$("job-text").classList.contains("hidden")) $("job-text").focus();
});

try {
  $("paper").value = localStorage.getItem("cv-a-medida:paper") || "a4";
  $("design").value = localStorage.getItem("cv-a-medida:design") || "harvard";
  $("format").value = localStorage.getItem("cv-a-medida:format") || "pdf";
  $("language").value = localStorage.getItem("cv-a-medida:lang") || "auto";
} catch { /* ignorar */ }
// ---------- Acceso ----------
let authRequiredFlag = false;
function needLogin() {
  show("login-view");
  $("logout").classList.add("hidden");
  setTimeout(() => $("login-code").focus(), 50);
}
/** fetch que manda a la pantalla de ingreso si la sesión expiró. */
async function api(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    const data = await res.clone().json().catch(() => ({}));
    if (data.auth) { needLogin(); throw new Error(data.error); }
  }
  return res;
}
fetch("/api/status").then((r) => r.json()).then((s) => {
  authRequiredFlag = s.authRequired;
  if (!s.configured) $("key-warning").classList.remove("hidden");
  if (s.authRequired && !s.authed) return needLogin();
  $("logout").classList.toggle("hidden", !s.authRequired);
  show("form-view");
}).catch(() => show("form-view"));

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("login-error", "");
  const btn = e.submitter || $("login-form").querySelector("button");
  btn.disabled = true;
  try {
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: $("login-code").value }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo ingresar.");
    $("login-code").value = "";
    $("logout").classList.remove("hidden");
    show(jobs.length ? "result-view" : "form-view");
  } catch (err) {
    showError("login-error", err.message);
  } finally {
    btn.disabled = false;
  }
});
$("logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" }).catch(() => {});
  needLogin();
});
renderQueue();

// ---------- Modo: oferta específica / puesto en general ----------
let mode = "offer";
function setMode(m) {
  mode = m;
  document.querySelectorAll(".seg-btn").forEach((b) => {
    const on = b.dataset.mode === m;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $("mode-offer").classList.toggle("hidden", m !== "offer");
  $("mode-general").classList.toggle("hidden", m !== "general");
  showError("form-error", "");
  try { localStorage.setItem("cv-a-medida:mode", m); } catch { /* ignorar */ }
}
document.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
try { if (localStorage.getItem("cv-a-medida:mode") === "general") setMode("general"); } catch { /* ignorar */ }

// ---------- Enviar ----------
$("adapt-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("form-error", "");
  const jobUrl = mode === "offer" ? $("job-url").value.trim() : "";
  let jobText = mode === "offer" ? $("job-text").value.trim() : "";
  const role = mode === "general" ? $("role").value.trim() : "";
  const details = mode === "general" ? $("role-details").value.trim() : "";
  if (!queue.length) return showError("form-error", "Agregá al menos un CV.");
  if (mode === "offer" && !jobUrl && !jobText) return showError("form-error", "Pegá el link de la oferta o su descripción.");
  try {
    localStorage.setItem("cv-a-medida:lang", $("language").value);
  } catch { /* ignorar */ }

  const btn = $("submit");
  btn.disabled = true;
  $("submit-label").textContent = "Leyendo la oferta…";
  try {
    if (mode === "offer" && !jobText) {
      const res = await api("/api/job", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jobUrl }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No pude leer la oferta.");
      jobText = data.text;
    }
  } catch (err) {
    showError("form-error", err.message);
    $("job-text").classList.remove("hidden");
    return;
  } finally {
    btn.disabled = false;
    renderQueue();
  }

  session = { mode, jobText, jobUrl, role, details, extraInfo: $("extra-info").value.trim().slice(0, 3000), language: $("language").value };
  jobs = queue.map((file, i) => ({ id: `${Date.now()}-${i}`, file, status: "queued", result: null, error: "", photo: null, includePhoto: true }));
  selectedId = null;
  $("job-meta").textContent = mode === "general" ? (role ? `${role} · Perfil general` : "Perfil general · puesto según cada CV") : "Analizando la oferta";
  show("result-view");
  renderCards();
  renderDetail();
  jobs.forEach(grabPhotoFromCv);
  runQueue();
});

async function runQueue() {
  const worker = async () => {
    for (;;) {
      const job = jobs.find((j) => j.status === "queued");
      if (!job) return;
      await processJob(job);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
}

async function processJob(job) {
  job.status = "working";
  job.error = "";
  renderCards();
  const body = new FormData();
  body.append("cv", job.file);
  body.append("jobText", session.jobText);
  body.append("jobUrl", session.jobUrl);
  body.append("mode", session.mode);
  body.append("role", session.role);
  body.append("details", session.details);
  body.append("language", session.language);
  body.append("extraInfo", session.extraInfo || "");
  try {
    const res = await api("/api/adapt", { method: "POST", body });
    const data = await res.json().catch(() => ({ error: "Respuesta inválida del servidor." }));
    if (!res.ok) throw new Error(data.error);
    for (const k of ["linkedin", "website"]) {
      if (data.contact?.[k]) data.contact[k] = data.contact[k].replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    }
    job.result = data;
    job.status = "done";
    const a = data.analysis || {};
    const meta = session.mode === "general" ? (session.role ? `${session.role} · Perfil general` : "Perfil general · puesto según cada CV") : [a.job_title, a.company].filter(has).join(" · ");
    if (meta) $("job-meta").textContent = meta;
    if (!selectedId) selectedId = job.id;
  } catch (err) {
    job.status = "error";
    job.error = err.message || "No se pudo adaptar este CV.";
  }
  renderCards();
  renderDetail();
}

$("restart").addEventListener("click", () => {
  if (jobs.some((j) => j.status === "working" || j.status === "queued") && !confirm("Todavía hay CVs en proceso. ¿Empezar de nuevo igual?")) return;
  jobs = [];
  queue = [];
  selectedId = null;
  renderQueue();
  $("job-url").value = "";
  $("job-text").value = "";
  show("form-view");
});

// ---------- Tarjetas ----------
function score(n) { return Number.isFinite(n) ? n : null; }
function sortedJobs() {
  const order = { done: 0, working: 1, queued: 2, error: 3 };
  return [...jobs].sort((a, b) =>
    order[a.status] - order[b.status] ||
    (score(b.result?.analysis?.match_after) ?? -1) - (score(a.result?.analysis?.match_after) ?? -1)
  );
}

function renderCards() {
  const done = jobs.filter((j) => j.status === "done").length;
  const finished = jobs.filter((j) => j.status === "done" || j.status === "error").length;
  $("progress-pill").textContent = `${done} / ${jobs.length}`;
  $("download-all").disabled = done === 0;
  $("download-all").textContent = done > 1 ? `Descargar ${done} CVs` : "Descargar todos";

  let rank = 0;
  $("cards").replaceChildren(...sortedJobs().map((job) => {
    const card = el("button", `card ${job.status}${job.id === selectedId ? " active" : ""}`);
    card.type = "button";
    const name = job.result?.name || job.file.name.replace(/\.[^.]+$/, "");
    card.append(el("p", "card-name", name), el("p", "card-file", job.file.name));

    if (job.status === "done") {
      rank++;
      const a = job.result.analysis || {};
      const after = score(a.match_after), before = score(a.match_before);
      card.append(el("span", "rank", `#${rank}`));
      if (session?.mode === "general" && has(a.job_title)) card.append(el("p", "card-role", a.job_title));
      card.append(el("div", "card-score", [el("span", "after", after !== null ? `${after}%` : "–"), before !== null ? el("span", "before", `antes ${before}%`) : null]));
      const bar = el("div", "bar");
      const base = el("span", "base"); base.style.width = `${before ?? 0}%`;
      const fill = el("span"); fill.style.width = `${after ?? 0}%`;
      bar.append(fill, base);
      card.append(bar);
      card.addEventListener("click", () => { selectedId = job.id; renderCards(); renderDetail(); $("detail").scrollIntoView({ behavior: "smooth", block: "start" }); });
    } else if (job.status === "error") {
      card.append(el("p", "card-error", job.error));
      const retry = el("span", "retry", "Reintentar");
      card.append(retry);
      card.addEventListener("click", () => { job.status = "queued"; renderCards(); runQueue(); });
    } else {
      const s = el("span", "status");
      if (job.status === "working") { const img = el("img"); img.src = "brand/Sello.webp"; img.alt = ""; s.append(img, "Adaptando…"); }
      else s.append("En espera");
      card.append(s, el("div", "bar", el("span")));
      card.disabled = true;
    }
    return el("li", "", card);
  }));

  // Mensaje del panel vacío
  const empty = $("detail-empty");
  if (finished === jobs.length && done === 0) {
    empty.querySelector("h2").textContent = "No se pudo adaptar";
    empty.querySelector("p").textContent = "Revisá el error en cada tarjeta y tocá «Reintentar».";
  } else {
    empty.querySelector("h2").textContent = jobs.length > 1 ? "Analizando CVs…" : "Analizando el CV…";
    empty.querySelector("p").textContent = "Cada CV tarda entre 30 y 90 segundos. Podés abrir cada uno apenas esté listo.";
  }
}

// ---------- Detalle ----------
const currentJob = () => jobs.find((j) => j.id === selectedId);

function renderDetail() {
  const job = currentJob();
  const ready = job?.status === "done";
  $("detail").classList.toggle("hidden", !ready || docTab !== "cv");
  $("letter-detail").classList.toggle("hidden", !ready || docTab !== "letter");
  $("doc-tabs").classList.toggle("hidden", !ready);
  $("detail-empty").classList.toggle("hidden", ready);
  if (!ready) return;
  if (docTab === "letter") renderLetter();
  result = job.result;
  const a = result.analysis || {};
  $("side-name").textContent = result.name || job.file.name;
  const showRole = session?.mode === "general" && has(a.job_title);
  $("side-role").textContent = showRole ? `Orientado a: ${a.job_title}` : "";
  $("side-role").classList.toggle("hidden", !showRole);
  $("score-before").textContent = score(a.match_before) !== null ? `${a.match_before}%` : "–";
  $("score-after").textContent = score(a.match_after) !== null ? `${a.match_after}%` : "–";
  $("score-caption").textContent = session?.mode === "general" ? "Compatibilidad ATS estimada con una oferta típica del puesto" : "Compatibilidad ATS estimada con la oferta";
  $("meter-fill").style.width = `${Math.max(0, Math.min(100, a.match_after ?? 0))}%`;
  chips("kw-matched", a.keywords_matched, "—");
  list("changes", a.changes);
  list("tips", a.tips);
  showError("pdf-error", "");
  showError("refine-error", "");
  showError("gaps-error", "");
  $("refine-text").value = job.refineDraft || "";
  $("undo").classList.toggle("hidden", !job.history?.length);
  renderGaps();
  renderPhoto();
  buildGallery();
  setViewMode(viewMode);
  renderPreview();
}

function chips(id, words, emptyText) {
  $(id).replaceChildren(...(words?.length ? words.map((w) => el("span", "chip", w)) : [el("span", "empty", emptyText)]));
}

// ---------- Para llegar al 100% ----------
function renderGaps() {
  const job = currentJob();
  const a = job.result.analysis || {};
  const gaps = (a.gaps || []).filter((g) => has(g.requirement));
  job.gapAnswers ||= {};
  job.gapOpen ||= {};
  const left = Math.max(0, 100 - (a.match_after ?? 0));
  $("gaps").classList.toggle("hidden", !gaps.length);
  $("gaps-left").textContent = left ? `· faltan ${left} puntos` : "";
  $("gap-list").replaceChildren(...gaps.map((g) => {
    const key = g.requirement;
    const li = el("li", "gap");
    li.append(el("div", "gap-head", [
      el("span", "gap-pts", `+${Math.max(0, g.points || 0)}%`),
      el("div", "gap-text", [el("strong", "", g.requirement), has(g.why) ? el("span", "gap-why", g.why) : null]),
    ]));

    const state = job.gapOpen[key]; // undefined | "have" | "nope"
    const have = el("button", `gap-btn${state === "have" ? " on" : ""}`, "Lo tengo");
    const nope = el("button", `gap-btn${state === "nope" ? " on" : ""}`, "No lo tengo");
    have.type = "button";
    nope.type = "button";
    have.addEventListener("click", () => {
      job.gapOpen[key] = state === "have" ? undefined : "have";
      renderGaps();
      if (job.gapOpen[key]) $("gap-list").querySelector(`[data-gap="${CSS.escape(key)}"]`)?.focus();
    });
    nope.addEventListener("click", () => {
      job.gapOpen[key] = state === "nope" ? undefined : "nope";
      delete job.gapAnswers[key];
      renderGaps();
    });
    li.append(el("div", "gap-actions", [have, nope]));

    if (state === "have") {
      const t = el("textarea", "gap-input");
      t.rows = 2;
      t.dataset.gap = key;
      t.placeholder = has(g.question) ? g.question : `Contá tu experiencia con ${key}`;
      t.value = job.gapAnswers[key] || "";
      t.addEventListener("input", () => { job.gapAnswers[key] = t.value; updateGapsButton(); });
      li.append(t);
    } else if (state === "nope" && has(g.suggestion)) {
      li.append(el("p", "gap-suggest", [el("strong", "", "Sugerencia: "), g.suggestion]));
    }
    return li;
  }));
  updateGapsButton();
}
function answeredGaps(job) {
  return Object.entries(job.gapAnswers || {}).filter(([k, v]) => job.gapOpen?.[k] === "have" && has(v));
}
function updateGapsButton() {
  const job = currentJob();
  const n = job ? answeredGaps(job).length : 0;
  $("gaps-apply").classList.toggle("hidden", n === 0);
  $("gaps-apply-label").textContent = n > 1 ? `Actualizar CV con ${n} respuestas` : "Actualizar CV con tu respuesta";
}
$("gaps-apply").addEventListener("click", async () => {
  const job = currentJob();
  if (!job) return;
  const answers = answeredGaps(job);
  if (!answers.length) return;
  const corrections = "Respuestas de la persona sobre lo que le faltaba al CV:\n" + answers.map(([k, v]) => `- ${k}: ${v.trim()}`).join("\n");
  const ok = await applyRefine(job, corrections, { button: $("gaps-apply"), label: $("gaps-apply-label"), errorId: "gaps-error" });
  if (ok) {
    job.gapAnswers = {};
    job.gapOpen = {};
    if (job.id === selectedId) renderGaps();
  }
});

// ---------- Corregir o agregar información con IA ----------
$("refine-text").addEventListener("input", (e) => { const j = currentJob(); if (j) j.refineDraft = e.target.value; });

/** Envía correcciones a la IA y reemplaza el CV del job. Devuelve true si salió bien. */
async function applyRefine(job, corrections, { button, label, errorId }) {
  showError(errorId, "");
  const prevLabel = label.textContent;
  button.disabled = true;
  label.textContent = "Actualizando…";
  $("preview").classList.add("updating");
  try {
    const res = await api("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cv: job.result, corrections, jobText: session.jobText, jobUrl: session.jobUrl, mode: session.mode, role: session.role, details: session.details, language: session.language }),
    });
    const data = await res.json().catch(() => ({ error: "Respuesta inválida del servidor." }));
    if (!res.ok) throw new Error(data.error);
    for (const k of ["linkedin", "website"]) {
      if (data.contact?.[k]) data.contact[k] = data.contact[k].replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    }
    (job.history ||= []).push(structuredClone(job.result));
    job.result = data;
    renderCards();
    if (job.id === selectedId) {
      renderDetail();
      $("preview").classList.remove("flash");
      void $("preview").offsetWidth;
      $("preview").classList.add("flash");
    }
    return true;
  } catch (err) {
    showError(errorId, err.message || "No se pudo actualizar el CV.");
    return false;
  } finally {
    button.disabled = false;
    label.textContent = prevLabel;
    $("preview").classList.remove("updating");
  }
}

$("refine-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const job = currentJob();
  const corrections = $("refine-text").value.trim();
  showError("refine-error", "");
  if (!job) return;
  if (!corrections) return showError("refine-error", "Escribí qué querés corregir o agregar.");
  $("refine-form").classList.add("busy");
  const ok = await applyRefine(job, corrections, { button: $("refine-btn"), label: $("refine-label"), errorId: "refine-error" });
  $("refine-form").classList.remove("busy");
  if (ok) {
    job.refineDraft = "";
    if (job.id === selectedId) $("refine-text").value = "";
  }
});

$("undo").addEventListener("click", () => {
  const job = currentJob();
  if (!job?.history?.length) return;
  job.result = job.history.pop();
  renderCards();
  renderDetail();
});
function list(id, items) {
  $(id).replaceChildren(...(items || []).map((t) => el("li", "", t)));
}

// ---------- Foto por CV ----------
function renderPhoto() {
  const job = currentJob();
  const p = job?.photo;
  $("photo-img").src = p || "";
  $("photo-img").classList.toggle("hidden", !p);
  $("photo-ph").classList.toggle("hidden", !!p);
  $("photo-btn").classList.toggle("has", !!p);
  $("photo-pick").textContent = p ? "Cambiar" : "Agregar";
  $("photo-remove").classList.toggle("hidden", !p);
  $("photo-note").classList.toggle("hidden", !(p && job?.photoFromCv));
}
/** Recorte cuadrado (en fotos verticales, un poco más arriba para no cortar la cara) sobre fondo blanco. */
function squareJpeg(source, w, h) {
  const s = Math.min(w, h);
  const sx = (w - s) / 2;
  const sy = h > w ? (h - s) * 0.25 : (h - s) / 2;
  const c = document.createElement("canvas");
  c.width = c.height = Math.min(600, s);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(source, sx, sy, s, s, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}
function cropSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const out = squareJpeg(img, img.width, img.height);
      URL.revokeObjectURL(img.src);
      resolve(out);
    };
    img.onerror = () => reject(new Error("No pude leer la imagen. Probá con JPG o PNG."));
    img.src = URL.createObjectURL(file);
  });
}
const pickPhoto = () => $("photo-input").click();
$("photo-btn").addEventListener("click", pickPhoto);
$("photo-pick").addEventListener("click", pickPhoto);
$("photo-remove").addEventListener("click", () => { const j = currentJob(); if (j) { j.photo = null; j.photoFromCv = false; renderPhoto(); renderPreview(); } });

// ---------- Foto incluida en el CV original (PDF) ----------
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/";
let pdfjsPromise;
const loadPdfjs = () =>
  (pdfjsPromise ??= import(PDFJS + "pdf.min.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs";
    return m;
  }));

/** Busca en la 1.ª página del PDF una imagen con forma y tamaño de foto de perfil. Devuelve un JPEG cuadrado o null. */
async function extractPhotoFromPdf(file) {
  try {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const page = await doc.getPage(1);
    const [x0, y0, x1, y1] = page.view;
    const pw = x1 - x0, ph = y1 - y0;
    const { fnArray, argsArray } = await page.getOperatorList();
    const O = pdfjs.OPS;
    const mul = (m, n) => [
      m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
      m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
    ];
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const found = [];
    fnArray.forEach((fn, i) => {
      const args = argsArray[i];
      if (fn === O.save) stack.push(ctm);
      else if (fn === O.restore) ctm = stack.pop() || ctm;
      else if (fn === O.transform) ctm = mul(ctm, args);
      else if (fn === O.paintImageXObject || fn === O.paintInlineImageXObject) {
        const w = Math.hypot(ctm[0], ctm[1]), h = Math.hypot(ctm[2], ctm[3]);
        found.push({ ref: args[0], w, h });
      }
    });
    // Tamaño de foto de perfil: ni ícono ni fondo de página, y forma aproximadamente cuadrada o vertical
    const candidates = found
      .filter(({ w, h }) => w >= 40 && h >= 40 && w < pw * 0.6 && h < ph * 0.5 && w / h > 0.55 && w / h < 1.6)
      .sort((a, b) => b.w * b.h - a.w * a.h);
    for (const c of candidates) {
      const img = typeof c.ref === "string"
        ? await new Promise((res) => (c.ref.startsWith("g_") ? page.commonObjs : page.objs).get(c.ref, res))
        : c.ref;
      const canvas = imageToCanvas(img);
      if (canvas) return squareJpeg(canvas, canvas.width, canvas.height);
    }
  } catch (err) {
    console.warn("No se pudo leer la foto del PDF:", err);
  }
  return null;
}
function imageToCanvas(img) {
  if (!img?.width || !img?.height) return null;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
    return c;
  }
  if (!img.data) return null;
  const out = ctx.createImageData(img.width, img.height);
  const px = img.width * img.height;
  if (img.data.length === px * 4) out.data.set(img.data);
  else if (img.data.length === px * 3) {
    for (let i = 0, j = 0; i < px; i++, j += 3) {
      out.data[i * 4] = img.data[j]; out.data[i * 4 + 1] = img.data[j + 1]; out.data[i * 4 + 2] = img.data[j + 2]; out.data[i * 4 + 3] = 255;
    }
  } else return null;
  ctx.putImageData(out, 0, 0);
  return c;
}
function grabPhotoFromCv(job) {
  if (!/\.pdf$/i.test(job.file.name)) return;
  extractPhotoFromPdf(job.file).then((p) => {
    if (!p || job.photo) return;
    job.photo = p;
    job.photoFromCv = true;
    if (job.id === selectedId) { renderPhoto(); renderPreview(); }
  });
}
$("photo-input").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  const j = currentJob();
  if (!f || !j) return;
  try { j.photo = await cropSquare(f); j.photoFromCv = false; showError("pdf-error", ""); renderPhoto(); renderPreview(); }
  catch (err) { showError("pdf-error", err.message); }
});

// ---------- Vista previa editable ----------
const LABELS = {
  es: { summary: "Perfil Profesional", experience: "Experiencia", education: "Educación", skills: "Habilidades e Intereses" },
  en: { summary: "Summary", experience: "Experience", education: "Education", skills: "Skills & Interests" },
  pt: { summary: "Perfil Profissional", experience: "Experiência", education: "Formação Acadêmica", skills: "Competências e Interesses" },
};
function getPath(p) { return p.reduce((o, k) => o?.[k], result); }
function setPath(p, v) { getPath(p.slice(0, -1))[p.at(-1)] = v; }
function field(tag, cls, path) {
  const n = el(tag, cls);
  n.textContent = getPath(path) ?? "";
  n.contentEditable = "true";
  n.spellcheck = true;
  n.addEventListener("input", () => setPath(path, n.textContent));
  n.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), n.blur()));
  return n;
}
const EXP = ["organization", "location", "role", "dates", "bullets"];
const EDU = ["institution", "location", "degree", "dates", "details"];
function entry(base, keys) {
  const [org, loc, role, dates, bullets] = keys;
  const e = getPath(base);
  const node = el("div", "cv-entry");
  if (has(e[org]) || has(e[loc])) node.append(el("div", "cv-row", [field("span", "b", [...base, org]), field("span", "b", [...base, loc])]));
  if (has(e[role]) || has(e[dates])) node.append(el("div", "cv-row", [field("span", "i", [...base, role]), field("span", "", [...base, dates])]));
  const items = (e[bullets] || []).map((b, i) => (has(b) ? field("li", "", [...base, bullets, i]) : null));
  if (items.some(Boolean)) node.append(el("ul", "cv-bullets", items));
  return node;
}

function renderPreview() {
  const cv = result;
  const job = currentJob();
  if (!cv || !job) return;
  const L = LABELS[cv.language] || LABELS.es;
  const p = $("preview");
  p.replaceChildren();
  for (const d of ["moderno", "ejecutivo", "minimalista"]) p.classList.toggle(`design-${d}`, $("design").value === d);
  const contact = el("p", "cv-contact");
  for (const k of ["location", "email", "phone", "linkedin", "website"]) if (has(cv.contact?.[k])) contact.append(field("span", "", ["contact", k]));
  const header = el("div", "cv-header", [el("div", "", [field("h2", "cv-name", ["name"]), contact])]);
  if (job.photo) {
    const img = el("img", "cv-photo");
    img.src = job.photo;
    img.alt = "";
    header.classList.add("with-photo");
    header.prepend(img);
  }
  p.append(header);

  if (has(cv.summary)) p.append(el("div", "cv-h", L.summary), field("p", "cv-summary", ["summary"]));
  const exp = () => {
    if (!cv.experience?.length) return;
    p.append(el("div", "cv-h", L.experience));
    cv.experience.forEach((_, i) => p.append(entry(["experience", i], EXP)));
  };
  const edu = () => {
    if (!cv.education?.length) return;
    p.append(el("div", "cv-h", L.education));
    cv.education.forEach((_, i) => p.append(entry(["education", i], EDU)));
  };
  cv.experience_first ? (exp(), edu()) : (edu(), exp());
  (cv.extra_sections || []).forEach((s, si) => {
    if (!has(s.title) || !s.items?.length) return;
    p.append(field("div", "cv-h", ["extra_sections", si, "title"]));
    s.items.forEach((_, i) => p.append(entry(["extra_sections", si, "items", i], EXP)));
  });
  const skills = (cv.skills || []).map((s, i) => (has(s.items) ? i : -1)).filter((i) => i >= 0);
  if (skills.length) {
    p.append(el("div", "cv-h", L.skills));
    for (const i of skills) {
      const line = el("p", "cv-skill");
      if (has(cv.skills[i].label)) line.append(field("span", "b", ["skills", i, "label"]), ": ");
      line.append(field("span", "", ["skills", i, "items"]));
      p.append(line);
    }
  }
  schedulePages();
}

// ---------- Descarga (PDF, Word o imagen) ----------
const FORMAT_LABEL = { pdf: "Descargar PDF", docx: "Descargar Word", png: "Descargar imagen" };
function syncExportOptions() {
  $("download-label").textContent = FORMAT_LABEL[$("format").value] || FORMAT_LABEL.pdf;
  try {
    localStorage.setItem("cv-a-medida:design", $("design").value);
    localStorage.setItem("cv-a-medida:format", $("format").value);
    localStorage.setItem("cv-a-medida:paper", $("paper").value);
  } catch { /* ignorar */ }
}
$("design").addEventListener("change", () => { syncExportOptions(); renderPreview(); markDesign(); });
$("format").addEventListener("change", syncExportOptions);
$("paper").addEventListener("change", () => { syncExportOptions(); thumbKeys = {}; renderPreview(); });
syncExportOptions();

// ---------- Vista de hoja completa y miniaturas de cada diseño (generadas desde el PDF real) ----------
const DESIGNS = [["harvard", "Harvard clásico"], ["ejecutivo", "Ejecutivo"], ["moderno", "Moderno"], ["minimalista", "Minimalista"]];
let viewMode = "page";
let thumbKeys = {};   // diseño → clave del contenido con el que se dibujó su miniatura
let pageTimer = null;
let pageSeq = 0;

/** Pide el archivo al servidor con el diseño y la hoja indicados. */
async function exportFile(job, { design = $("design").value, format = "pdf" } = {}) {
  const res = await api("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv: job.result, paper: $("paper").value, design, format, photo: job.photo || null }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo generar el archivo.");
  return { res, blob: await res.blob() };
}

/** Dibuja la primera página de un PDF en un canvas, al ancho en pantalla del canvas. */
async function drawPdf(blob, canvas) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const cssWidth = canvas.getBoundingClientRect().width || 300;
  const scale = (cssWidth * Math.min(2, window.devicePixelRatio || 1)) / base.width;
  const viewport = page.getViewport({ scale });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  doc.destroy?.();
}

function showTrimNote(res) {
  const trimmed = Number(res.headers.get("X-Cv-Trimmed") || 0);
  const note = $("export-note");
  note.textContent = trimmed ? `Para que entre en 1 página se quitaron ${trimmed} viñeta${trimmed > 1 ? "s" : ""} de lo menos relevante. Si querés elegir vos qué sacar, usá «Editar texto».` : "";
  note.classList.toggle("hidden", !trimmed);
}

function buildGallery() {
  const g = $("design-gallery");
  if (g.childElementCount) return markDesign();
  for (const [id, name] of DESIGNS) {
    const btn = el("button", "design-card", [el("div", "design-thumb loading", [el("canvas")]), el("span", "design-name", name)]);
    btn.type = "button";
    btn.dataset.design = id;
    btn.setAttribute("role", "radio");
    btn.addEventListener("click", () => {
      $("design").value = id;
      $("design").dispatchEvent(new Event("change"));
    });
    g.append(btn);
  }
  markDesign();
}
function markDesign() {
  for (const b of $("design-gallery").children) {
    const on = b.dataset.design === $("design").value;
    b.classList.toggle("on", on);
    b.setAttribute("aria-checked", String(on));
  }
}

function setViewMode(m) {
  viewMode = m;
  $("view-page").classList.toggle("on", m === "page");
  $("view-edit").classList.toggle("on", m === "edit");
  $("view-page").setAttribute("aria-selected", String(m === "page"));
  $("view-edit").setAttribute("aria-selected", String(m === "edit"));
  $("page-view").classList.toggle("hidden", m !== "page");
  $("preview").classList.toggle("hidden", m !== "edit");
  $("preview-hint").textContent = m === "page"
    ? "Así queda tu CV, tal cual se descarga."
    : "Hacé clic en cualquier texto para editarlo. Volvé a «Hoja completa» para ver cómo queda.";
  if (m === "page") schedulePages(0);
}
$("view-page").addEventListener("click", () => setViewMode("page"));
$("view-edit").addEventListener("click", () => setViewMode("edit"));
$("preview").addEventListener("input", () => schedulePages(900));

function schedulePages(delay = 400) {
  clearTimeout(pageTimer);
  pageTimer = setTimeout(refreshPages, delay);
}

async function refreshPages() {
  const job = currentJob();
  if (!job || job.status !== "done") return;
  const seq = ++pageSeq;
  const paper = $("paper").value;
  const key = JSON.stringify([job.id, job.result, paper, job.photo ? job.photo.length : 0]);
  $("page-view").classList.toggle("letter", paper === "letter");
  $("design-gallery").classList.toggle("letter", paper === "letter");

  if (viewMode === "page") {
    const view = $("page-view");
    view.classList.add("loading");
    try {
      const { res, blob } = await exportFile(job);
      if (seq !== pageSeq) return;
      showTrimNote(res);
      await drawPdf(blob, $("page-canvas"));
    } catch (err) {
      showError("pdf-error", err.message);
    } finally {
      if (seq === pageSeq) view.classList.remove("loading");
    }
  }

  // Miniaturas: solo se regeneran si cambió el contenido, la hoja o la foto.
  for (const card of $("design-gallery").children) {
    const d = card.dataset.design;
    if (thumbKeys[d] === key) continue;
    const thumb = card.querySelector(".design-thumb");
    thumb.classList.add("loading");
    try {
      const { blob } = await exportFile(job, { design: d });
      if (seq !== pageSeq) return;
      await drawPdf(blob, thumb.querySelector("canvas"));
      thumbKeys[d] = key;
      thumb.classList.remove("loading");
    } catch { /* la miniatura queda en gris; no bloquea */ }
  }
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Convierte el PDF en una imagen PNG (todas las páginas, una debajo de otra) a ~216 ppp. */
async function pdfToPng(blob) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const scale = 3;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = Object.assign(document.createElement("canvas"), { width: Math.ceil(viewport.width), height: Math.ceil(viewport.height) });
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push(canvas);
  }
  const out = Object.assign(document.createElement("canvas"), {
    width: Math.max(...pages.map((c) => c.width)),
    height: pages.reduce((h, c) => h + c.height, 0),
  });
  const octx = out.getContext("2d");
  let y = 0;
  for (const c of pages) { octx.drawImage(c, 0, y); y += c.height; }
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen."))), "image/png"));
}

async function downloadPdf(job) {
  const format = $("format").value;
  const { res, blob } = await exportFile(job, { format: format === "docx" ? "docx" : "pdf" });
  showTrimNote(res);
  const name = decodeURIComponent((res.headers.get("Content-Disposition") || "").split("''")[1] || "CV.pdf");
  if (format === "png") return saveBlob(await pdfToPng(blob), name.replace(/\.pdf$/i, ".png"));
  saveBlob(blob, name);
}

$("download").addEventListener("click", async () => {
  const job = currentJob();
  if (!job) return;
  const btn = $("download");
  btn.disabled = true;
  showError("pdf-error", "");
  try { await downloadPdf(job); } catch (err) { showError("pdf-error", err.message); }
  finally { btn.disabled = false; }
});

$("download-all").addEventListener("click", async () => {
  const btn = $("download-all");
  const label = btn.textContent;
  btn.disabled = true;
  const done = sortedJobs().filter((j) => j.status === "done");
  try {
    for (const [i, job] of done.entries()) {
      btn.textContent = `Descargando ${i + 1} / ${done.length}…`;
      await downloadPdf(job);
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});


// ---------- Carta de presentación ----------

function setDocTab(t) {
  docTab = t;
  $("tab-cv").classList.toggle("on", t === "cv");
  $("tab-letter").classList.toggle("on", t === "letter");
  $("tab-cv").setAttribute("aria-selected", String(t === "cv"));
  $("tab-letter").setAttribute("aria-selected", String(t === "letter"));
  renderDetail();
}
$("tab-cv").addEventListener("click", () => setDocTab("cv"));
$("tab-letter").addEventListener("click", () => setDocTab("letter"));

function renderLetter() {
  const job = currentJob();
  if (!job) return;
  const o = job.letterOpts || {};
  $("letter-tone").value = o.tone || "formal";
  $("letter-length").value = o.length || "media";
  $("letter-company").value = o.company ?? (job.result.analysis?.company || "");
  $("letter-recipient").value = o.recipient || "";
  $("letter-notes").value = o.notes || "";
  const has = Boolean(job.letter?.paragraphs?.length);
  $("letter-empty").classList.toggle("hidden", has);
  $("letter-ready").classList.toggle("hidden", !has);
  $("letter-actions").classList.toggle("hidden", !has);
  $("letter-label").textContent = has ? "Reescribir carta" : "Escribir carta";
  showError("letter-error", "");
  showError("letter-dl-error", "");
  if (!has) return;
  $("letter-subject").textContent = job.letter.subject || "—";
  renderLetterEdit();
  setLetterView(letterView);
}

function letterField(tag, cls, get, set) {
  const n = el(tag, cls);
  n.textContent = get() ?? "";
  n.contentEditable = "true";
  n.spellcheck = true;
  n.addEventListener("input", () => { set(n.textContent); scheduleLetterPage(900); });
  return n;
}
function renderLetterEdit() {
  const job = currentJob();
  const L = job.letter;
  const cv = job.result;
  const c = cv.contact || {};
  const contact = [c.location, c.email, c.phone, c.linkedin, c.website].filter(has).join("  •  ");
  const box = $("letter-edit");
  box.className = "paper letter-paper hidden";
  for (const d of ["moderno", "ejecutivo", "minimalista"]) box.classList.toggle(`design-${d}`, $("design").value === d);
  box.replaceChildren(
    el("div", "lt-head", [el("div", "lt-name", cv.name || ""), el("div", "cv-contact", contact)]),
    letterField("p", "", () => L.greeting, (v) => (L.greeting = v)),
    ...L.paragraphs.map((_, i) => letterField("p", "", () => L.paragraphs[i], (v) => (L.paragraphs[i] = v))),
    letterField("p", "", () => L.closing, (v) => (L.closing = v)),
    el("p", "lt-sign", cv.name || ""),
  );
  box.classList.toggle("hidden", letterView !== "edit");
}

function setLetterView(m) {
  letterView = m;
  $("letter-view-page").classList.toggle("on", m === "page");
  $("letter-view-edit").classList.toggle("on", m === "edit");
  $("letter-view-page").setAttribute("aria-selected", String(m === "page"));
  $("letter-view-edit").setAttribute("aria-selected", String(m === "edit"));
  $("letter-page").classList.toggle("hidden", m !== "page");
  $("letter-edit").classList.toggle("hidden", m !== "edit");
  $("letter-hint").textContent = m === "page"
    ? "Así queda tu carta, tal cual se descarga. Usa el mismo diseño y hoja que tu CV."
    : "Hacé clic en cualquier párrafo para editarlo. Volvé a «Hoja completa» para ver cómo queda.";
  if (m === "page") scheduleLetterPage(0);
}
$("letter-view-page").addEventListener("click", () => setLetterView("page"));
$("letter-view-edit").addEventListener("click", () => setLetterView("edit"));

function scheduleLetterPage(delay = 300) {
  clearTimeout(letterTimer);
  letterTimer = setTimeout(refreshLetterPage, delay);
}

async function exportLetter(job, format = "pdf") {
  const res = await api("/api/letter/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ letter: job.letter, cv: job.result, paper: $("paper").value, design: $("design").value, format }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo generar la carta.");
  return { res, blob: await res.blob() };
}

async function refreshLetterPage() {
  const job = currentJob();
  if (!job?.letter?.paragraphs?.length || docTab !== "letter" || letterView !== "page") return;
  const seq = ++letterSeq;
  const view = $("letter-page");
  view.classList.toggle("letter", $("paper").value === "letter");
  view.classList.add("loading");
  try {
    const { blob } = await exportLetter(job);
    if (seq !== letterSeq) return;
    await drawPdf(blob, $("letter-canvas"));
  } catch (err) {
    showError("letter-dl-error", err.message);
  } finally {
    if (seq === letterSeq) view.classList.remove("loading");
  }
}

function saveLetterOpts(job) {
  job.letterOpts = {
    tone: $("letter-tone").value,
    length: $("letter-length").value,
    company: $("letter-company").value.trim(),
    recipient: $("letter-recipient").value.trim(),
    notes: $("letter-notes").value.trim(),
  };
}
for (const id of ["letter-tone", "letter-length", "letter-company", "letter-recipient", "letter-notes"]) {
  $(id).addEventListener("input", () => { const j = currentJob(); if (j) saveLetterOpts(j); });
}

$("letter-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const job = currentJob();
  if (!job || job.status !== "done") return;
  saveLetterOpts(job);
  const btn = $("letter-btn");
  const label = $("letter-label");
  const prev = label.textContent;
  btn.disabled = true;
  label.textContent = "Escribiendo… (20–40 s)";
  showError("letter-error", "");
  try {
    const res = await api("/api/letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cv: job.result, jobText: session.jobText, jobUrl: session.jobUrl, mode: session.mode,
        role: session.role, details: session.details, ...job.letterOpts,
      }),
    });
    const data = await res.json().catch(() => ({ error: "Respuesta inválida del servidor." }));
    if (!res.ok) throw new Error(data.error);
    if (!data.paragraphs?.length) throw new Error("La IA no devolvió la carta. Probá de nuevo.");
    job.letter = data;
    if (job.id === selectedId) renderLetter();
  } catch (err) {
    showError("letter-error", err.message || "No se pudo escribir la carta.");
    label.textContent = prev;
  } finally {
    btn.disabled = false;
  }
});

function letterPlainText(job) {
  const L = job.letter;
  return [L.greeting, "", ...L.paragraphs.flatMap((p) => [p, ""]), L.closing, job.result.name].join("\n");
}
$("letter-copy").addEventListener("click", async () => {
  const job = currentJob();
  if (!job?.letter) return;
  const btn = $("letter-copy");
  try {
    await navigator.clipboard.writeText(letterPlainText(job));
    btn.textContent = "¡Copiado!";
  } catch {
    btn.textContent = "No se pudo copiar";
  }
  setTimeout(() => (btn.textContent = "Copiar texto"), 1800);
});

$("letter-download").addEventListener("click", async () => {
  const job = currentJob();
  if (!job?.letter) return;
  const btn = $("letter-download");
  btn.disabled = true;
  showError("letter-dl-error", "");
  try {
    const format = $("letter-format").value === "docx" ? "docx" : "pdf";
    const { res, blob } = await exportLetter(job, format);
    const name = decodeURIComponent((res.headers.get("Content-Disposition") || "").split("''")[1] || `Carta.${format}`);
    saveBlob(blob, name);
  } catch (err) {
    showError("letter-dl-error", err.message);
  } finally {
    btn.disabled = false;
  }
});
// Si cambian el diseño o la hoja, la carta se vuelve a dibujar con ellos.
$("design").addEventListener("change", () => { if (docTab === "letter" && currentJob()?.letter) { renderLetterEdit(); scheduleLetterPage(); } });
$("paper").addEventListener("change", () => { if (docTab === "letter") scheduleLetterPage(); });
