import OBRAS from './obras.json'
import { BRANDS } from './branding.js'
import { VIDEO_COUNT } from './videos.js'

/*
  Páginas de Proyectos: una por categoría. Cada una agrupa los trabajos por marca.
  Las imágenes salen de public/media/obras (versiones optimizadas de
  public/media/Trabajos); obras.json guarda rutas y tamaños.
  Para cambiar textos, editar esta lista.
*/
// Piezas de Diseño gráfico que no están en obras.json (fotos de lo producido)
const TPF = '/media/obras/branding/tu-plan-futuro'
const EXTRA_GRAPHIC = [
  {
    brand: 'Tu Plan Futuro · Eventos',
    items: ['credenciales', 'photocall', 'rollup', 'kit'].map((n) => ({
      src: `${TPF}/aplicacion-${n}.jpg`,
      full: `${TPF}/aplicacion-${n}.jpg`,
      w: 480,
      h: n === 'kit' ? 640 : 599,
    })),
  },
]

export const CATEGORIES = [
  {
    // Branding no usa obras.json: cada marca es un caso (src/projects/branding.js)
    slug: 'branding',
    title: 'Branding',
    lead: 'Identidades completas: del boceto al manual de marca. Concepto, logo, paleta, tipografía y aplicaciones.',
  },
  {
    slug: 'redes-sociales',
    title: 'Redes sociales',
    lead: 'Posteos, carruseles y piezas para Instagram y LinkedIn, pensados para que cada marca se reconozca en el feed.',
  },
  {
    // Video tampoco usa obras.json: los reels están en src/projects/videos.js
    slug: 'video',
    title: 'Edición de video',
    lead: 'Reels, ads y contenido social con ritmo, cortes prolijos y ganas de que le den play.',
  },
  {
    slug: 'fotografia',
    title: 'Fotografía',
    lead: 'Fotografía de producto con edición propia: luz, encuadre y color al servicio de lo que se vende.',
  },
  {
    // La URL sigue siendo /packaging-carteleria/ (no romper links); la cartelería pasó a Diseño gráfico
    slug: 'packaging-carteleria',
    title: 'Packaging',
    lead: 'Cajas, etiquetas y envases: diseño que sale de la pantalla y se toca.',
  },
  {
    // Usa los grupos de cartelería e impresos de obras.json (packaging-carteleria) + piezas de eventos
    slug: 'diseno-grafico',
    title: 'Diseño gráfico',
    lead: 'Cartelería, roll ups, credenciales, banners y piezas impresas para que la marca se vea igual en todas partes.',
  },
  {
    slug: 'web',
    title: 'Web',
    lead: 'Sitios pensados para cada marca, en escritorio y en celular.',
  },
].map((c) => {
  if (c.slug === 'branding') {
    return { ...c, href: `/proyectos/${c.slug}/`, groups: [], count: BRANDS.length, cover: BRANDS[0].logos[0].src }
  }
  if (c.slug === 'video') {
    return { ...c, href: '/proyectos/video/', groups: [], count: VIDEO_COUNT, cover: '/media/obras/fotografia/maximus-gaming/01.webp' }
  }
  // Cartelería e impresos viven en obras.json dentro de packaging-carteleria:
  // van a Diseño gráfico; Packaging se queda con el resto
  const isGraphic = (g) => /Cartelería|Impresos/.test(g.brand)
  let data = OBRAS[c.slug] || []
  if (c.slug === 'packaging-carteleria') data = data.filter((g) => !isGraphic(g))
  if (c.slug === 'diseno-grafico') data = [...(OBRAS['packaging-carteleria'] || []).filter(isGraphic), ...EXTRA_GRAPHIC]
  const groups = c.slug === 'web' ? data : data.filter((g) => g.items.length)
  const count = c.slug === 'web' ? groups.length : groups.reduce((n, g) => n + g.items.length, 0)
  const cover = c.slug === 'web' ? groups[0]?.desktop.src : groups[0]?.items[0]?.src
  return { ...c, href: `/proyectos/${c.slug}/`, groups, count, cover }
})

// Ruta → categoría (o null si es la portada)
export function categoryFromPath(path = '/') {
  const m = /^\/proyectos\/([^/]+)\/?$/.exec(path)
  return m ? CATEGORIES.find((c) => c.slug === m[1]) || null : null
}
