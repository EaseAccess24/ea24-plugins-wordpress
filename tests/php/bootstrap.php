<?php
/**
 * PHPUnit bootstrap for the WordPress integration test suite.
 *
 * Loads the WordPress test library (provided by wp-env / wp-phpunit), then
 * loads this plugin on `muplugins_loaded` so its classes are available to the
 * tests. Run inside wp-env's tests container via `npm run test:php`.
 *
 * @package EaseAccess24\Accessibility
 */

// Polyfills so a single test file runs across PHPUnit versions.
$_polyfills = dirname( __DIR__, 2 ) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';
if ( is_readable( $_polyfills ) ) {
	require_once $_polyfills;
}

/*
 * Locate the WordPress PHPUnit test library.
 *
 * Prefer WP_TESTS_DIR: wp-env installs a fully-configured library there (with a
 * real wp-tests-config.php holding the test DB creds and the WP_TESTS_* domain
 * constants). The composer wp-phpunit package sets WP_PHPUNIT__DIR to its own
 * vendor copy whose bundled config is only a sample, so it is used only as a
 * last resort.
 */
$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir && is_dir( '/wordpress-phpunit' ) ) {
	$_tests_dir = '/wordpress-phpunit';
}

if ( ! $_tests_dir ) {
	$_tests_dir = getenv( 'WP_PHPUNIT__DIR' );
}

if ( ! $_tests_dir ) {
	$_tests_dir = dirname( __DIR__, 2 ) . '/vendor/wp-phpunit/wp-phpunit';
}

$_functions = $_tests_dir . '/includes/functions.php';

if ( ! is_readable( $_functions ) ) {
	echo "Could not find the WordPress test library at {$_tests_dir}.\n"; // phpcs:ignore
	echo "Run the tests inside wp-env: npm run test:php\n"; // phpcs:ignore
	exit( 1 );
}

require_once $_functions;

// Load this plugin as a must-use plugin before WordPress finishes booting.
tests_add_filter(
	'muplugins_loaded',
	function () {
		require dirname( __DIR__, 2 ) . '/easeaccess24-accessibility.php';
	}
);

require $_tests_dir . '/includes/bootstrap.php';

// Shared base test case (not autoloaded — it lives under tests/, not includes/).
require_once __DIR__ . '/class-testcase.php';
