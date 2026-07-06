<?php
/**
 * Tests for the Connection store: key extraction and option read/write.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use WP_UnitTestCase;

/**
 * @covers \EaseAccess24\Accessibility\Connection
 */
class Test_Connection extends WP_UnitTestCase {

	/**
	 * Ensure each test starts with no stored connection.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Connection::OPTION );
	}

	/**
	 * Inputs the extractor must handle and their expected key.
	 *
	 * @return array<string,array{0:string,1:string}>
	 */
	public function key_input_provider() {
		return array(
			'raw key'                  => array( 'ABC123', 'ABC123' ),
			'full snippet dq'          => array( '<script async src="https://widget.easeaccess24.com/sdk.js?key=ABC123"></script>', 'ABC123' ),
			'full snippet sq'          => array( "<script async src='https://widget.easeaccess24.com/sdk.js?key=ABC123'></script>", 'ABC123' ),
			'extra query params'       => array( '<script src="https://widget.easeaccess24.com/sdk.js?key=ABC123&foo=bar"></script>', 'ABC123' ),
			'surrounding whitespace'   => array( "  \n  ABC123 \n ", 'ABC123' ),
			'entity-encoded amp'       => array( '<script src="https://widget.easeaccess24.com/sdk.js?key=ABC123&amp;v=2"></script>', 'ABC123' ),
			'allowed charset'          => array( 'AB_c-1.2', 'AB_c-1.2' ),
			'empty input'              => array( '', '' ),
			'whitespace only'          => array( "   \n\t ", '' ),
			'markup without key'       => array( '<script>alert(1)</script>', '' ),
			'raw key illegal stripped' => array( 'AB C1"2 3', 'ABC123' ),
		);
	}

	/**
	 * @dataProvider key_input_provider
	 *
	 * @param string $input    Raw key or snippet.
	 * @param string $expected Expected extracted key.
	 */
	public function test_extract_widget_key( $input, $expected ) {
		$this->assertSame( $expected, Connection::extract_widget_key( $input ) );
	}

	/**
	 * An unset option returns the full default shape.
	 */
	public function test_get_returns_defaults_when_unset() {
		$connection = Connection::get();

		$this->assertSame( '', $connection['widget_key'] );
		$this->assertSame( '', $connection['resolved_domain'] );
		$this->assertSame( 'unknown', $connection['backend_status'] );
		$this->assertNull( $connection['last_health_check'] );
	}

	/**
	 * Saving a raw key persists it and round-trips through get().
	 */
	public function test_save_widget_key_persists_raw_key() {
		$stored = Connection::save_widget_key( 'ABC123' );

		$this->assertSame( 'ABC123', $stored );
		$this->assertSame( 'ABC123', Connection::get_widget_key() );
	}

	/**
	 * Saving a full snippet persists only the extracted key.
	 */
	public function test_save_widget_key_extracts_from_snippet() {
		Connection::save_widget_key( '<script async src="https://widget.easeaccess24.com/sdk.js?key=XYZ789"></script>' );

		$this->assertSame( 'XYZ789', Connection::get_widget_key() );
	}

	/**
	 * A partially stored array is back-filled with defaults on read.
	 */
	public function test_get_backfills_partial_stored_data() {
		update_option( Connection::OPTION, array( 'widget_key' => 'ONLYKEY' ) );

		$connection = Connection::get();

		$this->assertSame( 'ONLYKEY', $connection['widget_key'] );
		$this->assertSame( 'unknown', $connection['backend_status'] );
		$this->assertArrayHasKey( 'last_health_check', $connection );
	}

	/**
	 * update() merges fields without dropping the others and ignores unknowns.
	 */
	public function test_update_merges_and_ignores_unknown_fields() {
		Connection::save_widget_key( 'KEEPME' );

		$connection = Connection::update(
			array(
				'backend_status' => 'OK',
				'bogus_field'    => 'nope',
			)
		);

		$this->assertSame( 'KEEPME', $connection['widget_key'] );
		$this->assertSame( 'OK', $connection['backend_status'] );
		$this->assertArrayNotHasKey( 'bogus_field', $connection );
	}
}
