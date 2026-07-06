/**
 * E2E: on-demand Health Check.
 *
 * TESTING LIMITATION (important): the genuine "OK / your widget is live" state
 * CANNOT be verified here. The widget only renders on a domain authorized in
 * EaseAccess24, and localhost is not authorized — so a real healthy result is
 * only confirmable later on a real authorized domain. What we CAN assert is that
 * the Health Check is HONEST on localhost: it reports LOCALHOST_DETECTED and
 * never a faked OK, and it renders the transparency checklist.
 *
 * To make that assertion deterministic we intercept the external SDK request and
 * return an inert 200 no-op. That makes the SDK "reachable" with no console error
 * and no visible widget, so the diagnosis falls through to LOCALHOST_DETECTED
 * (see src/health/diagnostics.js). Without the stub the primary code is
 * network-dependent (SDK_UNREACHABLE / DOMAIN_NOT_ALLOWED) and flaky. The stub
 * neutralizes the external SDK; it does NOT fake a healthy path.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ADMIN_QUERY = 'page=easeaccess24-accessibility';

test.describe( 'Health Check', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		// This spec asserts English diagnostic copy; force English so a language
		// left over from another spec/run can't break the string match.
		await requestUtils.rest( {
			path: '/easeaccess24/v1/settings',
			method: 'POST',
			data: { language: 'en' },
		} );
		await requestUtils.rest( {
			path: '/easeaccess24/v1/connection',
			method: 'POST',
			data: { key: 'E2EHEALTH1' },
		} );
	} );

	test( 'reports the honest localhost result, never a faked OK', async ( {
		admin,
		page,
	} ) => {
		// Neutralize the real external SDK: reachable, inert, no widget.
		await page.route( /widget\.easeaccess24\.com\/sdk\.js/, ( route ) =>
			route.fulfill( {
				status: 200,
				contentType: 'application/javascript',
				body: '/* e2e stub: inert SDK, intentionally renders nothing */',
			} )
		);

		await admin.visitAdminPage( 'admin.php', ADMIN_QUERY );
		await page.getByRole( 'button', { name: 'Run Health Check' } ).click();

		// The honest primary result on localhost.
		await expect(
			page.getByRole( 'heading', { name: 'Local environment detected' } )
		).toBeVisible( { timeout: 20_000 } );

		// NEVER the healthy path — the "widget is live" card must not appear.
		await expect(
			page.getByRole( 'heading', { name: 'Your widget is live' } )
		).toHaveCount( 0 );

		// The transparency checklist renders, including the primary signal row.
		await expect(
			page.getByRole( 'heading', { name: 'What we checked' } )
		).toBeVisible();
		await expect(
			page.getByText( 'Widget appears and is visible' )
		).toBeVisible();
	} );
} );
