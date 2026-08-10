<?php
/**
 * SDK loader.
 *
 * Enqueues exactly one external widget SDK script in <head> when a Widget Key is
 * stored. Everything goes through core APIs: wp_enqueue_script() with the
 * 'async' loading strategy, and the wp_script_attributes filter for the
 * cache/optimizer hint attributes. WordPress renders the tag itself; this class
 * never builds script markup.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues the widget SDK script on the front end.
 *
 * The plugin validates nothing: it emits the SDK tag and lets the SDK/platform
 * handle key, domain and subscription checks at load time.
 */
class SdkLoader {

	/**
	 * Base URL of the widget SDK. The Widget Key is appended as a query arg.
	 */
	const SDK_URL = 'https://widget.easeaccess24.com/sdk.js';

	/**
	 * Registered script handle, used for every wp_scripts / wp_enqueue call.
	 */
	const SCRIPT_HANDLE = 'easeaccess24-sdk';

	/**
	 * The id WordPress renders on the script element. Core builds this as
	 * "{$handle}-js", so it is derived rather than hard-coded: the health probe
	 * (which looks the element up by id) and our own attribute filter both key
	 * off this, and they cannot drift from what core actually emits.
	 */
	const SCRIPT_ID = self::SCRIPT_HANDLE . '-js';

	/**
	 * Build the external SDK URL for a given Widget Key.
	 *
	 * Single source of truth for the URL shape, reused by the front-end tag, the
	 * admin bootstrap data, and the health-check probe config so they can never
	 * drift apart. The key is not a secret; it is URL-encoded, and callers escape
	 * at output time.
	 *
	 * @param string $key Widget Key.
	 * @return string The SDK URL, or '' when no key is given.
	 */
	public static function url_for( $key ) {
		$key = (string) $key;

		if ( '' === $key ) {
			return '';
		}

		return self::SDK_URL . '?key=' . rawurlencode( $key );
	}

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		// Priority 20: HealthCheck enqueues the probe on wp_enqueue_scripts at the
		// default priority (10) and its console-capture logic depends on printing
		// before the SDK tag. Both now print via the same wp_print_head_scripts
		// call, so enqueue order (not hook priority) decides print order — this
		// keeps the SDK enqueued after the probe, every time.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_sdk_script' ), 20 );
		add_filter( 'wp_script_attributes', array( $this, 'filter_script_attributes' ) );
	}

	/**
	 * Enqueue the SDK script for printing in <head>.
	 *
	 * Emits nothing when no Widget Key is stored. No inline configuration is
	 * enqueued — only the external script with the key in its query string.
	 */
	public function enqueue_sdk_script() {
		$key = Connection::get_widget_key();

		if ( '' === $key ) {
			return;
		}

		// The URL is passed raw because core runs it through esc_url_raw() at
		// print time; escaping it here would entity-encode any future "&"
		// separator. 'strategy' => 'async' is core's own async support (WP 6.3+),
		// and 'in_footer' => false keeps the tag in <head>.
		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			self::url_for( $key ),
			array(),
			// A null version is intentional, not an oversight: WordPress would
			// otherwise append its own "?ver=", corrupting the exact "?key=..."
			// URL the SDK requires. The SDK is versioned by the platform, not by
			// this plugin, so there is no version for us to advertise.
			null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			array(
				'strategy'  => 'async',
				'in_footer' => false,
			)
		);
	}

	/**
	 * Add the SDK's cache/optimizer hint attributes to its own script tag.
	 *
	 * These data-* attributes are non-destructive hints telling common
	 * cache/optimizer plugins to leave this one tag alone. Hosts that do not
	 * recognize them ignore them:
	 *   - data-cfasync="false"  -> Cloudflare Rocket Loader skips it.
	 *   - data-no-optimize="1"  -> Autoptimize / Perfmatters / LiteSpeed.
	 *   - data-no-defer="1"     -> prevents defer/delay rewriting.
	 *   - data-no-minify="1"    -> WP Rocket skips minification.
	 *
	 * WordPress applies this filter to EVERY script tag it renders and passes no
	 * handle, so the id guard below is what keeps these attributes off the admin
	 * bundle, the health probe, the theme's scripts and other plugins' scripts.
	 * Core populates 'id' before running this filter, so matching on it is safe.
	 *
	 * @param array<string,mixed> $attributes Attributes core is about to render.
	 * @return array<string,mixed> Attributes, extended only for our own tag.
	 */
	public function filter_script_attributes( $attributes ) {
		if ( ! isset( $attributes['id'] ) || self::SCRIPT_ID !== $attributes['id'] ) {
			return $attributes;
		}

		return array_merge(
			$attributes,
			array(
				'data-cfasync'     => 'false',
				'data-no-optimize' => '1',
				'data-no-defer'    => '1',
				'data-no-minify'   => '1',
			)
		);
	}
}
