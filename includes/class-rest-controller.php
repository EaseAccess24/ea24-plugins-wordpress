<?php
/**
 * REST controller.
 *
 * Exposes the connection state to the admin app so a stored Widget Key can be
 * read and saved. No key/domain/subscription validation happens here — the
 * controller only sanitizes input and delegates to the Connection store.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the plugin's REST routes under the easeaccess24/v1 namespace.
 */
class RestController {

	/**
	 * REST namespace for the plugin's routes.
	 */
	const NAMESPACE = 'easeaccess24/v1';

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the /connection route (read + save).
	 */
	public function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/connection',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_connection' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'save_connection' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'key' => array(
							'type'        => 'string',
							'required'    => true,
							'description' => __( 'A Widget Key or a full SDK script snippet.', 'easeaccess24-accessibility' ),
						),
					),
				),
			)
		);

		// Records the outcome of an on-demand Health Check. This persists an
		// OBSERVED result (a reason code the browser probe derived); it does not
		// validate anything against the platform.
		register_rest_route(
			self::NAMESPACE,
			'/health',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'save_health_result' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'code' => array(
						'type'        => 'string',
						'required'    => true,
						'description' => __( 'A reason code from the diagnostics catalog (e.g. OK, DOMAIN_NOT_ALLOWED).', 'easeaccess24-accessibility' ),
					),
				),
			)
		);

		// Local event log: read the capped history, or clear it. The log is never
		// transmitted anywhere; these routes only serve the admin UI.
		register_rest_route(
			self::NAMESPACE,
			'/events',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_events' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/events/clear',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'clear_events' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		// Assemble a user-facing Support Report. This only reads local state and
		// returns it for preview/copy/download — it transmits nothing.
		register_rest_route(
			self::NAMESPACE,
			'/support-report',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_support_report' ),
				'permission_callback' => array( $this, 'permission_check' ),
			)
		);

		// App preferences: UI language and the remove-data-on-uninstall flag.
		// Stored per site as standalone options; no connection/platform state is
		// touched here.
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'save_settings' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'language'              => array(
							'type'        => 'string',
							'required'    => false,
							'enum'        => Settings::language_codes(),
							'description' => __( 'UI language code (e.g. en, sv).', 'easeaccess24-accessibility' ),
						),
						'removeDataOnUninstall' => array(
							'type'        => 'boolean',
							'required'    => false,
							'description' => __( 'Whether deleting the plugin should also remove all stored data.', 'easeaccess24-accessibility' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Only administrators may read or change the connection.
	 *
	 * The `wp_rest` nonce (see class-admin.php) is verified by WordPress from the
	 * X-WP-Nonce header for cookie-authenticated requests.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Return the current connection state.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_connection() {
		return rest_ensure_response( Connection::get() );
	}

	/**
	 * Extract and persist a Widget Key, then return the updated connection.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function save_connection( $request ) {
		Connection::save_widget_key( (string) $request->get_param( 'key' ) );

		return rest_ensure_response( Connection::get() );
	}

	/**
	 * Persist the outcome of an on-demand Health Check.
	 *
	 * Stores the derived reason code as the connection's backend_status and
	 * stamps last_health_check with the server clock (avoids trusting a client
	 * clock). Connection::update sanitizes both fields; the code is stored as an
	 * observation, never as a validation of the key/domain/subscription.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function save_health_result( $request ) {
		$code = (string) $request->get_param( 'code' );

		Connection::update(
			array(
				'backend_status'    => $code,
				'last_health_check' => time(),
			)
		);

		// Record the observed outcome in the local event log.
		EventLog::record( 'health_check', $code );

		return rest_ensure_response( Connection::get() );
	}

	/**
	 * Return the local event log, newest first.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_events() {
		return rest_ensure_response( EventLog::get() );
	}

	/**
	 * Clear the local event log.
	 *
	 * @return \WP_REST_Response
	 */
	public function clear_events() {
		EventLog::clear();

		return rest_ensure_response( array( 'cleared' => true ) );
	}

	/**
	 * Assemble and return a Support Report (structured data + plaintext).
	 *
	 * The plugin transmits nothing: the report is returned to the admin app for
	 * the user to preview, copy, or download. The structured `report` and the
	 * `text` rendering are the exact same data, so downloads match the preview.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_support_report() {
		$report = SupportReport::generate();

		return rest_ensure_response(
			array(
				'report' => $report,
				'text'   => SupportReport::to_text( $report ),
			)
		);
	}

	/**
	 * Return the current app preferences.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_settings() {
		return rest_ensure_response( $this->settings_payload() );
	}

	/**
	 * Persist app preferences. Both fields are optional; only those present in
	 * the request are updated. An out-of-allowlist language is rejected by the
	 * route's `enum` before reaching here.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function save_settings( $request ) {
		if ( null !== $request->get_param( 'language' ) ) {
			Settings::set_language( (string) $request->get_param( 'language' ) );
		}

		if ( null !== $request->get_param( 'removeDataOnUninstall' ) ) {
			Settings::set_remove_data( (bool) $request->get_param( 'removeDataOnUninstall' ) );
		}

		return rest_ensure_response( $this->settings_payload() );
	}

	/**
	 * Shape the settings response consistently for GET and POST.
	 *
	 * @return array<string,mixed>
	 */
	private function settings_payload() {
		return array(
			'language'              => Settings::get_language(),
			'removeDataOnUninstall' => Settings::get_remove_data(),
		);
	}
}
