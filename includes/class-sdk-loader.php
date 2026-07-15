<?php
/**
 * SDK loader.
 *
 * Enqueues exactly one external, async widget SDK <script> into <head> when a
 * Widget Key is stored, via wp_enqueue_script() + the script_loader_tag filter
 * (the WordPress-sanctioned way to attach custom attributes to a script tag).
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
	 * Script handle and DOM id of the injected script. Gives the health probe
	 * and duplicate detection a stable element to look for. Also used as the
	 * script_loader_tag filter's own rendered id (WordPress core would
	 * otherwise append "-js" to the handle for the id attribute).
	 */
	const SCRIPT_ID = 'easeaccess24-sdk';

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
		add_filter( 'script_loader_tag', array( $this, 'filter_script_tag' ), 10, 2 );
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

		// $ver = null is intentional, not an oversight: it avoids WordPress
		// appending its own "?ver=" query string, preserving the exact
		// "?key=..." URL the SDK requires. in_footer = false keeps it in
		// <head>, matching the previous raw-tag placement.
		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( self::SCRIPT_ID, esc_url( self::url_for( $key ) ), array(), null, false );
	}

	/**
	 * Re-apply the SDK tag's required attributes via script_loader_tag.
	 *
	 * Data-* attributes are non-destructive hints that tell common
	 * cache/optimizer plugins to leave this tag alone. They never alter other
	 * scripts and are ignored by hosts that do not recognize them:
	 *   - data-cfasync="false"  -> Cloudflare Rocket Loader skips it.
	 *   - data-no-optimize="1"  -> Autoptimize / Perfmatters / LiteSpeed.
	 *   - data-no-defer="1"     -> prevents defer/delay rewriting.
	 *   - data-no-minify="1"    -> WP Rocket skips minification.
	 *
	 * The tag is rebuilt from scratch (rather than patched) so the rendered id
	 * stays exactly self::SCRIPT_ID — WordPress core would otherwise append
	 * "-js" to the handle, which would break the health probe's selector and
	 * the e2e assertions that look for this exact id.
	 *
	 * @param string $tag    The script tag WordPress generated.
	 * @param string $handle The script's registered handle.
	 * @return string
	 */
	public function filter_script_tag( $tag, $handle ) {
		if ( self::SCRIPT_ID !== $handle ) {
			return $tag;
		}

		$key = Connection::get_widget_key();

		if ( '' === $key ) {
			return $tag;
		}

		// This rebuilds the tag WordPress already enqueued via wp_enqueue_script()
		// above; it is not a second, unregistered script output.
		return sprintf(
			// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
			'<script id="%1$s" async src="%2$s" data-cfasync="false" data-no-optimize="1" data-no-defer="1" data-no-minify="1"></script>' . "\n",
			esc_attr( self::SCRIPT_ID ),
			esc_url( self::url_for( $key ) )
		);
	}
}
