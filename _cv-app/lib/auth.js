import crypto from "node:crypto";

/**
 * Acceso privado con una clave (ACCESS_CODE).
 * Si ACCESS_CODE no está definida (uso local en tu compu), la app queda abierta.
 */
const CODE = process.env.ACCESS_CODE || "";
const SECRET = process.env.SESSION_SECRET || crypto.createHash("sha256").update(`cv-a-medida:${CODE}`).digest("hex");
const COOKIE = "cvam_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export const authRequired = () => CODE.length > 0;

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

export function isAuthed(req) {
  if (!authRequired()) return true;
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const [issued, mac] = token.split(".");
  if (!issued || !mac || !safeEqual(mac, sign(issued))) return false;
  return Date.now() - Number(issued) < MAX_AGE_MS;
}

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
  const code = String(req.body?.code || "");
  if (!safeEqual(code, CODE)) {
    attempts.get(ip).push(Date.now());
    return res.status(401).json({ error: "Clave incorrecta." });
  }
  attempts.delete(ip);
  const issued = String(Date.now());
  setCookie(req, res, `${issued}.${sign(issued)}`, MAX_AGE_MS);
  res.json({ ok: true });
}

export function logout(req, res) {
  setCookie(req, res, "", 0);
  res.json({ ok: true });
}

/** Middleware: bloquea la API si no hay sesión válida. */
export function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: "Tu sesión expiró. Ingresá la clave de nuevo.", auth: true });
}
