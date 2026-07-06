/**
 * E2E: connecting a site.
 *
 * Covers what the plugin actually controls: saving a Widget Key (raw, or
 * extracted from a full script snippet) and injecting exactly one async SDK
 * <script> into the front-end <head> with the correct URL.
 *
 * TESTING LIMITATION: on an unauthorized localhost domain the real widget never
 * renders, so "the widget works" cannot be verified here — only injection. See
 * e2e/README.md.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ADMIN_QUERY = 'page=easeaccess24-accessibility';

test.describe( 'Connection', () => {
	// Start each test in English (this spec asserts English UI strings; the
	// stored language otherwise persists across tests/runs) and disconnected, so
	// the paste-and-save flow runs from scratch.
	test.beforeEach( async ( { requestUtils, admin, page } ) => {
		await requestUtils.rest( {
			path: '/easeaccess24/v1/settings',
			method: 'POST',
			data: { language: 'en' },
		} );
		await requestUtils.rest( {
			path: '/easeaccess24/v1/connection',
			method: 'POST',
			data: { key: '' },
		} );
		// Neutralize the real external SDK so front-end navigation never waits on
		// (or hangs against, in CI where the domain is firewalled)
		// widget.easeaccess24.com.
		await page.route( /widget\.easeaccess24\.com\/sdk\.js/, ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'application/javascript',
				body: '',
			} )
		);
		await admin.visitAdminPage( 'admin.php', ADMIN_QUERY );
	} );

	test( 'saves a raw key and injects one async SDK tag in <head>', async ( {
		page,
	} ) => {
		await page.fill( '#ea24-widget-key', 'RAWKEY123' );
		await page.getByRole( 'button', { name: 'Connect & Verify' } ).click();

		// Saving lands on the connected Dashboard.
		await expect(
			page.getByRole( 'button', { name: 'Run Health Check' } )
		).toBeVisible();

		await page.goto( '/' );

		const sdk = page.locator( '#easeaccess24-sdk' );
		await expect( sdk ).toHaveCount( 1 );
		await expect( sdk ).toHaveAttribute(
			'src',
			/\/sdk\.js\?key=RAWKEY123$/
		);
		expect( await sdk.evaluate( ( n ) => n.hasAttribute( 'async' ) ) ).toBe(
			true
		);
		expect( await sdk.evaluate( ( n ) => n.parentElement.tagName ) ).toBe(
			'HEAD'
		);
	} );

	test( 'extracts the key from a full script snippet', async ( { page } ) => {
		const snippet =
			'<script async src="https://widget.easeaccess24.com/sdk.js?key=SNIP456"></script>';

		await page.fill( '#ea24-widget-key', snippet );
		await page.getByRole( 'button', { name: 'Connect & Verify' } ).click();

		await expect(
			page.getByRole( 'button', { name: 'Run Health Check' } )
		).toBeVisible();

		// The injected tag carries only the extracted key, proving extraction.
		await page.goto( '/' );
		await expect( page.locator( '#easeaccess24-sdk' ) ).toHaveAttribute(
			'src',
			/\/sdk\.js\?key=SNIP456$/
		);
	} );
} );
