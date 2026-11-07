import * as cheerio from "cheerio";

const MAX_CHARS = 30000;

/** Descarga la página de la oferta y devuelve su texto legible. */
export async function fetchJobPosting(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("El link de la oferta no es una URL válida.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("El link debe empezar con http:// o https://");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let html;
  try {
    const res = await fetch(parsed, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    throw new Error(
      `No pude abrir el link (${err.name === "AbortError" ? "tiempo agotado" : err.message}). Pegá el texto de la oferta en el recuadro.`
    );
  } finally {
    clearTimeout(timer);
  }

  const $ = cheerio.load(html);
  const parts = [];

  // 1) Datos estructurados JobPosting (LinkedIn, Indeed, Computrabajo, Greenhouse, Lever...)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const items = [].concat(data["@graph"] || data);
      for (const it of items) {
        if (it && /JobPosting/i.test(String(it["@type"]))) {
          const desc = cheerio.load(String(it.description || "")).text();
          parts.push(
            [
              it.title && `Puesto: ${it.title}`,
              it.hiringOrganization?.name && `Empresa: ${it.hiringOrganization.name}`,
              desc,
            ]
              .filter(Boolean)
              .join("\n")
          );
        }
      }
    } catch {
      /* JSON-LD inválido: se ignora */
    }
  });

  // 2) Texto visible de la página
  $("script, style, noscript, svg, nav, footer, header, iframe, form").remove();
  const title = $("title").text().trim();
  const main = $("main").text() || $("article").text() || $("body").text();
  const visible = main.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

  const text = [title && `Título de la página: ${title}`, ...parts, visible]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_CHARS);

  if (text.replace(/\s/g, "").length < 300) {
    throw new Error(
      "La página no mostró la descripción del puesto (puede requerir inicio de sesión). Pegá el texto de la oferta en el recuadro."
    );
  }
  return text;
}
