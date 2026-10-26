<?php
/**
 * Página Herramientas → Claude MCP: comprueba requisitos y genera la
 * configuración lista para pegar en Claude Desktop.
 *
 * @package ClaudeMcpWp
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_menu', 'claude_mcp_wp_admin_menu' );

/**
 * Registra la página de administración.
 */
function claude_mcp_wp_admin_menu() {
	add_management_page(
		__( 'Claude MCP', 'claude-mcp-wp' ),
		__( 'Claude MCP', 'claude-mcp-wp' ),
		'edit_posts',
		'claude-mcp-wp',
		'claude_mcp_wp_render_admin_page'
	);
}

add_filter( 'plugin_action_links_' . plugin_basename( CLAUDE_MCP_WP_DIR . 'claude-mcp-wp.php' ), 'claude_mcp_wp_action_links' );

/**
 * Enlace "Configurar" en la lista de plugins.
 *
 * @param string[] $links Enlaces existentes.
 * @return string[]
 */
function claude_mcp_wp_action_links( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'tools.php?page=claude-mcp-wp' ) ) . '">' . esc_html__( 'Configurar', 'claude-mcp-wp' ) . '</a>' );
	return $links;
}

/**
 * Pinta la página.
 */
function claude_mcp_wp_render_admin_page() {
	$user = wp_get_current_user();

	$checks = array(
		array(
			__( 'WordPress 6.9 o superior (Abilities API)', 'claude-mcp-wp' ),
			function_exists( 'wp_register_ability' ),
		),
		array(
			__( 'Plugin MCP Adapter activo', 'claude-mcp-wp' ),
			class_exists( '\WP\MCP\Core\McpAdapter' ),
		),
		array(
			__( 'Sitio servido por HTTPS (o entorno local)', 'claude-mcp-wp' ),
			is_ssl() || 'local' === wp_get_environment_type(),
		),
		array(
			__( 'Contraseñas de aplicación disponibles', 'claude-mcp-wp' ),
			wp_is_application_passwords_available_for_user( $user ),
		),
		array(
			__( 'Enlaces permanentes no "simples" (necesario para /wp-json/)', 'claude-mcp-wp' ),
			(bool) get_option( 'permalink_structure' ),
		),
	);

	$config = array(
		'mcpServers' => array(
			'wordpress-' . sanitize_title( get_bloginfo( 'name' ) ) => array(
				'command' => 'npx',
				'args'    => array( '-y', '@automattic/mcp-wordpress-remote@latest' ),
				'env'     => array(
					'WP_API_URL'      => claude_mcp_wp_endpoint_url(),
					'WP_API_USERNAME' => $user->user_login,
					'WP_API_PASSWORD' => 'PEGA-AQUI-TU-CONTRASENA-DE-APLICACION',
				),
			),
		),
	);

	$app_passwords_url = admin_url( 'profile.php#application-passwords-section' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Claude MCP para WordPress', 'claude-mcp-wp' ); ?></h1>

		<h2><?php esc_html_e( '1. Requisitos', 'claude-mcp-wp' ); ?></h2>
		<table class="widefat striped" style="max-width:760px">
			<tbody>
			<?php foreach ( $checks as $check ) : ?>
				<tr>
					<td><?php echo esc_html( $check[0] ); ?></td>
					<td style="width:80px"><?php echo $check[1] ? '✅' : '❌'; ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>

		<h2><?php esc_html_e( '2. Crea una contraseña de aplicación', 'claude-mcp-wp' ); ?></h2>
		<p>
			<?php esc_html_e( 'En tu perfil, sección "Contraseñas de aplicación", escribe un nombre (por ejemplo "Claude Desktop") y pulsa "Añadir". Copia la contraseña: solo se muestra una vez.', 'claude-mcp-wp' ); ?>
		</p>
		<p><a class="button" href="<?php echo esc_url( $app_passwords_url ); ?>"><?php esc_html_e( 'Ir a Contraseñas de aplicación', 'claude-mcp-wp' ); ?></a></p>

		<h2><?php esc_html_e( '3. Configura Claude Desktop', 'claude-mcp-wp' ); ?></h2>
		<p>
			<?php esc_html_e( 'En Claude Desktop abre Ajustes → Desarrollador → Editar configuración, pega este bloque en claude_desktop_config.json (sustituyendo la contraseña) y reinicia la aplicación. Necesitas Node.js instalado en tu ordenador.', 'claude-mcp-wp' ); ?>
		</p>
		<textarea readonly rows="16" class="large-text code" onclick="this.select()"><?php echo esc_textarea( wp_json_encode( $config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ); ?></textarea>

		<h2><?php esc_html_e( 'Endpoints MCP', 'claude-mcp-wp' ); ?></h2>
		<ul>
			<li><strong><?php esc_html_e( 'Herramientas de este plugin (recomendado):', 'claude-mcp-wp' ); ?></strong> <code><?php echo esc_html( claude_mcp_wp_endpoint_url() ); ?></code></li>
			<li><strong><?php esc_html_e( 'Servidor por defecto del MCP Adapter (todas las abilities públicas):', 'claude-mcp-wp' ); ?></strong> <code><?php echo esc_html( claude_mcp_wp_default_endpoint_url() ); ?></code></li>
		</ul>

		<h2><?php esc_html_e( 'Herramientas disponibles', 'claude-mcp-wp' ); ?></h2>
		<ul>
			<?php
			foreach ( claude_mcp_wp_ability_names() as $name ) :
				$ability = function_exists( 'wp_get_ability' ) ? wp_get_ability( $name ) : null;
				?>
				<li>
					<code><?php echo esc_html( str_replace( '/', '-', $name ) ); ?></code>
					<?php if ( $ability ) : ?>
						— <?php echo esc_html( $ability->get_description() ); ?>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php
}
