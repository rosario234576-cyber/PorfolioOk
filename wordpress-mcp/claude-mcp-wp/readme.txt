=== Claude MCP para WordPress ===
Contributors: rosariofernandez
Tags: mcp, claude, ai, abilities api
Requires at least: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Conecta Claude (Claude Desktop / Claude Code) con tu sitio WordPress mediante el MCP Adapter oficial.

== Description ==

Registra herramientas de contenido (Abilities API) y un servidor MCP propio en
/wp-json/claude-mcp/mcp:

* claude-mcp-get-site-info: información general del sitio.
* claude-mcp-list-posts: listar entradas o páginas.
* claude-mcp-get-post: leer una entrada o página.
* claude-mcp-create-post: crear una entrada o página (borrador por defecto).
* claude-mcp-update-post: actualizar una entrada o página.
* claude-mcp-list-terms: listar categorías o etiquetas.
* claude-mcp-list-media: listar la biblioteca de medios.

Requiere el plugin "MCP Adapter" de WordPress.org.

== Installation ==

1. Instala y activa "MCP Adapter" desde Plugins > Añadir nuevo.
2. Sube la carpeta claude-mcp-wp a wp-content/plugins y actívala.
3. Ve a Herramientas > Claude MCP y sigue los pasos.

== Changelog ==

= 1.0.0 =
* Versión inicial.
