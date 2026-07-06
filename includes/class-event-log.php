<?php
/**
 * Local event log.
 *
 * Records a small, capped history of health and lifecycle events in a single
 * non-autoloaded option. The log stays on the site: it is NEVER transmitted
 * automatically, uses no browser storage, and is only read back into the admin
 * UI or included in a user-initiated Support Report.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reads and writes the capped local event log.
 *
 * Passive static store — registers no hooks. Other modules (REST controller,
 * Connection, Activator/Deactivator) call its static methods. A capped option
 * (rather than a custom table) is deliberate: last-N events need no schema,
 * migration, or dbDelta, drop cleanly on uninstall, and are trivial to embed in
 * a Support Report.
 */
class EventLog {

	/**
	 * Option name for the stored event array.
	 */
	const OPTION = 'easeaccess24_event_log';

	/**
	 * Maximum number of events retained. Oldest are dropped first (FIFO).
	 */
	const CAP = 50;

	/**
	 * Allowlisted event types. Anything else is ignored so callers cannot store
	 * arbitrary payloads.
	 *
	 * @return string[]
	 */
	public static function types() {
		return array(
			'health_check', // Carries a reason code from the diagnostics catalog.
			'key_saved',    // A Widget Key was stored for the first time.
			'key_updated',  // An existing Widget Key was replaced.
			'activated',    // Plugin activated.
			'deactivated',  // Plugin deactivated.
		);
	}

	/**
	 * Append an event, then trim to the cap.
	 *
	 * Only the type and an optional reason code are stored — no free-form data,
	 * no personal data. The timestamp is the server clock (never a client clock).
	 *
	 * @param string $type One of self::types().
	 * @param string $code Optional reason code (used by 'health_check').
	 * @return void
	 */
	public static function record( $type, $code = '' ) {
		$type = (string) $type;

		if ( ! in_array( $type, self::types(), true ) ) {
			return;
		}

		$log = self::get();

		$event = array(
			'ts'   => time(),
			'type' => $type,
		);

		$code = sanitize_text_field( (string) $code );
		if ( '' !== $code ) {
			$event['code'] = $code;
		}

		// Newest first; trim the tail so the option stays small.
		array_unshift( $log, $event );
		$log = array_slice( $log, 0, self::CAP );

		// autoload = no: the log must not load on every front-end request.
		update_option( self::OPTION, $log, false );
	}

	/**
	 * Return stored events, newest first.
	 *
	 * @param int $limit Maximum number of events to return.
	 * @return array<int,array<string,mixed>>
	 */
	public static function get( $limit = self::CAP ) {
		$stored = get_option( self::OPTION, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		$limit = (int) $limit;
		if ( $limit > 0 && count( $stored ) > $limit ) {
			$stored = array_slice( $stored, 0, $limit );
		}

		return $stored;
	}

	/**
	 * Remove all stored events.
	 *
	 * @return void
	 */
	public static function clear() {
		delete_option( self::OPTION );
	}
}
