<?php
/**
 * Activation handler.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Runs on plugin activation.
 */
class Activator {

	/**
	 * Activation callback.
	 */
	public static function activate() {
		// Record activation in the local event log. The log is a capped option,
		// so there is no table to create here.
		EventLog::record( 'activated' );

		// Stamp the version and back-fill new option defaults on fresh installs.
		// The runtime admin_init gate (Settings::maybe_upgrade) handles upgrades;
		// running it here covers the fresh-install path immediately.
		Settings::maybe_upgrade();
	}
}
