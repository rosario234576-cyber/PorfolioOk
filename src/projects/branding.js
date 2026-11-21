/*
  Casos de Branding (/proyectos/branding/). Cada marca es un caso completo:
  concepto, paleta, tipografía, versiones del logo, proceso (bocetos) si hay,
  páginas del manual y aplicaciones.
  Las imágenes salen de los manuales de marca (PDF) y de los logos finales:
  public/media/obras/branding/<marca>/.
*/
const B = '/media/obras/branding'

export const BRANDS = [
  {
    slug: 'tu-plan-futuro',
    name: 'Tu Plan Futuro',
    sector: 'Inmobiliaria, seguros de vida y pensiones',
    year: '2025',
    tagline: 'Familia, futuro y seguridad en un solo símbolo.',
    // Color de acento del caso (lo usan títulos y detalles)
    accent: '#1CA2AE',
    deliverables: ['Logotipo', 'Isotipo', 'Submarcas', 'Paleta', 'Tipografía', 'Manual de marca', 'Historias destacadas'],
    cover: `${B}/tu-plan-futuro/manual-01.jpg`,
    // Lámina de la marca en la apertura del caso (bg = color del fondo de la imagen)
    hero: { src: `${B}/tu-plan-futuro/hero.jpg`, bg: '#1CA2AE' },
    concept: [
      'Tu Plan Futuro es una empresa familiar que combina experiencia y compromiso en tres áreas: inmobiliaria, seguros de vida y pensiones.',
      'La identidad se apoya en tres pilares —familia, futuro y seguridad— para transmitir la confianza que hace falta al tomar decisiones importantes.',
    ],
    symbols: [
      { title: 'El edificio', text: 'La solidez del sector inmobiliario y la estabilidad que la empresa brinda.' },
      { title: 'La flecha ascendente', text: 'Progreso, crecimiento y proyección hacia el futuro.' },
      { title: 'La paleta', text: 'Turquesa para la confianza, rojo para el dinamismo, negro para el profesionalismo.' },
    ],
    palette: [
      { name: 'Turquesa', hex: '#1CA2AE' },
      { name: 'Rojo', hex: '#E30613' },
      { name: 'Negro', hex: '#1D1D1B' },
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    fonts: [{ name: 'Montserrat', role: 'Textos: moderna y estructurada' }],
    // Rediseño: del logo que tenían antes, pasando por los bocetos, a la marca final
    process: {
      before: { src: `${B}/tu-plan-futuro/boceto-01.jpg`, label: 'Logo anterior' },
      sketches: [
        { src: `${B}/tu-plan-futuro/boceto-02.jpg`, label: 'Variantes con contenedor' },
        { src: `${B}/tu-plan-futuro/boceto-04.jpg`, label: 'Versiones en bloque' },
      ],
      final: { src: `${B}/tu-plan-futuro/logo-04.jpg`, label: 'Marca final' },
    },
    logos: [
      { src: `${B}/tu-plan-futuro/logo-04.jpg`, label: 'Original' },
      { src: `${B}/tu-plan-futuro/logo-06.jpg`, label: 'Negativo turquesa' },
      { src: `${B}/tu-plan-futuro/logo-05.jpg`, label: 'Monocromo' },
      { src: `${B}/tu-plan-futuro/logo-01.jpg`, label: 'Isotipo' },
      { src: `${B}/tu-plan-futuro/logo-07.jpg`, label: 'Pensiones' },
      { src: `${B}/tu-plan-futuro/logo-08.jpg`, label: 'Seguridad' },
      { src: `${B}/tu-plan-futuro/logo-09.jpg`, label: 'Propiedades' },
      { src: `${B}/tu-plan-futuro/logo-11.jpg`, label: 'Submarca en negativo' },
    ],
    manual: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `${B}/tu-plan-futuro/manual-${String(n).padStart(2, '0')}.jpg`),
    // Aplicaciones reales de la marca (grupos; cols = columnas en escritorio)
    applications: [
      {
        title: 'Piezas impresas',
        cols: 4,
        ratio: '4 / 5',
        items: [
          { src: `${B}/tu-plan-futuro/aplicacion-credenciales.jpg`, label: 'Credenciales y cintas' },
          { src: `${B}/tu-plan-futuro/aplicacion-photocall.jpg`, label: 'Photocall para eventos' },
          { src: `${B}/tu-plan-futuro/aplicacion-rollup.jpg`, label: 'Roll up' },
          { src: `${B}/tu-plan-futuro/aplicacion-kit.jpg`, label: 'Kit institucional' },
        ],
      },
      {
        title: 'Historias destacadas de Instagram',
        cols: 6,
        ratio: '1',
        items: [1, 2, 3, 4, 5, 6].map((n) => ({ src: `${B}/tu-plan-futuro/historia-0${n}.jpg` })),
      },
    ],
  },
  {
    slug: 'irazztech',
    name: 'IrazzTech',
    sector: 'Servicio técnico y armado de PC · Almagro, CABA',
    year: '2026',
    tagline: 'La diferencia está en cómo se arma.',
    accent: '#E10600',
    deliverables: ['Logotipo', 'Isotipo ICH', 'Paleta', 'Tipografía', 'Grilla constructiva', 'Tono de voz', 'Manual de marca'],
    // Portada: solo el logo (la portada completa del manual queda en la tira del manual)
    cover: `${B}/irazztech/cover.jpg`,
    hero: { src: `${B}/irazztech/cover.jpg`, bg: '#080808' },
    concept: [
      'IrazzTech es el servicio técnico de PC de Juan Cruz Irazabal, con más de 6000 equipos armados. La idea que sostiene a la marca: el rendimiento de una PC depende tanto de sus componentes como de la forma en que se arma.',
      'La identidad traslada ese criterio a la comunicación: orden, criterio y precisión. La marca no promete calidad; la documenta.',
    ],
    symbols: [
      { title: 'Letras superpuestas', text: 'Las piezas encastran como componentes en un gabinete.' },
      { title: 'El píxel', text: 'Un cuadrado rojo que marca la acción: botones, palabras clave y detalles.' },
      { title: 'Isotipo ICH', text: 'La primera y las dos últimas letras, para avatar, favicon y etiquetas de equipos.' },
    ],
    palette: [
      { name: 'Rojo IrazzTech', hex: '#E10600' },
      { name: 'Negro Lab', hex: '#080808' },
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Blanco Off', hex: '#F5F5F5' },
    ],
    fonts: [
      { name: 'Chakra Petch', role: 'Títulos, botones y etiquetas' },
      { name: 'Barlow', role: 'Textos de lectura' },
    ],
    process: null,
    logos: [
      { src: `${B}/irazztech/logo-01.jpg`, label: 'Principal · fondo claro' },
      { src: `${B}/irazztech/logo-02.jpg`, label: 'Principal · fondo oscuro' },
      { src: `${B}/irazztech/logo-03.jpg`, label: 'Roja con píxel negro' },
      { src: `${B}/irazztech/logo-07.jpg`, label: 'Isotipo ICH' },
      { src: `${B}/irazztech/02.jpg`, label: 'Isotipo monocromo rojo' },
      { src: `${B}/irazztech/logo-05.jpg`, label: 'Monocromo negro' },
      { src: `${B}/irazztech/logo-06.jpg`, label: 'Monocromo blanco' },
    ],
    manual: [1, 3, 4, 7, 8, 9, 10, 13, 14, 15, 16, 17, 19, 24].map((n) => `${B}/irazztech/manual-${String(n).padStart(2, '0')}.jpg`),
    // Tablero de stickers animados (components/StickerBoard.jsx)
    stickers: true,
    // Mockup real (imagen); heading reemplaza el título "Aplicaciones · …"
    applications: [
      {
        title: 'Remera',
        heading: 'Mockups',
        cols: 1,
        ratio: '1024 / 434',
        items: [{ src: `${B}/irazztech/mockup-remera.webp`, label: 'Remera · frente y espalda' }],
      },
    ],
  },
]
