<?php
/**
 * App settings store + lifecycle migration.
 *
 * Holds the per-site preferences that are NOT part of the connection: the UI
 * language and the "remove all data on uninstall" flag. It also owns the stored
 * plugin version and the version-gated upgrade routine.
 *
 * Kept separate from Connection on purpose: these are UI/site preferences, and
 * Connection::update() deliberately drops unknown keys. Uninstall cannot use
 * this class (no autoloader runs during uninstall), so uninstall.php repeats the
 * option names as literals — keep them in sync.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Reads/writes plugin preferences, exposes shipped translations to the app, and
 * runs the version-gated migration.
 */
class Settings {

	/**
	 * Option: active UI language code (e.g. 'en', 'sv').
	 */
	const OPTION_LANGUAGE = 'easeaccess24_language';

	/**
	 * Option: opt-in flag to delete all plugin data on uninstall.
	 */
	const OPTION_REMOVE_DATA = 'easeaccess24_remove_data_on_uninstall';

	/**
	 * Option: last plugin version seen, for the migration gate.
	 */
	const OPTION_VERSION = 'easeaccess24_version';

	/**
	 * Shared language manifest filename (in /languages). This is the single
	 * source of truth for the supported languages: their codes (the allowlist),
	 * display names (the dropdown), and text direction (LTR/RTL). The React app
	 * imports the same file. Add a language by adding an entry here; ship its
	 * languages/<code>.json whenever the translation is ready — a missing file is
	 * handled gracefully (the language falls back to English at runtime).
	 */
	const MANIFEST_FILE = 'languages-manifest.json';

	/**
	 * Hard default when no per-site choice and no matching locale.
	 */
	const DEFAULT_LANGUAGE = 'en';

	/**
	 * Cached, normalized manifest for this request.
	 *
	 * @var array<int,array<string,string>>|null
	 */
	private static $manifest = null;

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		// Version-gated migration. admin_init is the robust catch-all: it fires
		// after core auto-updates and manual/FTP deploys, which the activation
		// and upgrader hooks miss. One autoloaded option read per admin request
		// is negligible.
		add_action( 'admin_init', array( __CLASS__, 'maybe_upgrade' ) );
	}

	/**
	 * The supported-language manifest: a list of { code, label, dir } entries,
	 * read once per request from the shared JSON file. English is guaranteed to
	 * be present even if the file is missing or corrupt.
	 *
	 * @return array<int,array<string,string>>
	 */
	public static function manifest() {
		if ( null !== self::$manifest ) {
			return self::$manifest;
		}

		$list = array();
		$path = EASEACCESS24_PATH . 'languages/' . self::MANIFEST_FILE;

		if ( file_exists( $path ) && is_readable( $path ) ) {
			// Reading a bundled plugin file, not a remote resource.
			$raw = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

			$decoded = ( false === $raw ) ? null : json_decode( $raw, true );

			if ( is_array( $decoded ) ) {
				foreach ( $decoded as $entry ) {
					if ( is_array( $entry ) && ! empty( $entry['code'] ) ) {
						$list[] = array(
							'code'  => (string) $entry['code'],
							'label' => isset( $entry['label'] ) ? (string) $entry['label'] : (string) $entry['code'],
							'dir'   => ( isset( $entry['dir'] ) && 'rtl' === $entry['dir'] ) ? 'rtl' : 'ltr',
						);
					}
				}
			}
		}

		if ( ! in_array( 'en', array_column( $list, 'code' ), true ) ) {
			array_unshift(
				$list,
				array(
					'code'  => 'en',
					'label' => 'English',
					'dir'   => 'ltr',
				)
			);
		}

		self::$manifest = $list;

		return self::$manifest;
	}

	/**
	 * All supported language codes (the allowlist).
	 *
	 * @return string[]
	 */
	public static function language_codes() {
		return array_column( self::manifest(), 'code' );
	}

	/**
	 * Whether a code is a supported language.
	 *
	 * @param string $code Candidate language code.
	 * @return bool
	 */
	public static function is_supported( $code ) {
		return in_array( $code, self::language_codes(), true );
	}

	/**
	 * Text direction ('ltr'|'rtl') for a language code; 'ltr' if unknown.
	 *
	 * @param string $code Language code.
	 * @return string
	 */
	public static function language_dir( $code ) {
		foreach ( self::manifest() as $entry ) {
			if ( $entry['code'] === $code ) {
				return $entry['dir'];
			}
		}

		return 'ltr';
	}

	/**
	 * Whether the active UI language is right-to-left. Used to pick the RTL
	 * stylesheet so layout is not broken for RTL languages.
	 *
	 * @return bool
	 */
	public static function is_rtl() {
		return 'rtl' === self::language_dir( self::get_language() );
	}

	/**
	 * First-run default: use the site locale's language when it is supported AND
	 * its translation file actually ships (so we never default to a language the
	 * UI can only render in English); otherwise English. An explicit dropdown
	 * choice always overrides this.
	 *
	 * @return string
	 */
	public static function default_language() {
		$locale = function_exists( 'get_user_locale' ) ? (string) get_user_locale() : 'en_US';
		$prefix = strtolower( substr( $locale, 0, 2 ) );

		if ( 'en' !== $prefix && self::is_supported( $prefix ) && self::has_translation_file( $prefix ) ) {
			return $prefix;
		}

		return self::DEFAULT_LANGUAGE;
	}

	/**
	 * The active UI language, validated against the allowlist.
	 *
	 * @return string
	 */
	public static function get_language() {
		$stored = get_option( self::OPTION_LANGUAGE, '' );
		$stored = is_string( $stored ) ? $stored : '';

		if ( self::is_supported( $stored ) ) {
			return $stored;
		}

		return self::default_language();
	}

	/**
	 * Persist the UI language. Rejects codes outside the allowlist.
	 *
	 * @param string $lng Candidate language code.
	 * @return bool True if stored, false if rejected.
	 */
	public static function set_language( $lng ) {
		$lng = is_string( $lng ) ? $lng : '';

		if ( ! self::is_supported( $lng ) ) {
			return false;
		}

		update_option( self::OPTION_LANGUAGE, $lng );

		return true;
	}

	/**
	 * Whether the user opted into removing all data on uninstall.
	 *
	 * @return bool
	 */
	public static function get_remove_data() {
		return (bool) get_option( self::OPTION_REMOVE_DATA, false );
	}

	/**
	 * Persist the remove-data-on-uninstall flag.
	 *
	 * @param bool $flag Whether to remove data on uninstall.
	 */
	public static function set_remove_data( $flag ) {
		update_option( self::OPTION_REMOVE_DATA, $flag ? 1 : 0 );
	}

	/**
	 * Read every shipped launch-language JSON so PHP can expose it to the React
	 * app (see Admin::enqueue_assets). Files live in /languages and are the same
	 * flat-key source the external translator pipeline consumes.
	 *
	 * @return array<string,array<string,string>> Map of language code => strings.
	 */
	public static function translations() {
		$out = array();

		foreach ( self::language_codes() as $code ) {
			$data = self::read_language_file( $code );

			// Missing/unreadable files are skipped silently — the language falls
			// back to English at runtime (i18next fallbackLng). Only present files
			// are exposed, so the JS bundle/page never ships absent languages.
			if ( null !== $data ) {
				$out[ $code ] = $data;
			}
		}

		return $out;
	}

	/**
	 * Whether a language's translation JSON is present on disk.
	 *
	 * @param string $code Language code.
	 * @return bool
	 */
	private static function has_translation_file( $code ) {
		return file_exists( EASEACCESS24_PATH . 'languages/' . $code . '.json' );
	}

	/**
	 * Read and decode one languages/<code>.json file.
	 *
	 * Keys beginning with "_" (e.g. the "_meta" first-pass marker in sv.json) are
	 * stripped — they are file annotations, not translatable strings.
	 *
	 * @param string $code Language code from the LANGUAGES allowlist.
	 * @return array<string,string>|null Decoded strings, or null if unreadable.
	 */
	private static function read_language_file( $code ) {
		// $code is only ever a value from language_codes() (the manifest), so this
		// path is not user-controlled.
		$path = EASEACCESS24_PATH . 'languages/' . $code . '.json';

		if ( ! file_exists( $path ) || ! is_readable( $path ) ) {
			return null;
		}

		// Reading a bundled plugin file, not a remote resource.
		$raw = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ( false === $raw ) {
			return null;
		}

		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			return null;
		}

		foreach ( array_keys( $data ) as $key ) {
			if ( is_string( $key ) && 0 === strpos( $key, '_' ) ) {
				unset( $data[ $key ] );
			}
		}

		return $data;
	}

	/**
	 * Version-gated, one-time migration. Preserves the Widget Key and all
	 * connection/settings; it only stamps the version and back-fills new option
	 * defaults. Runs once per version change.
	 */
	public static function maybe_upgrade() {
		$stored = (string) get_option( self::OPTION_VERSION, '' );

		if ( EASEACCESS24_VERSION === $stored ) {
			return;
		}

		// Back-fill the language default without overwriting an explicit choice.
		if ( false === get_option( self::OPTION_LANGUAGE, false ) ) {
			add_option( self::OPTION_LANGUAGE, self::default_language() );
		}

		// Future data transforms keyed off the previous $stored version go here.
		// The connection array (Widget Key, settings) is intentionally untouched.

		update_option( self::OPTION_VERSION, EASEACCESS24_VERSION );
	}
}
