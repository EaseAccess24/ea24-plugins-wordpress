<?php
/**
 * Health-check probe loader.
 *
 * The widget only renders on the front end, so the admin app observes it through
 * a hidden same-origin iframe pointed at the site's front page with a nonce'd
 * flag. On that flagged request — and ONLY for a logged-in admin with a valid
 * nonce — this class enqueues the client-side probe in the <head>, before the
 * async SDK, so the probe can install its console capture early.
 *
 * Nothing here validates the key/domain/subscription; the probe only observes
 * the DOM and console and reports back to the admin UI.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueues the front-end health-check probe on demand.
 */
class HealthCheck {

	/**
	 * Nonce action authorizing a health-check request.
	 */
	const NONCE_ACTION = 'easeaccess24_health_check';

	/**
	 * Query var that flags a request as a health check.
	 */
	const QUERY_VAR = 'ea24-health-check';

	/**
	 * Script handle for the probe bundle.
	 */
	const PROBE_HANDLE = 'easeaccess24-probe';

	/**
	 * Default selector for the rendered widget launcher button.
	 *
	 * IMPORTANT: presence of this element is NOT success — on a disallowed domain
	 * or wrong key the SDK still injects it but leaves it hidden/inactive. The
	 * probe therefore checks visibility, not mere presence. Swappable via the
	 * `easeaccess24_widget_selector` filter without a rebuild.
	 */
	const WIDGET_SELECTOR = 'button.ea24-open-widget-btn';

	/**
	 * Selector for the widget panel iframe (a second-instance signal).
	 */
	const CONTAINER_SELECTOR = 'iframe.ea24-widget-container';

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_probe' ) );
	}

	/**
	 * Enqueue the probe in <head> when this is an authorized health-check request.
	 *
	 * Enqueuing here (wp_enqueue_scripts) with in_footer=false prints the probe
	 * via wp_print_head_scripts (wp_head priority 9), before SdkLoader prints the
	 * SDK tag (priority 10). The probe is a classic (non-async) script, so it
	 * executes before the async SDK — early enough to capture the SDK's console
	 * output.
	 */
	public function maybe_enqueue_probe() {
		if ( ! $this->is_health_check_request() ) {
			return;
		}

		$asset_file = EASEACCESS24_PATH . 'build/probe.asset.php';

		$asset = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => EASEACCESS24_VERSION,
			);

		wp_enqueue_script(
			self::PROBE_HANDLE,
			EASEACCESS24_URL . 'build/probe.js',
			$asset['dependencies'],
			$asset['version'],
			false // In <head>, before the SDK.
		);

		$key = Connection::get_widget_key();

		wp_localize_script(
			self::PROBE_HANDLE,
			'easeAccess24Probe',
			array(
				/**
				 * Filter the selector the probe uses to find the widget launcher.
				 *
				 * @param string $selector Default widget button selector.
				 */
				'widgetSelector'    => (string) apply_filters( 'easeaccess24_widget_selector', self::WIDGET_SELECTOR ),
				'containerSelector' => self::CONTAINER_SELECTOR,
				'sdkScriptId'       => SdkLoader::SCRIPT_ID,
				'sdkUrl'            => SdkLoader::url_for( $key ),
				'settleMs'          => 4000,
				'timeoutMs'         => 8000,
				'consoleSignals'    => array( 'Domain NOT allowed. Widget will not load.' ),
				'resultType'        => 'ea24-health-result',
			)
		);
	}

	/**
	 * Whether the current request is an authorized health-check probe request.
	 *
	 * Gated to logged-in admins with a valid nonce so the probe never loads for
	 * ordinary visitors (keeps normal pageviews free of extra work).
	 *
	 * @return bool
	 */
	private function is_health_check_request() {
		if ( is_admin() || ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! isset( $_GET[ self::QUERY_VAR ] ) ) {
			return false;
		}

		$nonce = sanitize_text_field( wp_unslash( $_GET[ self::QUERY_VAR ] ) );

		return (bool) wp_verify_nonce( $nonce, self::NONCE_ACTION );
	}
}
