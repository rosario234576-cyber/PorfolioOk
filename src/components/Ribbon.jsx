import TextLoop from './TextLoop.jsx'
import './Ribbon.css'

// Cinta naranja animada entre la portada y "Sobre mí"
const SERVICES = ['Branding', 'Redes sociales', 'Gestión de redes', 'Edición de video', 'Packaging', 'Diseño gráfico']

export default function Ribbon() {
  return (
    <div className="ribbon">
      <TextLoop
        className="ribbon__loop"
        text={SERVICES.join(' ✦ ')}
        separator="✦"
        shape="wave"
        curviness={10}
        tilt={0}
        speed={90}
        fontSize={22}
        fontWeight={800}
        letterSpacing={1}
        ribbonColor="#eb5b30"
        color="#ffffff"
        ribbonWidth={44}
        scrollBoost={1}
        pauseOnHover={false}
      />
    </div>
  )
}
