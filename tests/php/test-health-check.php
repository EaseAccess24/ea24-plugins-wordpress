<?php
/**
 * Tests for HealthCheck: the front-end probe is enqueued ONLY for an admin with a
 * valid nonce, in the head, with its config localized. (Extracted from the former
 * test-health.php; the SDK URL helper now lives in test-sdk-loader.php and the
 * /health REST route in test-rest.php.)
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use EaseAccess24\Accessibility\Tests\TestCase;

/**
 * @covers \EaseAccess24\Accessibility\HealthCheck
 */
class Test_HealthCheck extends TestCase {

	/**
	 * The probe is NOT enqueued on an ordinary front-end request.
	 */
	public function test_probe_not_enqueued_without_flag() {
		$this->login_as_admin();

		( new HealthCheck() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertFalse( wp_script_is( HealthCheck::PROBE_HANDLE, 'enqueued' ) );
	}

	/**
	 * The probe is NOT enqueued for a visitor even with a valid nonce.
	 */
	public function test_probe_not_enqueued_for_anonymous() {
		wp_set_current_user( 0 );

		$_GET[ HealthCheck::QUERY_VAR ] = wp_create_nonce( HealthCheck::NONCE_ACTION );

		( new HealthCheck() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertFalse( wp_script_is( HealthCheck::PROBE_HANDLE, 'enqueued' ) );

		unset( $_GET[ HealthCheck::QUERY_VAR ] );
	}

	/**
	 * With an admin AND a valid nonce, the probe is enqueued in the head with its
	 * config localized.
	 */
	public function test_probe_enqueued_for_admin_with_valid_nonce() {
		$this->login_as_admin();
		Connection::save_widget_key( 'ABC123' );

		$_GET[ HealthCheck::QUERY_VAR ] = wp_create_nonce( HealthCheck::NONCE_ACTION );

		( new HealthCheck() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertTrue( wp_script_is( HealthCheck::PROBE_HANDLE, 'enqueued' ) );

		// Not deferred to the footer — must load before the async SDK.
		$script = wp_scripts()->registered[ HealthCheck::PROBE_HANDLE ];
		$this->assertNotEmpty( $script, 'Probe script should be registered.' );
		$this->assertEmpty(
			isset( $script->extra['group'] ) ? $script->extra['group'] : null,
			'Probe should be enqueued in the head (no footer group).'
		);

		// Localized config is attached.
		$data = $script->extra['data'];
		$this->assertStringContainsString( 'easeAccess24Probe', (string) $data );
		$this->assertStringContainsString( 'ea24-open-widget-btn', (string) $data );

		unset( $_GET[ HealthCheck::QUERY_VAR ] );
	}

	/**
	 * The probe looks the SDK element up with document.getElementById( sdkScriptId ),
	 * so that value must be the id WordPress actually renders — which is the script
	 * handle plus a "-js" suffix, not the bare handle.
	 *
	 * This is guarded because the failure is silent and misleading rather than loud:
	 * a stale id makes the probe report the SDK as missing AND count our own tag as a
	 * foreign duplicate, surfacing as a false "optimizer interference" plus a
	 * "possible duplicate widget" warning in the admin UI.
	 */
	public function test_probe_config_uses_the_rendered_sdk_element_id() {
		$this->login_as_admin();
		Connection::save_widget_key( 'DEMO-WIDGET-KEY' );

		$_GET[ HealthCheck::QUERY_VAR ] = wp_create_nonce( HealthCheck::NONCE_ACTION );

		( new HealthCheck() )->register();
		do_action( 'wp_enqueue_scripts' );

		$data = (string) wp_scripts()->registered[ HealthCheck::PROBE_HANDLE ]->extra['data'];

		$this->assertSame(
			SdkLoader::SCRIPT_HANDLE . '-js',
			SdkLoader::SCRIPT_ID,
			'The rendered id must stay in step with how WordPress derives it.'
		);
		$this->assertStringContainsString( '"sdkScriptId":"easeaccess24-sdk-js"', $data );

		unset( $_GET[ HealthCheck::QUERY_VAR ] );
	}
}
