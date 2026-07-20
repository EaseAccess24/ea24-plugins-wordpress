<?php
/**
 * Plugin Name:       EaseAccess24 Accessibility
 * Description:       Connects your WordPress site to the EaseAccess24 accessibility platform: paste your Widget Key, inject the widget SDK, and run an on-demand health check.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            EaseAccess24
 * Author URI:        https://easeaccess24.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       easeaccess24-accessibility
 * Domain Path:       /languages
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

// Abort if this file is called directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin constants. Prefixed with EASEACCESS24_ to avoid collisions.
 */
define( 'EASEACCESS24_VERSION', '1.0.0' );
define( 'EASEACCESS24_FILE', __FILE__ );
define( 'EASEACCESS24_PATH', plugin_dir_path( __FILE__ ) );
define( 'EASEACCESS24_URL', plugin_dir_url( __FILE__ ) );
define( 'EASEACCESS24_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Lightweight PSR-4-style autoloader.
 *
 * Maps the `EaseAccess24\Accessibility\` namespace to WordPress-style class
 * files under `includes/` (e.g. `Admin` -> `includes/class-admin.php`,
 * `Foo\Bar` -> `includes/foo/class-bar.php`). Keeps the runtime free of any
 * Composer dependency; Composer is used for dev tooling only.
 */
spl_autoload_register(
	function ( $class_name ) {
		$prefix = __NAMESPACE__ . '\\';
		$length = strlen( $prefix );

		if ( 0 !== strncmp( $prefix, $class_name, $length ) ) {
			return;
		}

		$relative = substr( $class_name, $length );
		$parts    = explode( '\\', $relative );
		$class_nm = array_pop( $parts );

		// CamelCase -> dash-case, then WordPress `class-*.php` naming.
		$file = 'class-' . strtolower( preg_replace( '/([a-z0-9])([A-Z])/', '$1-$2', $class_nm ) ) . '.php';

		$sub  = $parts ? strtolower( implode( '/', $parts ) ) . '/' : '';
		$path = EASEACCESS24_PATH . 'includes/' . $sub . $file;

		if ( is_readable( $path ) ) {
			require $path;
		}
	}
);

// Lifecycle hooks. Handlers are intentionally thin stubs in Phase 01.
register_activation_hook( __FILE__, array( Activator::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivator::class, 'deactivate' ) );

/**
 * Boot the plugin once all plugins are loaded.
 */
Plugin::instance();
