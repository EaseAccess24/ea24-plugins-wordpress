<?php
/**
 * Cache/optimizer compatibility helper.
 *
 * Detects known caching and asset-optimization plugins so the admin UI can show
 * exclusion recommendations. Detection reads LOCAL plugin state only — it makes
 * no remote calls and never changes another plugin's settings or theme files.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Detects active cache/optimizer plugins.
 *
 * Passive static helper — registers no hooks. The admin bootstrap calls detect()
 * and hands the result to the React app, which pairs it with per-plugin exclusion
 * copy. Cloudflare is a special case: only the official plugin is detectable;
 * Cloudflare running purely as a CDN/edge (Rocket Loader, Auto Minify) cannot be
 * seen from PHP, so the UI copy states this rather than implying all-clear.
 */
class Compatibility {

	/**
	 * Known plugins keyed by a stable slug the UI uses to look up copy.
	 *
	 * @return array<string,array{name:string,file:string}>
	 */
	public static function known_plugins() {
		return array(
			'wp-rocket'     => array(
				'name' => 'WP Rocket',
				'file' => 'wp-rocket/wp-rocket.php',
			),
			'litespeed'     => array(
				'name' => 'LiteSpeed Cache',
				'file' => 'litespeed-cache/litespeed-cache.php',
			),
			'autoptimize'   => array(
				'name' => 'Autoptimize',
				'file' => 'autoptimize/autoptimize.php',
			),
			'perfmatters'   => array(
				'name' => 'Perfmatters',
				'file' => 'perfmatters/perfmatters.php',
			),
			'asset-cleanup' => array(
				'name' => 'Asset CleanUp',
				'file' => 'wp-asset-clean-up/wpacu.php',
			),
			'cloudflare'    => array(
				'name' => 'Cloudflare',
				'file' => 'cloudflare/cloudflare.php',
			),
		);
	}

	/**
	 * Return the subset of known plugins that are currently active.
	 *
	 * Uses is_plugin_active(), which also accounts for network-active plugins on
	 * multisite. wp-admin/includes/plugin.php is not always loaded (it is on
	 * admin screens, but be defensive), so require it first.
	 *
	 * @return array<int,array{slug:string,name:string}>
	 */
	public static function detect() {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$active = array();

		foreach ( self::known_plugins() as $slug => $plugin ) {
			if ( is_plugin_active( $plugin['file'] ) ) {
				$active[] = array(
					'slug' => $slug,
					'name' => $plugin['name'],
				);
			}
		}

		return $active;
	}
}
