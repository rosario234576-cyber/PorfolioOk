// Prerenderizado para SEO / GEO: mete el HTML de React dentro de dist/index.html
// para que buscadores y asistentes de IA lean el contenido sin ejecutar JS.
// Genera la portada y una página por categoría de Proyectos (dist/proyectos/<slug>/index.html),
// cada una con su título, descripción y canonical.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve, dirname } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ssrDir = resolve(root, 'dist-ssr')
const distDir = resolve(root, 'dist')
const SITE = 'https://www.inkkstudio.art' // dominio real (igual que en index.html)

const { render, ROUTES } = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href)
const template = await readFile(resolve(distDir, 'index.html'), 'utf8')

if (!template.includes('<!--app-html-->')) {
  throw new Error('No se encontró <!--app-html--> en dist/index.html')
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

for (const route of ROUTES) {
  let html = template.replace('<!--app-html-->', render(route.path))
  if (route.title) {
    const title = `${route.title} — Proyectos | Inkk Studio`
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escape(route.lead)}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${route.path}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}${route.path}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
  }
  const outDir = resolve(distDir, '.' + route.path)
  await mkdir(outDir, { recursive: true })
  await writeFile(resolve(outDir, 'index.html'), html)
  console.log('✓ prerenderizado', route.path)
}

await rm(ssrDir, { recursive: true, force: true })
