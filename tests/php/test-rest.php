<?php
/**
 * Tests for the plugin's REST controller — every easeaccess24/v1 route in one
 * suite: connection read/save, health-result persistence (+ event logging),
 * event log read/clear, support report, settings, and capability gating.
 *
 * Consolidates the former test-health.php (health route) and test-rest-phase05.php
 * (events/support-report) so route registration and admin-login setup live once.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use EaseAccess24\Accessibility\Tests\TestCase;
use WP_REST_Request;

/**
 * @covers \EaseAccess24\Accessibility\RestController
 */
class Test_Rest extends TestCase {

	/**
	 * Register the plugin's REST routes for each request under test.
	 */
	public function set_up() {
		parent::set_up();

		( new RestController() )->register();
		do_action( 'rest_api_init' );
	}

	/**
	 * GET /connection returns the fully-shaped connection for an administrator.
	 */
	public function test_get_connection_returns_shape() {
		$this->login_as_admin();

		$response = rest_do_request( new WP_REST_Request( 'GET', '/easeaccess24/v1/connection' ) );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'widget_key', $data );
		$this->assertArrayHasKey( 'backend_status', $data );
	}

	/**
	 * POST /connection extracts and persists a key — from both a raw key and a
	 * full script snippet (the controller delegates extraction to Connection).
	 */
	public function test_post_connection_saves_extracted_key() {
		$this->login_as_admin();

		$request = new WP_REST_Request( 'POST', '/easeaccess24/v1/connection' );
		$request->set_body_params(
			array( 'key' => '<script async src="https://widget.easeaccess24.com/sdk.js?key=SNIP123"></script>' )
		);

		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'SNIP123', $response->get_data()['widget_key'] );
		$this->assertSame( 'SNIP123', Connection::get_widget_key() );
	}

	/**
	 * POST /health persists the observed code as backend_status with a
	 * server-stamped timestamp, and records a health_check event.
	 */
	public function test_health_route_persists_code_and_records_event() {
		$this->login_as_admin();
		Connection::save_widget_key( 'ABC123' );

		$request = new WP_REST_Request( 'POST', '/easeaccess24/v1/health' );
		$request->set_body_params( array( 'code' => 'OK' ) );

		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'OK', $data['backend_status'] );
		$this->assertIsInt( $data['last_health_check'] );
		$this->assertGreaterThan( 0, $data['last_health_check'] );

		// Persisted, not just echoed.
		$this->assertSame( 'OK', Connection::get()['backend_status'] );

		// The persist also appended to the local event log.
		$this->assertContains( 'health_check', wp_list_pluck( EventLog::get(), 'type' ) );
	}

	/**
	 * GET /events returns the stored events for an administrator.
	 */
	public function test_get_events_returns_log() {
		$this->login_as_admin();
		EventLog::record( 'health_check', 'OK' );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/easeaccess24/v1/events' ) );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertSame( 'health_check', $data[0]['type'] );
	}

	/**
	 * POST /events/clear empties the log.
	 */
	public function test_clear_events_empties_log() {
		$this->login_as_admin();
		EventLog::record( 'activated' );

		$response = rest_do_request( new WP_REST_Request( 'POST', '/easeaccess24/v1/events/clear' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['cleared'] );
		$this->assertCount( 0, EventLog::get() );
	}

	/**
	 * GET /support-report returns both the structured report and its plaintext.
	 */
	public function test_support_report_returns_report_and_text() {
		$this->login_as_admin();

		$response = rest_do_request( new WP_REST_Request( 'GET', '/easeaccess24/v1/support-report' ) );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'report', $data );
		$this->assertArrayHasKey( 'text', $data );
		$this->assertArrayHasKey( 'environment', $data['report'] );
		$this->assertStringContainsString( 'Support Report', $data['text'] );
	}

	/**
	 * GET /settings returns the current preferences; POST persists a language.
	 */
	public function test_settings_round_trip() {
		$this->login_as_admin();

		$get = rest_do_request( new WP_REST_Request( 'GET', '/easeaccess24/v1/settings' ) );
		$this->assertSame( 200, $get->get_status() );
		$this->assertArrayHasKey( 'language', $get->get_data() );

		$request = new WP_REST_Request( 'POST', '/easeaccess24/v1/settings' );
		$request->set_body_params( array( 'language' => 'sv' ) );

		$post = rest_do_request( $request );
		$this->assertSame( 200, $post->get_status() );
		$this->assertSame( 'sv', $post->get_data()['language'] );
		$this->assertSame( 'sv', Settings::get_language() );
	}

	/**
	 * Every route requires the manage_options capability for anonymous users.
	 */
	public function test_routes_require_capability() {
		wp_set_current_user( 0 );

		$routes = array(
			array( 'GET', '/easeaccess24/v1/connection' ),
			array( 'POST', '/easeaccess24/v1/health' ),
			array( 'GET', '/easeaccess24/v1/events' ),
			array( 'POST', '/easeaccess24/v1/events/clear' ),
			array( 'GET', '/easeaccess24/v1/support-report' ),
			array( 'GET', '/easeaccess24/v1/settings' ),
		);

		foreach ( $routes as $route ) {
			$request = new WP_REST_Request( $route[0], $route[1] );

			// Supply the health route's required `code` so the ONLY reason for
			// rejection is the failed permission check (401), not arg validation.
			if ( '/easeaccess24/v1/health' === $route[1] ) {
				$request->set_body_params( array( 'code' => 'OK' ) );
			}

			$response = rest_do_request( $request );
			$this->assertSame( 401, $response->get_status(), $route[1] . ' should require auth' );
		}
	}
}
