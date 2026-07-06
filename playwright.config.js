/**
 * Playwright config for the plugin's e2e suite.
 *
 * IMPORTANT — single-site consistency. wp-env runs two sites: development
 * (:8888) and tests (:8889). @wordpress/e2e-test-utils-playwright discovers the
 * REST root from the WP_BASE_URL constant (default :8889) while logging in
 * against the request context's baseURL. If those differ, the two sites have
 * different auth-cookie hashes, the REST nonce is rejected, and setupRest retries
 * forever (a silent hang). So we pin WP_BASE_URL here — BEFORE the utils' config
 * module is ever imported (that happens later, in global-setup/fixtures) — so
 * login, REST-root discovery, and page navigation ALL target :8888.
 *
 * Prerequisites: `npm run build` (the admin bundle must exist) and a running
 * `npx wp-env start`.
 */
process.env.WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8888';

const { defineConfig, devices } = require( '@playwright/test' );
const path = require( 'path' );

const BASE_URL = process.env.WP_BASE_URL;
const STORAGE_STATE = path.join( __dirname, 'e2e', '.auth', 'admin.json' );

module.exports = defineConfig( {
	testDir: path.join( __dirname, 'e2e' ),
	globalSetup: require.resolve( './e2e/global-setup.js' ),
	timeout: 60_000,
	expect: { timeout: 10_000 },
	// The suite mutates shared plugin state (saved key, active language, plugin
	// active/inactive), so run serially for deterministic ordering.
	fullyParallel: false,
	workers: 1,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? [ [ 'github' ], [ 'html', { open: 'never' } ] ]
		: 'list',
	use: {
		baseURL: BASE_URL,
		storageState: STORAGE_STATE,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [ { name: 'chromium', use: { ...devices[ 'Desktop Chrome' ] } } ],
} );
