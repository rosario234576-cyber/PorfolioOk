# CV a Medida

Subís tu CV y el link de una oferta laboral: la app lee el puesto, adapta tu CV con IA (Gemini de Google, gratis con límites; Claude opcional) y te entrega un **PDF en formato Harvard**, listo para enviar.

## Primera vez (2 minutos)

1. Creá una clave gratis de Gemini en https://aistudio.google.com/apikey
2. En esta carpeta, copiá `.env.example` como `.env` y pegá tu clave en `GEMINI_API_KEY=`
3. Hacé doble clic en **`Iniciar.bat`**. Se abre http://localhost:3000

## Uso

1. **Tu CV**: arrastralo (PDF, DOCX o TXT). Queda guardado en el navegador para la próxima vez.
2. **El objetivo**, en uno de dos modos:
   - **Oferta específica:** pegá el link. Si el sitio pide iniciar sesión (por ejemplo, LinkedIn), pegá el texto de la oferta.
   - **Puesto en general:** sin oferta concreta. Podés escribir el puesto o dejarlo vacío para que la IA lo deduzca de cada CV.
3. **Adaptar mi CV**: en 30–90 segundos ves la vista previa, el % de compatibilidad, las palabras clave cubiertas y las faltantes.
4. Podés **editar cualquier texto** haciendo clic en la vista previa.
- **Foto:** si el CV en PDF trae una foto, se copia sola al CV adaptado (dice «Tomada de tu CV original»). Podés cambiarla o quitarla desde el panel.
- **Para llegar al 100%:** debajo del porcentaje ves qué falta, cuántos puntos suma cada cosa y por qué. Tocá «Lo tengo», contalo y «Actualizar CV»; o «No lo tengo» para ver una sugerencia.
- **Corregir o agregar información:** en el panel derecho escribís qué está mal o qué falta (o tocás un requisito faltante). La IA devuelve solo las ediciones puntuales (agregar una viñeta, cambiar un dato) y la app las aplica: lo que ya estaba bien queda idéntico. Actualiza la compatibilidad. Tiene botón **Deshacer**.
- **Información extra (opcional, antes de adaptar):** lo que tu CV no dice y querés que se tenga en cuenta; la IA lo integra desde la primera adaptación. También podés **arrastrar, pegar (Ctrl+V) o elegir capturas** (certificados, cursos, tu LinkedIn, un logro): la IA lee el texto de las imágenes. Hasta 6 capturas; lo mismo funciona en «Corregir o agregar información».
- **Elegir diseño:** arriba de la vista previa ves los 4 diseños en miniatura con tu CV real; la vista «Hoja completa» muestra la página A4 o Carta tal cual se descarga, y «Editar texto» permite tocar cualquier texto.
- **Perfil de LinkedIn completo (opcional):** en el paso 03 subís el PDF de tu perfil (en LinkedIn: «Más» → «Guardar en PDF»). La IA analiza todas tus experiencias, tareas, cursos y aptitudes y elige lo más relevante para cada oferta, sin que tengas que cargarlas una por una. Queda guardado en el navegador. LinkedIn no permite leer perfiles desde el link, por eso se usa su PDF oficial.
- **Carta de presentación:** en la pestaña «Carta de presentación» elegís tono (formal o cercano), largo (media o corta) y, si querés, empresa, destinatario y qué destacar. La IA la escribe con los logros reales de tu CV adaptado y la oferta. Se ve en hoja completa con el mismo diseño y hoja que el CV, se edita párrafo por párrafo, se descarga en PDF o Word y se copia el texto para pegarlo en un mail (con el asunto sugerido).
5. **Descargar**: elegí **Diseño** (Harvard clásico, Ejecutivo, Moderno o Minimalista; todos de una columna, aptos para ATS), **Archivo** (PDF, Word .docx o imagen PNG) y **Hoja** (A4 o Carta).
   - El CV sale **siempre en 1 página**, aunque el original tenga varias: la IA ya lo escribe corto y, si igual no entra, la app achica la letra (hasta 9 pt) y quita las viñetas menos relevantes. Si quitó algo, te avisa debajo del botón.

## Qué hace la IA (y qué no)

- Reescribe y reordena tus logros con el vocabulario de la oferta, prioriza lo relevante y arma un perfil específico para el puesto.
- **No inventa** experiencia, títulos, cifras ni herramientas. Lo que la oferta pide y tu CV no muestra aparece en «Requisitos que tu CV no muestra», con consejos.

## Publicarla en internet (privada, con clave)

Esta carpeta vive dentro del repositorio del portfolio. Empieza con «_», así GitHub Pages no la publica como parte de la web.

1. En https://render.com → **New → Web Service** → conectá el repositorio `PorfolioOk`.
2. Configurá:
   - **Root Directory:** `_cv-app`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. En **Environment** agregá:
   - `GEMINI_API_KEY` = tu clave de Gemini
   - `ACCESS_CODE` = tu clave para entrar a la app (elegí una larga)
   - `ACCESS_CODES` = (opcional) una clave por amigo: `Juan:mate-azul-77, Sofi:luna-verde-12`
4. Opcional: en *Settings → Custom Domain* agregá `cv.inkkstudio.art` y creá el registro CNAME que te indique Render en tu proveedor de dominio.

Nunca subas el archivo `.env` (ya está excluido en `.gitignore`). Con `ACCESS_CODE` o `ACCESS_CODES` definidas la app pide la clave al entrar: la sesión dura 30 días y se bloquea tras 8 intentos fallidos en 15 minutos.

### Acceso para amigos

Cada amigo tiene su propia clave (`ACCESS_CODES`). Al entrar ve «Hola, Nombre» y en los logs de Render queda quién entró y cuántos CVs adaptó (`[acceso]` y `[uso]`). Para sacarle el acceso a alguien, borrá su clave en *Environment*: Render reinicia la app y su sesión deja de valer al instante. Ojo: todos comparten el cupo gratis de Gemini (unos 60 pedidos por día entre los 3 modelos).

## Técnico

- Node.js 22.9+ · Express · `@google/genai` (Gemini, `gemini-3.6-flash` con respaldos `gemini-3.5-flash-lite` y `gemini-3.1-flash-lite`, salida JSON con esquema) · `@anthropic-ai/sdk` opcional · PDFKit · docx (Word).
- `lib/job.js` lee la oferta (incluye datos JobPosting de LinkedIn, Indeed, Greenhouse, Lever, etc.).
- `lib/ai.js` contiene las instrucciones de adaptación; `lib/pdf.js` arma el diseño Harvard.
- Costo: gratis dentro del cupo diario de Gemini (unos 20 pedidos por día por modelo; la app usa 3 modelos en cadena y saltea el que se quedó sin cupo). En el plan gratuito, Google puede usar el contenido enviado para mejorar sus productos.
