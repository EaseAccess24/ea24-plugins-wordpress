/**
 * Playwright global setup.
 *
 * Logs in as the wp-env administrator, saves the authenticated storage state so
 * every spec starts logged in, and ensures the plugin is active. WP_BASE_URL is
 * already pinned by playwright.config.js so login and REST target the same site.
 *
 * A hard timeout wraps the whole thing: if the environment is misconfigured
 * (wp-env down, or a site/nonce mismatch), this fails fast and loud instead of
 * hanging silently in the REST setup retry loop.
 */
const path = require( 'path' );
const { RequestUtils } = require( '@wordpress/e2e-test-utils-playwright' );

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8888';
const STORAGE_STATE = path.join( __dirname, '.auth', 'admin.json' );

// Full plugin path (folder/file, no .php). Activate by PATH via REST rather than
// requestUtils.activatePlugin(slug): that helper derives the slug from the plugin
// NAME via paramCase ("EaseAccess24 Accessibility" -> "easeaccess-24-accessibility"),
// which does not match our folder slug and would throw.
const PLUGIN_PATH = 'easeaccess24-accessibility/easeaccess24-accessibility';

module.exports = async function globalSetup() {
	const run = ( async () => {
		const requestUtils = await RequestUtils.setup( {
			baseURL: BASE_URL,
			storageStatePath: STORAGE_STATE,
		} );

		await requestUtils.rest( {
			method: 'PUT',
			path: `/wp/v2/plugins/${ PLUGIN_PATH }`,
			data: { status: 'active' },
		} );
	} )();

	let timer;
	const guard = new Promise( ( _, reject ) => {
		timer = setTimeout(
			() =>
				reject(
					new Error(
						`e2e global setup timed out after 45s. Is wp-env running, and is WP_BASE_URL (${ BASE_URL }) correct and consistent with the REST root?`
					)
				),
			45_000
		);
	} );

	try {
		await Promise.race( [ run, guard ] );
	} finally {
		clearTimeout( timer );
	}
};
