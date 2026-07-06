<?php
/**
 * Tests for uninstall data-gating (uninstall.php).
 *
 * Data removal is OPT-IN: deleting the plugin preserves configuration for a
 * reinstall unless the user enabled "Remove all EaseAccess24 data". This is the
 * one lifecycle behavior the rest of the suite did not cover.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use EaseAccess24\Accessibility\Tests\TestCase;

/**
 * @covers ::uninstall
 */
class Test_Uninstall extends TestCase {

	/**
	 * Run uninstall.php the way WordPress does: with WP_UNINSTALL_PLUGIN defined.
	 * The constant persists for the process, so later calls re-run the same logic.
	 */
	private function run_uninstall() {
		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			define( 'WP_UNINSTALL_PLUGIN', 'easeaccess24-accessibility/easeaccess24-accessibility.php' );
		}

		require dirname( __DIR__, 2 ) . '/uninstall.php';
	}

	/**
	 * With the flag OFF (the default), all stored data is preserved.
	 */
	public function test_data_preserved_when_flag_off() {
		Connection::save_widget_key( 'ABC123' );
		Settings::set_language( 'sv' );

		$this->assertFalse( Settings::get_remove_data(), 'Remove-data must default to off.' );

		$this->run_uninstall();

		$this->assertSame( 'ABC123', Connection::get_widget_key(), 'Connection should survive uninstall.' );
		$this->assertSame( 'sv', Settings::get_language(), 'Language should survive uninstall.' );
	}

	/**
	 * With the flag ON, every plugin option is removed.
	 */
	public function test_data_removed_when_flag_on() {
		Connection::save_widget_key( 'ABC123' );
		EventLog::record( 'activated' );
		Settings::set_language( 'sv' );
		update_option( Settings::OPTION_VERSION, EASEACCESS24_VERSION );
		Settings::set_remove_data( true );

		$this->run_uninstall();

		$this->assertFalse( get_option( Connection::OPTION ), 'Connection option should be deleted.' );
		$this->assertFalse( get_option( EventLog::OPTION ), 'Event log option should be deleted.' );
		$this->assertFalse( get_option( Settings::OPTION_LANGUAGE ), 'Language option should be deleted.' );
		$this->assertFalse( get_option( Settings::OPTION_VERSION ), 'Version option should be deleted.' );
		$this->assertFalse( get_option( Settings::OPTION_REMOVE_DATA ), 'Remove-data flag should be deleted.' );
	}
}
