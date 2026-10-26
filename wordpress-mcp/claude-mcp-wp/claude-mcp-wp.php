<?php
/**
 * Plugin Name:       Claude MCP para WordPress
 * Description:       Expone herramientas de contenido de WordPress a Claude (Claude Desktop, Claude Code) mediante el MCP Adapter oficial y la Abilities API.
 * Version:           1.0.0
 * Requires at least: 6.9
 * Requires PHP:      7.4
 * Requires Plugins:  mcp-adapter
 * Author:            Rosario Fernández
 * Author URI:        https://www.inkkstudio.art
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       claude-mcp-wp
 *
 * @package ClaudeMcpWp
 */

defined( 'ABSPATH' ) || exit;

define( 'CLAUDE_MCP_WP_VERSION', '1.0.0' );
define( 'CLAUDE_MCP_WP_DIR', plugin_dir_path( __FILE__ ) );

/** Namespace REST y ruta del servidor MCP propio: /wp-json/claude-mcp/mcp */
define( 'CLAUDE_MCP_WP_REST_NAMESPACE', 'claude-mcp' );
define( 'CLAUDE_MCP_WP_REST_ROUTE', 'mcp' );

require_once CLAUDE_MCP_WP_DIR . 'includes/abilities.php';
require_once CLAUDE_MCP_WP_DIR . 'includes/server.php';
require_once CLAUDE_MCP_WP_DIR . 'includes/admin.php';
