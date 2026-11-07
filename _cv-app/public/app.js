const $ = (id) => document.getElementById(id);
const MAX_FILES = 15;
const CONCURRENCY = 2; // bajo para respetar el límite gratuito de Gemini

let queue = [];   // archivos elegidos antes de enviar
let jobs = [];    // { id, file, status: queued|working|done|error, result, error, photo, includePhoto }
let selectedId = null;
let result = null; // CV del job seleccionado (lo usa la vista previa editable)
let session = null; // { jobText, jobUrl, language }

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

// ---------- Enviar ----------
$("adapt-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("form-error", "");
  const jobUrl = $("job-url").value.trim();
  let jobText = $("job-text").value.trim();
  if (!queue.length) return showError("form-error", "Agregá al menos un CV.");
  if (!jobUrl && !jobText) return showError("form-error", "Pegá el link de la oferta o su descripción.");
  try {
    localStorage.setItem("cv-a-medida:paper", $("paper").value);
    localStorage.setItem("cv-a-medida:lang", $("language").value);
  } catch { /* ignorar */ }

  const btn = $("submit");
  btn.disabled = true;
  $("submit-label").textContent = "Leyendo la oferta…";
  try {
    if (!jobText) {
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

  session = { jobText, jobUrl, language: $("language").value };
  jobs = queue.map((file, i) => ({ id: `${Date.now()}-${i}`, file, status: "queued", result: null, error: "", photo: null, includePhoto: true }));
  selectedId = null;
  $("job-meta").textContent = "Analizando la oferta";
  show("result-view");
  renderCards();
  renderDetail();
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
  body.append("language", session.language);
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
    const meta = [a.job_title, a.company].filter(has).join(" · ");
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
  $("download-all").textContent = done > 1 ? `Descargar ${done} PDFs` : "Descargar todos";

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
  $("detail").classList.toggle("hidden", !ready);
  $("detail-empty").classList.toggle("hidden", ready);
  if (!ready) return;
  result = job.result;
  const a = result.analysis || {};
  $("side-name").textContent = result.name || job.file.name;
  $("score-before").textContent = score(a.match_before) !== null ? `${a.match_before}%` : "–";
  $("score-after").textContent = score(a.match_after) !== null ? `${a.match_after}%` : "–";
  chips("kw-matched", a.keywords_matched, "—");
  chips("kw-missing", a.keywords_missing, "Ninguno: cubre todos los requisitos.");
  list("changes", a.changes);
  list("tips", a.tips);
  showError("pdf-error", "");
  renderPhoto();
  renderPreview();
}

function chips(id, words, emptyText) {
  $(id).replaceChildren(...(words?.length ? words.map((w) => el("span", "chip", w)) : [el("span", "empty", emptyText)]));
}
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
}
function cropSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = Math.min(600, s);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => reject(new Error("No pude leer la imagen. Probá con JPG o PNG."));
    img.src = URL.createObjectURL(file);
  });
}
const pickPhoto = () => $("photo-input").click();
$("photo-btn").addEventListener("click", pickPhoto);
$("photo-pick").addEventListener("click", pickPhoto);
$("photo-remove").addEventListener("click", () => { const j = currentJob(); if (j) { j.photo = null; renderPhoto(); renderPreview(); } });
$("photo-input").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  const j = currentJob();
  if (!f || !j) return;
  try { j.photo = await cropSquare(f); showError("pdf-error", ""); renderPhoto(); renderPreview(); }
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
}

// ---------- PDF ----------
async function downloadPdf(job) {
  const res = await api("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv: job.result, paper: $("paper").value, photo: job.photo || null }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo generar el PDF.");
  const blob = await res.blob();
  const name = decodeURIComponent((res.headers.get("Content-Disposition") || "").split("''")[1] || "CV.pdf");
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
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
