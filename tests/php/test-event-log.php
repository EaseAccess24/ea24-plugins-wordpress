<?php
/**
 * Tests for the local event log: record/get/clear, the FIFO cap, type
 * allowlisting, and that the option is not autoloaded.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use WP_UnitTestCase;

/**
 * @covers \EaseAccess24\Accessibility\EventLog
 */
class Test_EventLog extends WP_UnitTestCase {

	/**
	 * Start each test with an empty log.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( EventLog::OPTION );
	}

	/**
	 * A recorded event round-trips, newest first, with a server timestamp.
	 */
	public function test_record_and_get() {
		EventLog::record( 'activated' );
		EventLog::record( 'health_check', 'OK' );

		$events = EventLog::get();

		$this->assertCount( 2, $events );
		// Newest first.
		$this->assertSame( 'health_check', $events[0]['type'] );
		$this->assertSame( 'OK', $events[0]['code'] );
		$this->assertSame( 'activated', $events[1]['type'] );
		$this->assertIsInt( $events[0]['ts'] );
		// No code stored when none is given.
		$this->assertArrayNotHasKey( 'code', $events[1] );
	}

	/**
	 * Unknown event types are ignored (no arbitrary payloads).
	 */
	public function test_unknown_type_is_ignored() {
		EventLog::record( 'not_a_real_type', 'x' );

		$this->assertCount( 0, EventLog::get() );
	}

	/**
	 * The log is capped and drops the oldest events first.
	 */
	public function test_fifo_cap() {
		for ( $i = 0; $i < EventLog::CAP + 10; $i++ ) {
			EventLog::record( 'health_check', 'CODE' . $i );
		}

		$events = EventLog::get();

		$this->assertCount( EventLog::CAP, $events );
		// Newest kept, oldest dropped.
		$this->assertSame( 'CODE' . ( EventLog::CAP + 9 ), $events[0]['code'] );
		$this->assertSame( 'CODE10', $events[ EventLog::CAP - 1 ]['code'] );
	}

	/**
	 * clear() empties the log.
	 */
	public function test_clear() {
		EventLog::record( 'activated' );
		EventLog::clear();

		$this->assertCount( 0, EventLog::get() );
	}

	/**
	 * The option must not be autoloaded — it should not run on every front-end
	 * request.
	 */
	public function test_option_is_not_autoloaded() {
		EventLog::record( 'activated' );

		$autoloaded = wp_load_alloptions();

		$this->assertArrayNotHasKey( EventLog::OPTION, $autoloaded );
	}
}
