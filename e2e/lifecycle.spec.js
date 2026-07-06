/**
 * E2E: lifecycle. Deactivating the plugin must stop SDK injection entirely; a
 * saved key persists in the database (data is only removed on opt-in uninstall),
 * so re-activating restores injection without re-entering the key.
 *
 * Activation is toggled via a REST PUT to the plugin PATH rather than
 * requestUtils.activatePlugin(slug): that helper derives the slug from the plugin
 * name and would not match our folder slug (see e2e/global-setup.js).
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PLUGIN_PATH = 'easeaccess24-accessibility/easeaccess24-accessibility';

function setPluginStatus( requestUtils, status ) {
	return requestUtils.rest( {
		method: 'PUT',
		path: `/wp/v2/plugins/${ PLUGIN_PATH }`,
		data: { status },
	} );
}

test.describe( 'Lifecycle', () => {
	// Always leave the plugin active for the rest of the suite.
	test.afterEach( async ( { requestUtils } ) => {
		await setPluginStatus( requestUtils, 'active' );
	} );

	test( 'deactivating the plugin stops SDK injection', async ( {
		requestUtils,
		page,
	} ) => {
		// Neutralize the real external SDK so front-end navigation never waits on
		// (or hangs against, in CI) widget.easeaccess24.com.
		await page.route( /widget\.easeaccess24\.com\/sdk\.js/, ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'application/javascript',
				body: '',
			} )
		);

		await setPluginStatus( requestUtils, 'active' );
		await requestUtils.rest( {
			path: '/easeaccess24/v1/connection',
			method: 'POST',
			data: { key: 'E2ELIFE1' },
		} );

		// Active + key saved → the SDK tag is injected.
		await page.goto( '/' );
		await expect( page.locator( '#easeaccess24-sdk' ) ).toHaveCount( 1 );

		// Deactivated → no injection at all (wp_head hook is gone).
		await setPluginStatus( requestUtils, 'inactive' );
		await page.goto( '/' );
		await expect( page.locator( '#easeaccess24-sdk' ) ).toHaveCount( 0 );
	} );
} );
