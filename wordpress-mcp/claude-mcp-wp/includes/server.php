<?php
/**
 * Servidor MCP propio del plugin.
 *
 * El MCP Adapter ya crea un servidor por defecto en
 * /wp-json/mcp/mcp-adapter-default-server (descubrir → inspeccionar → ejecutar).
 * Aquí se crea además /wp-json/claude-mcp/mcp, donde cada ability aparece como
 * una herramienta directa con su propio esquema, que Claude usa con menos pasos.
 *
 * @package ClaudeMcpWp
 */

defined( 'ABSPATH' ) || exit;

add_action( 'mcp_adapter_init', 'claude_mcp_wp_create_server' );

/**
 * Crea el servidor MCP del plugin.
 *
 * @param \WP\MCP\Core\McpAdapter $adapter Instancia del adaptador.
 */
function claude_mcp_wp_create_server( $adapter ) {
	if ( ! class_exists( '\WP\MCP\Transport\HttpTransport' ) ) {
		return;
	}

	$result = $adapter->create_server(
		'claude-mcp-server',
		CLAUDE_MCP_WP_REST_NAMESPACE,
		CLAUDE_MCP_WP_REST_ROUTE,
		__( 'Claude MCP para WordPress', 'claude-mcp-wp' ),
		__( 'Herramientas para gestionar el contenido de este sitio desde Claude.', 'claude-mcp-wp' ),
		CLAUDE_MCP_WP_VERSION,
		array( \WP\MCP\Transport\HttpTransport::class ),
		\WP\MCP\Infrastructure\ErrorHandling\ErrorLogMcpErrorHandler::class,
		\WP\MCP\Infrastructure\Observability\NullMcpObservabilityHandler::class,
		claude_mcp_wp_ability_names(),
		array(),
		array(),
		static function () {
			// Solo usuarios que pueden editar contenido llegan al servidor;
			// cada ability vuelve a comprobar sus propios permisos.
			return current_user_can( 'edit_posts' );
		}
	);

	if ( is_wp_error( $result ) ) {
		error_log( 'Claude MCP: no se pudo crear el servidor: ' . $result->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}

/**
 * URL del endpoint MCP propio del plugin.
 *
 * @return string
 */
function claude_mcp_wp_endpoint_url() {
	return rest_url( CLAUDE_MCP_WP_REST_NAMESPACE . '/' . CLAUDE_MCP_WP_REST_ROUTE );
}

/**
 * URL del servidor por defecto del MCP Adapter.
 *
 * @return string
 */
function claude_mcp_wp_default_endpoint_url() {
	return rest_url( 'mcp/mcp-adapter-default-server' );
}
