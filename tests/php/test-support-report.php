<?php
/**
 * Tests for the Support Report: redaction (masked key, no full key), that all
 * sections are present, and that the plaintext rendering reflects the same data
 * shown in the structured report (preview/download parity).
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use WP_UnitTestCase;

/**
 * @covers \EaseAccess24\Accessibility\SupportReport
 */
class Test_SupportReport extends WP_UnitTestCase {

	/**
	 * Reset stored state before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Connection::OPTION );
		delete_option( EventLog::OPTION );
		update_option( 'active_plugins', array() );
	}

	/**
	 * generate() masks the Widget Key and never exposes the full value.
	 */
	public function test_widget_key_is_masked() {
		Connection::save_widget_key( 'ABCDEFGHIJ' );

		$report = SupportReport::generate();
		$masked = $report['connection']['widget_key'];

		// Last four visible, the rest hidden, and the full key absent.
		$this->assertStringEndsWith( 'GHIJ', $masked );
		$this->assertStringContainsString( '•', $masked );
		$this->assertStringNotContainsString( 'ABCDEF', $masked );
	}

	/**
	 * generate() includes every expected top-level section.
	 */
	public function test_report_has_all_sections() {
		$report = SupportReport::generate();

		foreach ( array( 'generated_at', 'plugin', 'environment', 'connection', 'compatibility', 'events' ) as $key ) {
			$this->assertArrayHasKey( $key, $report );
		}

		$this->assertArrayHasKey( 'wordpress', $report['environment'] );
		$this->assertArrayHasKey( 'php', $report['environment'] );
		$this->assertSame( EASEACCESS24_VERSION, $report['plugin']['version'] );
	}

	/**
	 * Logged events flow into the report.
	 */
	public function test_events_are_included() {
		EventLog::record( 'health_check', 'OK' );

		$report = SupportReport::generate();

		$this->assertNotEmpty( $report['events'] );
		$this->assertSame( 'health_check', $report['events'][0]['type'] );
	}

	/**
	 * The plaintext rendering reflects the same (masked) data as the structured
	 * report — the masked key appears, the full key never does.
	 */
	public function test_text_matches_structured_data() {
		Connection::save_widget_key( 'ABCDEFGHIJ' );

		$report = SupportReport::generate();
		$text   = SupportReport::to_text( $report );

		$this->assertStringContainsString( 'Support Report', $text );
		$this->assertStringContainsString( $report['connection']['widget_key'], $text );
		$this->assertStringNotContainsString( 'ABCDEFGHIJ', $text );
	}
}
