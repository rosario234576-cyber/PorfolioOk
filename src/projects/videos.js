/*
  Edición de video (/proyectos/video/): reels, ads y contenido social por marca.
  Los archivos están en public/media/videos/<marca>/ (bajados de inkkstudio.art).
  `hero`: los videos que van en el abanico de arriba de la página.
*/
const V = '/media/videos'
const list = (slug, n) => Array.from({ length: n }, (_, i) => `${V}/${slug}/${String(i + 1).padStart(2, '0')}.mp4`)

export const VIDEO_BRANDS = [
  { name: 'Invesmar', country: 'Chile', videos: list('invesmar', 7) },
  { name: 'Grupo Maximus', country: 'Argentina', videos: list('maximus-gaming', 5) },
  { name: 'Electronic Games', country: 'Ecuador', videos: list('electronic-games', 3) },
  { name: 'Tu Plan Futuro', country: 'Chile', videos: list('tu-plan-futuro', 6) },
  { name: 'Distribuidora', country: 'Ecuador', videos: list('distribuidora', 2) },
  { name: 'Newsline Report', country: 'Argentina', videos: list('newsline-report', 1) },
  {
    name: 'Otros proyectos',
    country: 'Chile · Argentina',
    videos: [`${V}/otros/01-armado-de-pc.mp4`, `${V}/otros/02-parque-quinta.mp4`, `${V}/otros/03-puerto-montt.mp4`],
  },
]

export const VIDEO_HERO = [
  `${V}/electronic-games/01.mp4`,
  `${V}/invesmar/04.mp4`,
  `${V}/otros/01-armado-de-pc.mp4`,
  `${V}/tu-plan-futuro/01.mp4`,
  `${V}/maximus-gaming/01.mp4`,
]

export const VIDEO_COUNT = VIDEO_BRANDS.reduce((n, b) => n + b.videos.length, 0)
