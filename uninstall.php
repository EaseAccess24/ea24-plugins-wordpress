<?php
/**
 * Uninstall handler.
 *
 * Runs only when the user deletes the plugin from wp-admin. Data removal is
 * opt-in: configuration persists across reinstalls unless the user explicitly
 * enabled "Remove all EaseAccess24 data". Theme files are never touched.
 *
 * @package EaseAccess24\Accessibility
 */

// Abort if WordPress did not invoke this file as an uninstaller.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Option name that, when true, opts the site into full data removal on delete.
$easeaccess24_remove_data_flag = 'easeaccess24_remove_data_on_uninstall';

if ( (bool) get_option( $easeaccess24_remove_data_flag, false ) ) {
	// Full opt-in removal: drop every option the plugin stores. The event log is
	// a capped option (no custom table to drop). Option names are duplicated here
	// as literals because uninstall.php runs standalone, without the plugin's
	// classes/autoloader loaded.
	delete_option( 'easeaccess24_connection' );
	delete_option( 'easeaccess24_event_log' );
	delete_option( 'easeaccess24_language' );
	delete_option( 'easeaccess24_version' );
	delete_option( $easeaccess24_remove_data_flag );
}
