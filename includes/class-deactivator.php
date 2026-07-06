<?php
/**
 * Deactivation handler.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Runs on plugin deactivation. Intentionally a no-op.
 *
 * Deactivation must stop SDK injection while retaining configuration. Both fall
 * out for free: the SDK loader's `wp_head` hook is only added while the plugin
 * is active, so deactivation stops injection on its own, and because this
 * callback writes nothing, the stored connection (option `easeaccess24_connection`)
 * persists for reactivation. Data removal is opt-in and handled by uninstall.php.
 */
class Deactivator {

	/**
	 * Deactivation callback.
	 */
	public static function deactivate() {
		// No teardown needed (see the class docblock): the injection hook is not
		// registered when inactive, and config must persist. We only note the
		// event in the local capped event log.
		EventLog::record( 'deactivated' );
	}
}
