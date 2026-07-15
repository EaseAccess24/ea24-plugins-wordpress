<?php
/**
 * SDK loader.
 *
 * Injects exactly one external, async widget SDK <script> into <head> when a
 * Widget Key is stored. This is the only place the plugin prints a raw tag.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Prints the widget SDK script on the front end.
 *
 * The plugin validates nothing: it emits the SDK tag and lets the SDK/platform
 * handle key, domain and subscription checks at load time.
 */
class SdkLoader {

	/**
	 * Base URL of the widget SDK. The Widget Key is appended as a query arg.
	 */
	const SDK_URL = 'https://dev-widget.easeaccess24.com/sdk.js';

	/**
	 * DOM id of the injected script. Gives the health probe and duplicate
	 * detection (later phases) a stable element to look for.
	 */
	const SCRIPT_ID = 'easeaccess24-sdk';

	/**
	 * Guards against printing the tag more than once per request.
	 *
	 * @var bool
	 */
	private $printed = false;

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
		add_action( 'wp_head', array( $this, 'print_sdk_script' ) );
	}

	/**
	 * Print the single async SDK script tag into <head>.
	 *
	 * Emits nothing when no Widget Key is stored. No inline configuration is
	 * printed — only the external script with the key in its query string.
	 */
	public function print_sdk_script() {
		if ( $this->printed ) {
			return;
		}

		$key = Connection::get_widget_key();

		if ( '' === $key ) {
			return;
		}

		$this->printed = true;

		$url = self::url_for( $key );

		/*
		 * data-* attributes are non-destructive hints that tell common
		 * cache/optimizer plugins to leave this tag alone. They never alter
		 * other scripts and are ignored by hosts that do not recognize them:
		 *   - data-cfasync="false"  -> Cloudflare Rocket Loader skips it.
		 *   - data-no-optimize="1"  -> Autoptimize / Perfmatters / LiteSpeed.
		 *   - data-no-defer="1"     -> prevents defer/delay rewriting.
		 *   - data-no-minify="1"    -> WP Rocket skips minification.
		 */

		/*
		 * This is the ONE intentional raw <script> tag the plugin prints (see the
		 * project's hard rules): a single external, async SDK loader in <head>. It
		 * cannot go through wp_enqueue_script() because the widget SDK must load
		 * without WordPress's version query arg or dependency rewriting, and with
		 * the cache/optimizer data-* hints intact. Output is escaped below. The
		 * WordPress.WP.EnqueuedResources sniff is excluded for this file in
		 * phpcs.xml.dist for exactly this reason.
		 */
		printf(
			'<script id="%1$s" async src="%2$s" data-cfasync="false" data-no-optimize="1" data-no-defer="1" data-no-minify="1"></script>' . "\n",
			esc_attr( self::SCRIPT_ID ),
			esc_url( $url )
		);
	}
}
