<?php
/**
 * Support Report generator.
 *
 * Assembles a diagnostic report the user can copy or download and share with
 * support. Nothing is transmitted: the MVP has no endpoint, so "send" produces a
 * copyable/downloadable report only. Redaction is applied here, in generate(), so
 * the structured data and the plaintext rendering are the exact bytes the user
 * previews — there are no hidden fields and nothing is auto-collected beyond what
 * this method assembles.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Builds the (already redacted) Support Report.
 *
 * Passive static helper — registers no hooks. The REST controller calls
 * generate() + to_text() and returns both to the admin app.
 */
class SupportReport {

	/**
	 * Number of trailing characters of the Widget Key left visible when masked.
	 * Mirrors the admin app's MaskedKey component for consistency.
	 */
	const VISIBLE_KEY_CHARS = 4;

	/**
	 * Assemble the report as a structured array.
	 *
	 * Every value here is safe to show and to share: the Widget Key is masked and
	 * no personal data is collected. This same array is what the JSON download
	 * serializes and what to_text() renders, guaranteeing preview/download parity.
	 *
	 * @return array<string,mixed>
	 */
	public static function generate() {
		$connection = Connection::get();
		$theme      = wp_get_theme();
		$env_flags  = Admin::environment_flags();

		return array(
			'generated_at'  => time(),
			'plugin'        => array(
				'version' => EASEACCESS24_VERSION,
			),
			'environment'   => array(
				'wordpress'    => get_bloginfo( 'version' ),
				'php'          => PHP_VERSION,
				'theme'        => $theme instanceof \WP_Theme ? $theme->get( 'Name' ) . ' ' . $theme->get( 'Version' ) : '',
				'locale'       => get_user_locale(),
				'site_host'    => (string) wp_parse_url( home_url(), PHP_URL_HOST ),
				'is_localhost' => (bool) $env_flags['isLocalhost'],
				'is_staging'   => (bool) $env_flags['isStaging'],
			),
			'connection'    => array(
				'widget_key'        => self::mask_key( (string) $connection['widget_key'] ),
				'resolved_domain'   => (string) $connection['resolved_domain'],
				'backend_status'    => (string) $connection['backend_status'],
				'last_health_check' => null === $connection['last_health_check'] ? null : (int) $connection['last_health_check'],
			),
			'compatibility' => Compatibility::detect(),
			'events'        => EventLog::get(),
		);
	}

	/**
	 * Render the structured report as human-readable plaintext.
	 *
	 * This is the exact string used for the preview, the clipboard copy, and the
	 * .txt download.
	 *
	 * @param array<string,mixed> $report A report from generate().
	 * @return string
	 */
	public static function to_text( array $report ) {
		$lines = array();

		$lines[] = 'EaseAccess24 Accessibility — Support Report';
		$lines[] = 'Generated: ' . self::format_ts( $report['generated_at'] );
		$lines[] = '';

		$lines[] = '== Plugin ==';
		$lines[] = 'Version: ' . $report['plugin']['version'];
		$lines[] = '';

		$env     = $report['environment'];
		$lines[] = '== Environment ==';
		$lines[] = 'WordPress: ' . $env['wordpress'];
		$lines[] = 'PHP: ' . $env['php'];
		$lines[] = 'Theme: ' . $env['theme'];
		$lines[] = 'Locale: ' . $env['locale'];
		$lines[] = 'Site host: ' . $env['site_host'];
		$lines[] = 'Localhost: ' . self::yn( $env['is_localhost'] );
		$lines[] = 'Staging: ' . self::yn( $env['is_staging'] );
		$lines[] = '';

		$conn    = $report['connection'];
		$lines[] = '== Connection ==';
		$lines[] = 'Widget Key (masked): ' . ( '' === $conn['widget_key'] ? '(none)' : $conn['widget_key'] );
		$lines[] = 'Resolved domain: ' . ( '' === $conn['resolved_domain'] ? '(none)' : $conn['resolved_domain'] );
		$lines[] = 'Last health result: ' . $conn['backend_status'];
		$lines[] = 'Last health check: ' . ( null === $conn['last_health_check'] ? '(never)' : self::format_ts( $conn['last_health_check'] ) );
		$lines[] = '';

		$lines[] = '== Cache / optimizer plugins ==';
		if ( empty( $report['compatibility'] ) ) {
			$lines[] = 'None detected.';
		} else {
			foreach ( $report['compatibility'] as $plugin ) {
				$lines[] = '- ' . $plugin['name'];
			}
		}
		$lines[] = '';

		$lines[] = '== Recent events ==';
		if ( empty( $report['events'] ) ) {
			$lines[] = 'No events logged.';
		} else {
			foreach ( $report['events'] as $event ) {
				$line = self::format_ts( $event['ts'] ) . '  ' . $event['type'];
				if ( isset( $event['code'] ) && '' !== $event['code'] ) {
					$line .= ' (' . $event['code'] . ')';
				}
				$lines[] = $line;
			}
		}

		return implode( "\n", $lines ) . "\n";
	}

	/**
	 * Mask a Widget Key, keeping only the last few characters.
	 *
	 * The key is a public identifier, not a secret, but the report is meant to be
	 * shareable, so we redact it the same way the admin UI does.
	 *
	 * @param string $key Widget Key.
	 * @return string Masked key, or '' when there is none.
	 */
	private static function mask_key( $key ) {
		if ( '' === $key ) {
			return '';
		}

		$length = strlen( $key );
		if ( $length <= self::VISIBLE_KEY_CHARS ) {
			return $key;
		}

		$hidden = str_repeat( '•', max( 4, $length - self::VISIBLE_KEY_CHARS ) );

		return $hidden . substr( $key, -self::VISIBLE_KEY_CHARS );
	}

	/**
	 * Format a unix timestamp using the site's configured timezone/format.
	 *
	 * @param int $ts Unix seconds.
	 * @return string
	 */
	private static function format_ts( $ts ) {
		return wp_date( 'Y-m-d H:i:s', (int) $ts );
	}

	/**
	 * Yes/No rendering for a boolean flag.
	 *
	 * @param bool $value Flag.
	 * @return string
	 */
	private static function yn( $value ) {
		return $value ? 'yes' : 'no';
	}
}
