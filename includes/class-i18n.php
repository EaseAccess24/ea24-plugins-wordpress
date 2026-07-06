<?php
/**
 * Internationalization loader.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Loads the PHP text domain. The React app's i18next JSON pipeline is wired in
 * a later phase; this class owns the server side of translation.
 */
class I18n {

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		add_action( 'init', array( $this, 'load_textdomain' ) );
	}

	/**
	 * Load translations for the plugin's text domain.
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'easeaccess24-accessibility',
			false,
			dirname( EASEACCESS24_BASENAME ) . '/languages'
		);
	}
}
