# Claude MCP para WordPress

Plugin adaptador que conecta **Claude Desktop** (y Claude Code) con un sitio
WordPress mediante el **Model Context Protocol (MCP)**. Se apoya en las piezas
oficiales de WordPress:

- **Abilities API** (incluida en WordPress 6.9+): define qué acciones existen.
- **[MCP Adapter](https://wordpress.org/plugins/mcp-adapter/)**: expone esas
  acciones como herramientas MCP por HTTP.
- **[`@automattic/mcp-wordpress-remote`](https://www.npmjs.com/package/@automattic/mcp-wordpress-remote)**:
  pequeño puente que corre en tu ordenador y conecta Claude Desktop con el sitio.

```
Claude Desktop ──stdio──► npx @automattic/mcp-wordpress-remote ──HTTPS + contraseña de aplicación──► /wp-json/claude-mcp/mcp
```

## Herramientas que obtiene Claude

| Herramienta MCP              | Qué hace                                            | Permiso necesario |
|------------------------------|-----------------------------------------------------|-------------------|
| `claude-mcp-get-site-info`   | Nombre, URL, idioma, versión, tema y conteos        | `read`            |
| `claude-mcp-list-posts`      | Lista entradas/páginas (estado, búsqueda, páginas)  | `edit_posts`      |
| `claude-mcp-get-post`        | Lee una entrada/página completa                     | editar ese contenido |
| `claude-mcp-create-post`     | Crea entrada/página (**borrador** por defecto)      | crear; publicar si `status=publish` |
| `claude-mcp-update-post`     | Modifica título, contenido, extracto, estado, etc.  | editar ese contenido |
| `claude-mcp-list-terms`      | Lista categorías o etiquetas                        | `edit_posts`      |
| `claude-mcp-list-media`      | Lista la biblioteca de medios                       | `upload_files`    |

No hay herramienta de borrado a propósito. Claude actúa siempre **como el
usuario de WordPress** con el que se conecta, así que nunca puede hacer más que
ese usuario.

## Requisitos

- WordPress **6.9 o superior**.
- Sitio con **HTTPS** (WordPress solo ofrece contraseñas de aplicación con HTTPS,
  salvo en entornos locales).
- Enlaces permanentes distintos de "Simple" (Ajustes → Enlaces permanentes).
- **Node.js** instalado en el ordenador donde usas Claude Desktop
  (<https://nodejs.org>).

## Paso 1 — Instalar los plugins en WordPress

1. En el escritorio de WordPress: **Plugins → Añadir nuevo**, busca
   **"MCP Adapter"** e instálalo y actívalo.
2. Comprime la carpeta `claude-mcp-wp` en un `.zip`:
   ```bash
   cd wordpress-mcp && zip -r claude-mcp-wp.zip claude-mcp-wp
   ```
3. **Plugins → Añadir nuevo → Subir plugin**, elige `claude-mcp-wp.zip` y
   actívalo. (WordPress no te dejará activarlo hasta que MCP Adapter esté activo.)
4. Ve a **Herramientas → Claude MCP**: verás una lista de comprobación de
   requisitos y el JSON de configuración ya rellenado con tu sitio y usuario.

## Paso 2 — Crear una contraseña de aplicación

1. **Usuarios → Perfil** (recomendado: un usuario aparte con rol *Editor*, no
   Administrador).
2. Sección **Contraseñas de aplicación** → nombre "Claude Desktop" → **Añadir**.
3. Copia la contraseña (solo se muestra una vez; los espacios pueden quedarse).

## Paso 3 — Configurar el conector en Claude Desktop

1. Abre Claude Desktop → **Ajustes → Desarrollador → Editar configuración**.
   Se abre `claude_desktop_config.json`:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Pega el bloque de **Herramientas → Claude MCP** (o el de
   [`claude_desktop_config.example.json`](claude_desktop_config.example.json))
   con tus datos:

   ```json
   {
     "mcpServers": {
       "wordpress-mi-sitio": {
         "command": "npx",
         "args": ["-y", "@automattic/mcp-wordpress-remote@latest"],
         "env": {
           "WP_API_URL": "https://tusitio.com/wp-json/claude-mcp/mcp",
           "WP_API_USERNAME": "tu-usuario",
           "WP_API_PASSWORD": "xxxx xxxx xxxx xxxx xxxx xxxx"
         }
       }
     }
   }
   ```

   Si ya tenías otros servidores en `mcpServers`, añade solo la entrada nueva
   dentro del mismo objeto.
3. Guarda y **cierra Claude Desktop por completo** (también desde la bandeja /
   barra de menús) y vuelve a abrirlo.
4. En un chat nuevo, en el icono de herramientas/conectores, debe aparecer
   `wordpress-mi-sitio` con sus herramientas.

### Prueba

> Dime qué herramientas de WordPress tienes disponibles y muéstrame las 5 últimas entradas de mi sitio.

> Crea un borrador titulado "Novedades de noviembre" con tres párrafos sobre … en la categoría Noticias.

## Alternativas

**Servidor por defecto del MCP Adapter.** Si quieres que Claude vea *todas* las
abilities públicas del sitio (de este y otros plugins), usa
`https://tusitio.com/wp-json/mcp/mcp-adapter-default-server` como `WP_API_URL`.
Ahí Claude trabaja en tres pasos: descubrir → consultar → ejecutar.

**Claude Code** (sin Node puente):

```bash
printf 'tu-usuario:xxxx xxxx xxxx xxxx xxxx xxxx' | base64 | tr -d '\n'
claude mcp add --transport http wordpress \
  https://tusitio.com/wp-json/claude-mcp/mcp \
  --header "Authorization: Basic PEGA_EL_BASE64"
```

**Sitio local con WP-CLI** (sin contraseña):

```json
{
  "mcpServers": {
    "wordpress-local": {
      "command": "wp",
      "args": ["--path=/ruta/a/wordpress", "mcp-adapter", "serve", "--server=claude-mcp-server", "--user=admin"]
    }
  }
}
```

**claude.ai (web)**: los conectores web requieren OAuth, que WordPress no trae
de serie; usa Claude Desktop o Claude Code.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `401 Unauthorized` | Usuario o contraseña de aplicación incorrectos, o el servidor (Apache) elimina la cabecera `Authorization`. Revisa el `.htaccess` estándar de WordPress o consulta al hosting. |
| `rest_no_route` / 404 | MCP Adapter o este plugin no están activos, o la URL tiene un error. Con enlaces "Simple" usa `https://tusitio.com/?rest_route=/claude-mcp/mcp`. |
| `npx: command not found` | Falta Node.js en tu ordenador, o Claude Desktop no lo encuentra: instálalo y reinicia la app. |
| No aparece la sección de contraseñas de aplicación | El sitio no usa HTTPS o un plugin de seguridad las desactivó. |
| La herramienta responde "no tienes permiso" | El usuario conectado no tiene el rol necesario (ver tabla de herramientas). |

## Ampliar el plugin

- Añadir tipos de contenido (p. ej. productos de WooCommerce):
  ```php
  add_filter( 'claude_mcp_wp_allowed_post_types', function ( $types ) {
      $types[] = 'product';
      return $types;
  } );
  ```
- Nuevas herramientas: registra una ability en `includes/abilities.php` con
  `wp_register_ability()` y añade su nombre a `claude_mcp_wp_ability_names()`.

## Seguridad

- Usa un usuario dedicado con el rol mínimo necesario.
- Una contraseña de aplicación por dispositivo; puedes revocarla en
  **Usuarios → Perfil** en cualquier momento.
- Nunca subas `claude_desktop_config.json` con tu contraseña a un repositorio.
- Prueba primero en un entorno de staging y mantén copias de seguridad.
