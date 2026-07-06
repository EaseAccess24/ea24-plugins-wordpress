<?php
/**
 * Connection store.
 *
 * Persists the Widget Key and connection state in a single Options-API row.
 * The plugin validates nothing: this class stores and returns values, it never
 * calls the platform or checks a key/domain/subscription.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reads and writes the plugin's connection state.
 *
 * Passive store — registers no hooks. Other modules (SDK loader, REST
 * controller) call its static methods. State lives in one option holding an
 * associative array so future fields (Organization ID, Website ID, Widget ID,
 * Connection Token) can be added without a schema migration.
 */
class Connection {

	/**
	 * Option name for the stored connection array.
	 */
	const OPTION = 'easeaccess24_connection';

	/**
	 * Character allowlist for a Widget Key, as a regex character-class body.
	 *
	 * This is the SINGLE source of truth for the accepted key alphabet. The set
	 * is deliberately conservative and URL-query-safe (alphanumerics plus
	 * `. _ ~ : -`) because the platform's real key alphabet is not yet finalized.
	 * CHANGE ONLY THIS CONSTANT once the platform confirms the real charset.
	 *
	 * NOTE: `-` must stay LAST so it is treated as a literal inside `[...]`.
	 */
	const KEY_ALLOWED_CHARS = 'A-Za-z0-9._~:-';

	/**
	 * Default connection shape. MVP fields only; future fields append here.
	 *
	 * @return array<string,mixed>
	 */
	public static function defaults() {
		return array(
			'widget_key'        => '',        // Public identifier, not a secret.
			'resolved_domain'   => '',        // Informational display value; reserved.
			'backend_status'    => 'unknown', // Reason-code space; never validated in MVP.
			'last_health_check' => null,      // Unix timestamp; set by a later phase.
		);
	}

	/**
	 * Return the full connection array, always fully shaped.
	 *
	 * Old or partially stored data is back-filled with defaults, so callers can
	 * rely on every key being present.
	 *
	 * @return array<string,mixed>
	 */
	public static function get() {
		$stored = get_option( self::OPTION, array() );

		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return wp_parse_args( $stored, self::defaults() );
	}

	/**
	 * Convenience accessor for the stored Widget Key.
	 *
	 * @return string
	 */
	public static function get_widget_key() {
		$connection = self::get();

		return (string) $connection['widget_key'];
	}

	/**
	 * Extract a Widget Key from user input.
	 *
	 * Accepts EITHER a raw key (e.g. "ABC123") OR a full pasted script snippet
	 * such as:
	 *
	 *   <script async src="https://widget.easeaccess24.com/sdk.js?key=ABC123"></script>
	 *
	 * The extraction is non-obvious, so the steps are spelled out:
	 *
	 *   1. Trim, then decode HTML entities — a snippet copied from a page may
	 *      arrive with "&amp;" separating query parameters.
	 *   2. If a "key=" query parameter is present, capture its value up to the
	 *      first quote, ampersand, whitespace or ">" character. This tolerates
	 *      extra params ("?key=ABC&foo=bar") and both quote styles.
	 *   3. Otherwise, if the input still looks like markup ("<") we could not
	 *      find a key in — treat it as a malformed snippet and return "".
	 *   4. Otherwise treat the whole trimmed string as a raw key.
	 *
	 * The result is passed through an allowlist sanitizer (see sanitize_key_value)
	 * so only URL-query-safe characters survive. The injected URL is additionally
	 * escaped at output time, making this defense-in-depth rather than the sole
	 * guard.
	 *
	 * @param string $raw Raw key or pasted snippet.
	 * @return string Extracted, sanitized key (empty string if none found).
	 */
	public static function extract_widget_key( $raw ) {
		$decoded = html_entity_decode( trim( (string) $raw ), ENT_QUOTES );

		if ( '' === $decoded ) {
			return '';
		}

		// Step 2: pull the value of a "key=" query parameter if present.
		if ( preg_match( '/[?&]key=([^"\'&\s>]+)/', $decoded, $matches ) ) {
			return self::sanitize_key_value( $matches[1] );
		}

		// Step 3: markup with no extractable key is not a usable raw key.
		if ( false !== strpos( $decoded, '<' ) ) {
			return '';
		}

		// Step 4: plain raw key.
		return self::sanitize_key_value( $decoded );
	}

	/**
	 * Persist a Widget Key extracted from raw input.
	 *
	 * @param string $raw Raw key or pasted snippet.
	 * @return string The stored (extracted) key.
	 */
	public static function save_widget_key( $raw ) {
		$key = self::extract_widget_key( $raw );

		// Distinguish a first-time save from replacing an existing key, for the
		// local event log. Only log when a usable key was actually extracted.
		$had_key = '' !== self::get_widget_key();

		self::update(
			array(
				'widget_key'      => $key,
				// Informational only: records which host the key was saved on.
				// This is a display convenience, NOT a validation of the domain.
				'resolved_domain' => (string) wp_parse_url( home_url(), PHP_URL_HOST ),
			)
		);

		if ( '' !== $key ) {
			EventLog::record( $had_key ? 'key_updated' : 'key_saved' );
		}

		return $key;
	}

	/**
	 * Merge and persist connection fields, sanitizing each.
	 *
	 * Unknown keys are ignored so callers cannot smuggle arbitrary data into the
	 * option. Existing fields not present in $fields are preserved.
	 *
	 * @param array<string,mixed> $fields Partial connection fields to update.
	 * @return array<string,mixed> The full stored connection after the update.
	 */
	public static function update( array $fields ) {
		$connection = self::get();

		foreach ( $fields as $field => $value ) {
			if ( ! array_key_exists( $field, $connection ) ) {
				continue;
			}

			switch ( $field ) {
				case 'widget_key':
					$connection[ $field ] = self::sanitize_key_value( $value );
					break;
				case 'last_health_check':
					$connection[ $field ] = ( null === $value ) ? null : (int) $value;
					break;
				default:
					$connection[ $field ] = sanitize_text_field( (string) $value );
					break;
			}
		}

		update_option( self::OPTION, $connection );

		return $connection;
	}

	/**
	 * Allowlist sanitizer for a Widget Key value.
	 *
	 * Keeps only the characters in {@see self::KEY_ALLOWED_CHARS}, so the accepted
	 * key alphabet lives in exactly one place. The injected URL is additionally
	 * escaped at output time, making this defense-in-depth rather than the sole
	 * guard.
	 *
	 * @param string $value Candidate key value.
	 * @return string Sanitized key value.
	 */
	private static function sanitize_key_value( $value ) {
		$value = preg_replace( '/[^' . self::KEY_ALLOWED_CHARS . ']/', '', (string) $value );

		return sanitize_text_field( $value );
	}
}
