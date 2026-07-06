<?php
/**
 * Shared base test case for the plugin's WordPress-integration suite.
 *
 * DRYs the two things nearly every test needs: a clean slate of plugin options
 * before each test, and an admin login helper for capability-gated paths. Lives
 * in its own Tests sub-namespace so it never leaks into the plugin namespace, and
 * is excluded from collection in phpunit.xml.dist (it is abstract, with no tests).
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility\Tests;

use EaseAccess24\Accessibility\Connection;
use EaseAccess24\Accessibility\EventLog;
use EaseAccess24\Accessibility\Settings;
use WP_UnitTestCase;

/**
 * Base class: resets plugin state and provides an admin-login helper.
 */
abstract class TestCase extends WP_UnitTestCase {

	/**
	 * Start every test from a clean set of plugin options.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_plugin_options();
	}

	/**
	 * Delete every option the plugin persists, so tests never leak into one
	 * another. Matches the list uninstall.php removes on opt-in.
	 */
	protected function reset_plugin_options() {
		delete_option( Connection::OPTION );
		delete_option( EventLog::OPTION );
		delete_option( Settings::OPTION_LANGUAGE );
		delete_option( Settings::OPTION_REMOVE_DATA );
		delete_option( Settings::OPTION_VERSION );
	}

	/**
	 * Make the current user an administrator and return the new user ID.
	 *
	 * @return int New administrator user ID.
	 */
	protected function login_as_admin() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		return $user_id;
	}
}
