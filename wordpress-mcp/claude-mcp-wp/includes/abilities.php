<?php
/**
 * Registro de las abilities (Abilities API) que Claude puede usar vía MCP.
 *
 * Cada ability se marca con meta.mcp.public = true para que el servidor por
 * defecto del MCP Adapter la descubra, y además se registra como herramienta
 * directa en el servidor propio del plugin (ver server.php).
 *
 * @package ClaudeMcpWp
 */

defined( 'ABSPATH' ) || exit;

/**
 * Nombres de todas las abilities del plugin, en el orden en que se exponen.
 *
 * @return string[]
 */
function claude_mcp_wp_ability_names() {
	return array(
		'claude-mcp/get-site-info',
		'claude-mcp/list-posts',
		'claude-mcp/get-post',
		'claude-mcp/create-post',
		'claude-mcp/update-post',
		'claude-mcp/list-terms',
		'claude-mcp/list-media',
	);
}

/**
 * Tipos de contenido que las abilities pueden leer y escribir.
 *
 * @return string[]
 */
function claude_mcp_wp_allowed_post_types() {
	return apply_filters( 'claude_mcp_wp_allowed_post_types', array( 'post', 'page' ) );
}

add_action( 'wp_abilities_api_categories_init', 'claude_mcp_wp_register_category' );

/**
 * Registra la categoría de las abilities del plugin.
 */
function claude_mcp_wp_register_category() {
	wp_register_ability_category(
		'claude-mcp',
		array(
			'label'       => __( 'Claude MCP', 'claude-mcp-wp' ),
			'description' => __( 'Herramientas de contenido expuestas a Claude mediante MCP.', 'claude-mcp-wp' ),
		)
	);
}

add_action( 'wp_abilities_api_init', 'claude_mcp_wp_register_abilities' );

/**
 * Registra todas las abilities del plugin.
 */
function claude_mcp_wp_register_abilities() {
	$post_types = claude_mcp_wp_allowed_post_types();

	wp_register_ability(
		'claude-mcp/get-site-info',
		array(
			'label'               => __( 'Información del sitio', 'claude-mcp-wp' ),
			'description'         => __( 'Devuelve nombre, descripción, URL, idioma, zona horaria, versión de WordPress, tema activo y conteo de contenidos del sitio.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'execute_callback'    => 'claude_mcp_wp_get_site_info',
			'permission_callback' => static function () {
				return current_user_can( 'read' );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	wp_register_ability(
		'claude-mcp/list-posts',
		array(
			'label'               => __( 'Listar entradas o páginas', 'claude-mcp-wp' ),
			'description'         => __( 'Lista entradas o páginas con filtros opcionales de estado, búsqueda y paginación. Devuelve id, título, estado, fecha, enlace y extracto.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'post_type' => array(
						'type'        => 'string',
						'enum'        => $post_types,
						'default'     => 'post',
						'description' => __( 'Tipo de contenido.', 'claude-mcp-wp' ),
					),
					'status'    => array(
						'type'        => 'string',
						'enum'        => array( 'any', 'publish', 'draft', 'pending', 'private', 'future' ),
						'default'     => 'any',
						'description' => __( 'Estado de publicación.', 'claude-mcp-wp' ),
					),
					'search'    => array(
						'type'        => 'string',
						'description' => __( 'Texto a buscar en título y contenido.', 'claude-mcp-wp' ),
					),
					'per_page'  => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 50,
						'default' => 10,
					),
					'page'      => array(
						'type'    => 'integer',
						'minimum' => 1,
						'default' => 1,
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_list_posts',
			'permission_callback' => static function () {
				return current_user_can( 'edit_posts' );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	wp_register_ability(
		'claude-mcp/get-post',
		array(
			'label'               => __( 'Obtener entrada o página', 'claude-mcp-wp' ),
			'description'         => __( 'Devuelve una entrada o página completa por su ID, incluyendo contenido, extracto, categorías y etiquetas.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'id' => array(
						'type'        => 'integer',
						'minimum'     => 1,
						'description' => __( 'ID de la entrada o página.', 'claude-mcp-wp' ),
					),
				),
				'required'             => array( 'id' ),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_get_post',
			'permission_callback' => static function ( $input = null ) {
				return claude_mcp_wp_can_edit( $input );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	$write_properties = array(
		'title'      => array(
			'type'        => 'string',
			'description' => __( 'Título.', 'claude-mcp-wp' ),
		),
		'content'    => array(
			'type'        => 'string',
			'description' => __( 'Contenido en HTML o marcado de bloques de Gutenberg.', 'claude-mcp-wp' ),
		),
		'excerpt'    => array(
			'type'        => 'string',
			'description' => __( 'Extracto.', 'claude-mcp-wp' ),
		),
		'status'     => array(
			'type'        => 'string',
			'enum'        => array( 'draft', 'pending', 'publish', 'private' ),
			'description' => __( 'Estado de publicación. Publicar requiere el permiso correspondiente.', 'claude-mcp-wp' ),
		),
		'categories' => array(
			'type'        => 'array',
			'items'       => array( 'type' => 'string' ),
			'description' => __( 'Nombres de categorías (solo entradas). Se crean si no existen.', 'claude-mcp-wp' ),
		),
		'tags'       => array(
			'type'        => 'array',
			'items'       => array( 'type' => 'string' ),
			'description' => __( 'Nombres de etiquetas (solo entradas).', 'claude-mcp-wp' ),
		),
	);

	wp_register_ability(
		'claude-mcp/create-post',
		array(
			'label'               => __( 'Crear entrada o página', 'claude-mcp-wp' ),
			'description'         => __( 'Crea una entrada o página. Por defecto se guarda como borrador para que una persona la revise antes de publicarla.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array_merge(
					array(
						'post_type' => array(
							'type'    => 'string',
							'enum'    => $post_types,
							'default' => 'post',
						),
					),
					$write_properties
				),
				'required'             => array( 'title' ),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_create_post',
			'permission_callback' => 'claude_mcp_wp_can_create',
			'meta'                => array(
				'annotations' => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => false,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	wp_register_ability(
		'claude-mcp/update-post',
		array(
			'label'               => __( 'Actualizar entrada o página', 'claude-mcp-wp' ),
			'description'         => __( 'Actualiza los campos indicados de una entrada o página existente. Los campos omitidos no se modifican.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array_merge(
					array(
						'id' => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'ID de la entrada o página.', 'claude-mcp-wp' ),
						),
					),
					$write_properties
				),
				'required'             => array( 'id' ),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_update_post',
			'permission_callback' => static function ( $input = null ) {
				if ( ! claude_mcp_wp_can_edit( $input ) ) {
					return false;
				}
				return claude_mcp_wp_can_set_status( get_post_type( (int) $input['id'] ), $input['status'] ?? '' );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	wp_register_ability(
		'claude-mcp/list-terms',
		array(
			'label'               => __( 'Listar categorías o etiquetas', 'claude-mcp-wp' ),
			'description'         => __( 'Lista las categorías o etiquetas del sitio con su número de entradas.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'taxonomy' => array(
						'type'    => 'string',
						'enum'    => array( 'category', 'post_tag' ),
						'default' => 'category',
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_list_terms',
			'permission_callback' => static function () {
				return current_user_can( 'edit_posts' );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);

	wp_register_ability(
		'claude-mcp/list-media',
		array(
			'label'               => __( 'Listar medios', 'claude-mcp-wp' ),
			'description'         => __( 'Lista los archivos de la biblioteca de medios con su URL, tipo y texto alternativo.', 'claude-mcp-wp' ),
			'category'            => 'claude-mcp',
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'search'   => array( 'type' => 'string' ),
					'per_page' => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 50,
						'default' => 20,
					),
					'page'     => array(
						'type'    => 'integer',
						'minimum' => 1,
						'default' => 1,
					),
				),
				'additionalProperties' => false,
			),
			'execute_callback'    => 'claude_mcp_wp_list_media',
			'permission_callback' => static function () {
				return current_user_can( 'upload_files' );
			},
			'meta'                => array(
				'annotations' => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'mcp'         => array( 'public' => true ),
			),
		)
	);
}

/*
 * Permisos.
 */

/**
 * Comprueba que el usuario puede editar el contenido indicado por $input['id']
 * y que es de un tipo permitido.
 *
 * @param array|null $input Entrada de la ability.
 * @return bool
 */
function claude_mcp_wp_can_edit( $input ) {
	$id   = isset( $input['id'] ) ? (int) $input['id'] : 0;
	$post = $id ? get_post( $id ) : null;
	if ( ! $post || ! in_array( $post->post_type, claude_mcp_wp_allowed_post_types(), true ) ) {
		// Sin un contenido válido no hay nada que filtrar: se deja pasar si el
		// usuario puede editar en general y el callback devolverá el error 404.
		return current_user_can( 'edit_posts' );
	}
	return current_user_can( 'edit_post', $post->ID );
}

/**
 * Comprueba si el usuario puede crear contenido del tipo y estado pedidos.
 *
 * @param array|null $input Entrada de la ability.
 * @return bool
 */
function claude_mcp_wp_can_create( $input = null ) {
	$type = $input['post_type'] ?? 'post';
	$obj  = get_post_type_object( $type );
	if ( ! $obj || ! current_user_can( $obj->cap->create_posts ) ) {
		return false;
	}
	return claude_mcp_wp_can_set_status( $type, $input['status'] ?? 'draft' );
}

/**
 * Publicar o programar requiere el permiso de publicación del tipo de contenido.
 *
 * @param string $type   Tipo de contenido.
 * @param string $status Estado solicitado.
 * @return bool
 */
function claude_mcp_wp_can_set_status( $type, $status ) {
	if ( ! in_array( $status, array( 'publish', 'private' ), true ) ) {
		return true;
	}
	$obj = get_post_type_object( $type );
	return $obj && current_user_can( $obj->cap->publish_posts );
}

/*
 * Callbacks.
 */

/**
 * @return array
 */
function claude_mcp_wp_get_site_info() {
	$theme  = wp_get_theme();
	$counts = array();
	foreach ( claude_mcp_wp_allowed_post_types() as $type ) {
		$counts[ $type ] = (array) wp_count_posts( $type );
	}

	return array(
		'name'        => get_bloginfo( 'name' ),
		'description' => get_bloginfo( 'description' ),
		'url'         => home_url( '/' ),
		'admin_url'   => admin_url(),
		'language'    => get_bloginfo( 'language' ),
		'timezone'    => wp_timezone_string(),
		'wp_version'  => get_bloginfo( 'version' ),
		'theme'       => array(
			'name'    => $theme->get( 'Name' ),
			'version' => $theme->get( 'Version' ),
		),
		'counts'      => $counts,
	);
}

/**
 * @param array $input Entrada.
 * @return array
 */
function claude_mcp_wp_list_posts( $input = array() ) {
	$input = wp_parse_args(
		(array) $input,
		array(
			'post_type' => 'post',
			'status'    => 'any',
			'search'    => '',
			'per_page'  => 10,
			'page'      => 1,
		)
	);

	$query = new WP_Query(
		array(
			'post_type'      => $input['post_type'],
			'post_status'    => $input['status'],
			's'              => $input['search'],
			'posts_per_page' => min( 50, max( 1, (int) $input['per_page'] ) ),
			'paged'          => max( 1, (int) $input['page'] ),
			'orderby'        => 'date',
			'order'          => 'DESC',
		)
	);

	$items = array();
	foreach ( $query->posts as $post ) {
		// WP_Query con 'any' puede incluir contenidos ajenos que el usuario no puede editar.
		if ( current_user_can( 'edit_post', $post->ID ) ) {
			$items[] = claude_mcp_wp_format_post( $post, false );
		}
	}

	return array(
		'items'       => $items,
		'total'       => (int) $query->found_posts,
		'total_pages' => (int) $query->max_num_pages,
		'page'        => max( 1, (int) $input['page'] ),
	);
}

/**
 * @param array $input Entrada.
 * @return array|WP_Error
 */
function claude_mcp_wp_get_post( $input = array() ) {
	$post = claude_mcp_wp_find_post( $input );
	if ( is_wp_error( $post ) ) {
		return $post;
	}
	return claude_mcp_wp_format_post( $post, true );
}

/**
 * @param array $input Entrada.
 * @return array|WP_Error
 */
function claude_mcp_wp_create_post( $input = array() ) {
	$input = (array) $input;
	$type  = $input['post_type'] ?? 'post';

	$postarr = claude_mcp_wp_build_postarr( $input );
	$postarr['post_type']   = $type;
	$postarr['post_status'] = $input['status'] ?? 'draft';
	$postarr['post_author'] = get_current_user_id();

	$id = wp_insert_post( wp_slash( $postarr ), true );
	if ( is_wp_error( $id ) ) {
		return $id;
	}

	claude_mcp_wp_set_terms( $id, $type, $input );

	return claude_mcp_wp_format_post( get_post( $id ), true );
}

/**
 * @param array $input Entrada.
 * @return array|WP_Error
 */
function claude_mcp_wp_update_post( $input = array() ) {
	$input = (array) $input;
	$post  = claude_mcp_wp_find_post( $input );
	if ( is_wp_error( $post ) ) {
		return $post;
	}

	$postarr       = claude_mcp_wp_build_postarr( $input );
	$postarr['ID'] = $post->ID;
	if ( isset( $input['status'] ) ) {
		$postarr['post_status'] = $input['status'];
	}

	$id = wp_update_post( wp_slash( $postarr ), true );
	if ( is_wp_error( $id ) ) {
		return $id;
	}

	claude_mcp_wp_set_terms( $id, $post->post_type, $input );

	return claude_mcp_wp_format_post( get_post( $id ), true );
}

/**
 * @param array $input Entrada.
 * @return array|WP_Error
 */
function claude_mcp_wp_list_terms( $input = array() ) {
	$input    = (array) $input;
	$taxonomy = $input['taxonomy'] ?? 'category';

	$terms = get_terms(
		array(
			'taxonomy'   => $taxonomy,
			'hide_empty' => false,
			'number'     => 200,
		)
	);
	if ( is_wp_error( $terms ) ) {
		return $terms;
	}

	return array(
		'taxonomy' => $taxonomy,
		'items'    => array_map(
			static function ( $term ) {
				return array(
					'id'    => $term->term_id,
					'name'  => $term->name,
					'slug'  => $term->slug,
					'count' => (int) $term->count,
				);
			},
			$terms
		),
	);
}

/**
 * @param array $input Entrada.
 * @return array
 */
function claude_mcp_wp_list_media( $input = array() ) {
	$input = wp_parse_args(
		(array) $input,
		array(
			'search'   => '',
			'per_page' => 20,
			'page'     => 1,
		)
	);

	$query = new WP_Query(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			's'              => $input['search'],
			'posts_per_page' => min( 50, max( 1, (int) $input['per_page'] ) ),
			'paged'          => max( 1, (int) $input['page'] ),
		)
	);

	$items = array();
	foreach ( $query->posts as $attachment ) {
		$items[] = array(
			'id'        => $attachment->ID,
			'title'     => get_the_title( $attachment ),
			'url'       => wp_get_attachment_url( $attachment->ID ),
			'mime_type' => $attachment->post_mime_type,
			'alt'       => get_post_meta( $attachment->ID, '_wp_attachment_image_alt', true ),
			'date'      => get_post_time( 'c', true, $attachment ),
		);
	}

	return array(
		'items'       => $items,
		'total'       => (int) $query->found_posts,
		'total_pages' => (int) $query->max_num_pages,
	);
}

/*
 * Utilidades.
 */

/**
 * Busca el contenido indicado por $input['id'] entre los tipos permitidos.
 *
 * @param array $input Entrada.
 * @return WP_Post|WP_Error
 */
function claude_mcp_wp_find_post( $input ) {
	$post = get_post( isset( $input['id'] ) ? (int) $input['id'] : 0 );
	if ( ! $post || ! in_array( $post->post_type, claude_mcp_wp_allowed_post_types(), true ) ) {
		return new WP_Error( 'claude_mcp_not_found', __( 'No existe una entrada o página con ese ID.', 'claude-mcp-wp' ), array( 'status' => 404 ) );
	}
	return $post;
}

/**
 * Traduce los campos de la ability a los de wp_insert_post().
 *
 * @param array $input Entrada.
 * @return array
 */
function claude_mcp_wp_build_postarr( $input ) {
	$map     = array(
		'title'   => 'post_title',
		'content' => 'post_content',
		'excerpt' => 'post_excerpt',
	);
	$postarr = array();
	foreach ( $map as $from => $to ) {
		if ( isset( $input[ $from ] ) ) {
			$postarr[ $to ] = (string) $input[ $from ];
		}
	}
	return $postarr;
}

/**
 * Asigna categorías y etiquetas por nombre (solo para entradas).
 *
 * @param int    $post_id ID.
 * @param string $type    Tipo de contenido.
 * @param array  $input   Entrada.
 */
function claude_mcp_wp_set_terms( $post_id, $type, $input ) {
	if ( 'post' !== $type ) {
		return;
	}

	if ( isset( $input['categories'] ) ) {
		$ids = array();
		foreach ( (array) $input['categories'] as $name ) {
			$name = sanitize_text_field( $name );
			if ( '' === $name ) {
				continue;
			}
			$term = term_exists( $name, 'category' );
			if ( ! $term && current_user_can( 'manage_categories' ) ) {
				$term = wp_insert_term( $name, 'category' );
			}
			if ( $term && ! is_wp_error( $term ) ) {
				$ids[] = (int) $term['term_id'];
			}
		}
		wp_set_post_categories( $post_id, $ids );
	}

	if ( isset( $input['tags'] ) ) {
		wp_set_post_tags( $post_id, array_map( 'sanitize_text_field', (array) $input['tags'] ) );
	}
}

/**
 * Representación de un contenido para Claude.
 *
 * @param WP_Post $post Contenido.
 * @param bool    $full Incluir contenido completo y términos.
 * @return array
 */
function claude_mcp_wp_format_post( $post, $full ) {
	$data = array(
		'id'       => $post->ID,
		'type'     => $post->post_type,
		'title'    => $post->post_title,
		'status'   => $post->post_status,
		'date'     => get_post_time( 'c', true, $post ),
		'modified' => get_post_modified_time( 'c', true, $post ),
		'link'     => get_permalink( $post ),
		'edit_url' => get_edit_post_link( $post->ID, 'raw' ),
		'excerpt'  => $post->post_excerpt ? $post->post_excerpt : wp_trim_words( wp_strip_all_tags( $post->post_content ), 40 ),
	);

	if ( $full ) {
		$data['content'] = $post->post_content;
		$data['author']  = get_the_author_meta( 'display_name', $post->post_author );
		if ( 'post' === $post->post_type ) {
			$data['categories'] = wp_get_post_categories( $post->ID, array( 'fields' => 'names' ) );
			$data['tags']       = wp_get_post_tags( $post->ID, array( 'fields' => 'names' ) );
		}
	}

	return $data;
}
