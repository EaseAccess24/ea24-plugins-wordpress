<?php
/**
 * Main plugin orchestrator.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wires the plugin's modules together. Deliberately thin: it constructs the
 * modules and lets each register its own hooks.
 */
final class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Return the shared instance, constructing it on first call.
	 *
	 * @return Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register module hooks.
	 */
	private function __construct() {
		( new Settings() )->register();
		( new Admin() )->register();
		( new SdkLoader() )->register();
		( new RestController() )->register();
		( new HealthCheck() )->register();
	}

	/**
	 * Prevent cloning of the singleton.
	 */
	private function __clone() {}

	/**
	 * Prevent unserialization of the singleton.
	 */
	public function __wakeup() {}
}
