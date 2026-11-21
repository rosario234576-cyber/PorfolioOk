import { LogoLoop } from './LogoLoop.jsx'
import './Brands.css'

/*
  Marcas con las que trabajó Inkk Studio.
  Logos optimizados en public/media/marcas (recortados y a 120px de alto).
  w/h = tamaño real del archivo; el alto visible se compensa según la forma
  del logo para que los anchos no "griten" más que los cuadrados.
*/
const BRANDS = [
  { name: 'Electronic Games', file: 'electronic-games.png', w: 765, h: 120 },
  { name: 'Dielec Almacén Eléctrico', file: 'dielec.png', w: 341, h: 120 },
  { name: 'Newsline Report', file: 'newsline-report.png', w: 631, h: 120 },
  { name: 'Luxe Store Cosmetic', file: 'luxe-store.png', w: 258, h: 120 },
  { name: 'Omnitech', file: 'omnitech.png', w: 374, h: 120 },
  { name: 'Tu Plan Futuro', file: 'tu-plan-futuro.png', w: 250, h: 120 },
  { name: 'Real Group Inversiones', file: 'real-group.png', w: 246, h: 120 },
  { name: 'Maximus Gaming', file: 'maximus-gaming.svg', w: 564, h: 104 },
  { name: 'Tienda Segura', file: 'tienda-segura.png', w: 356, h: 120 },
  { name: 'Cokito Shop', file: 'cokito-shop.png', w: 158, h: 120 },
  { name: 'Invesmar Asesoría Inmobiliaria', file: 'invesmar.png', w: 541, h: 120 },
  { name: 'The Best Technology', file: 'the-best-technology.png', w: 407, h: 120 },
  { name: 'Zona DTF Mexicali', file: 'zona-dtf.png', w: 175, h: 120 },
  { name: 'Todo Trabajo', file: 'todo-trabajo.webp', w: 256, h: 56 },
  // TODO: confirmar el nombre de esta marca (logo con una "B")
  { name: 'Marca B', file: 'marca-b.png', w: 120, h: 120 },
]

// Logos anchos se ven más chicos y los cuadrados más grandes (compensación óptica)
const opticalScale = (w, h) => Math.min(1.3, Math.max(0.62, Math.sqrt(3 / (w / h))))

const LOGOS = BRANDS.map((b) => ({
  src: `/media/marcas/${b.file}`,
  alt: b.name,
  title: b.name,
  width: b.w,
  height: b.h,
  scale: opticalScale(b.w, b.h),
}))

const renderLogo = (item) => (
  <img
    src={item.src}
    alt={item.alt}
    width={item.width}
    height={item.height}
    loading="lazy"
    decoding="async"
    draggable={false}
    style={{ height: `calc(var(--logoloop-logoHeight) * ${item.scale.toFixed(2)})` }}
  />
)

export default function Brands() {
  return (
    <section className="brands" aria-labelledby="brands-title">
      <h2 id="brands-title" className="brands__title">
        Marcas que confiaron
      </h2>
      <LogoLoop
        logos={LOGOS}
        renderItem={renderLogo}
        speed={40}
        logoHeight={24}
        gap={56}
        pauseOnHover
        muted={0.7}
        fadeOut
        fadeOutWidth={0.22}
        ariaLabel="Marcas que trabajaron con Inkk Studio"
      />
    </section>
  )
}
