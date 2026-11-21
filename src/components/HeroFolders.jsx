import FolderFloat from './FolderFloat.jsx'
import { SERVICES } from './services.js'
import './HeroFolders.css'

/*
  Carpetas de servicios flotando a los costados del título de la portada.
  Flotan lento (cada una a su ritmo) y se quedan quietas mientras están abiertas.
  Escritorio: 3 a cada lado. Celular: grilla de 3 × 2 debajo del título.
*/
export default function HeroFolders() {
  return (
    <div id="servicios" className="hero-folders" aria-label="Servicios">
      {SERVICES.map((s, i) => (
        <div key={s.title} className="hero-folder" style={{ '--i': i }}>
          <FolderFloat size="sm" title={s.title} notes={s.notes} />
        </div>
      ))}
    </div>
  )
}
