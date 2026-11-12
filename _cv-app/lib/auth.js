import crypto from "node:crypto";

/**
 * Acceso privado con clave.
 * - ACCESS_CODE: tu clave.
 * - ACCESS_CODES: una clave por amigo, "Nombre:clave" separadas por comas
 *   (ej. "Juan:mate-azul-77, Sofi:luna-verde-12"). Para sacarle el acceso a alguien,
 *   borrás su clave: su sesión deja de valer al instante.
 * Si no hay ninguna clave (uso local en tu compu), la app queda abierta.
 */
const USERS = new Map(); // clave -> nombre
if (process.env.ACCESS_CODE) USERS.set(process.env.ACCESS_CODE.trim(), "Admin");
for (const pair of (process.env.ACCESS_CODES || "").split(",")) {
  const i = pair.indexOf(":");
  if (i < 1) continue;
  const name = pair.slice(0, i).trim(), code = pair.slice(i + 1).trim();
  if (name && code) USERS.set(code, name);
}
const SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update(`cv-a-medida:${[...USERS.keys()].sort().join("|")}`).digest("hex");
const hashCode = (code) => crypto.createHash("sha256").update(`${SECRET}:${code}`).digest("base64url").slice(0, 16);
const COOKIE = "cvam_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export const authRequired = () => USERS.size > 0;

const sign = (value) => crypto.createHmac("sha256", SECRET).update(value).digest("base64url");

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Nombre de quien entró (o null si no hay sesión válida). */
export function currentUser(req) {
  if (!authRequired()) return "";
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const [issued, codeHash, mac] = token.split(".");
  if (!issued || !codeHash || !mac || !safeEqual(mac, sign(`${issued}.${codeHash}`))) return null;
  if (!(Date.now() - Number(issued) < MAX_AGE_MS)) return null;
  // La clave tiene que seguir existiendo: si la borraste, la sesión se cae.
  for (const [code, name] of USERS) if (safeEqual(hashCode(code), codeHash)) return name;
  return null;
}
export const isAuthed = (req) => currentUser(req) !== null;

function setCookie(req, res, value, maxAgeMs) {
  const secure = req.secure ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`
  );
}

// Límite de intentos: 8 por IP cada 15 minutos
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 8;
}

export function login(req, res) {
  if (!authRequired()) return res.json({ ok: true });
  const ip = req.ip || "unknown";
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: "Demasiados intentos. Esperá 15 minutos." });
  }
  const code = String(req.body?.code || "").trim();
  let name = null;
  for (const [c, n] of USERS) if (safeEqual(code, c)) name = n;
  if (!name) {
    attempts.get(ip).push(Date.now());
    return res.status(401).json({ error: "Clave incorrecta." });
  }
  attempts.delete(ip);
  const payload = `${Date.now()}.${hashCode(code)}`;
  setCookie(req, res, `${payload}.${sign(payload)}`, MAX_AGE_MS);
  console.log(`[acceso] entró ${name}`);
  res.json({ ok: true, user: name });
}

export function logout(req, res) {
  setCookie(req, res, "", 0);
  res.json({ ok: true });
}

/** Middleware: bloquea la API si no hay sesión válida. */
export function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (user !== null) { req.user = user; return next(); }
  res.status(401).json({ error: "Tu sesión expiró. Ingresá la clave de nuevo.", auth: true });
}
