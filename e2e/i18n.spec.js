/**
 * E2E: language switching. Choosing a language from the dropdown re-renders the
 * admin UI instantly (i18next, no page reload) — a rendered string changes from
 * English to Swedish.
 *
 * The language control is a custom accessible combobox/listbox (Phase 10),
 * replacing the native <select>, so this test opens the combobox and clicks the
 * Swedish option by role/name rather than using selectOption. The test's intent
 * is unchanged: EN→SV flips real rendered strings (the onboarding heading and the
 * dropdown's own label) without a reload.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ADMIN_QUERY = 'page=easeaccess24-accessibility';

test.describe( 'Language switching', () => {
	// Start and end in English so the test is deterministic and self-cleaning.
	// Also start disconnected so the onboarding screen (whose title we switch)
	// is what renders — the connected Dashboard has its own header instead.
	test.beforeEach( async ( { requestUtils } ) => {
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
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.rest( {
			path: '/easeaccess24/v1/settings',
			method: 'POST',
			data: { language: 'en' },
		} );
	} );

	test( 'switching to Swedish updates rendered strings without reload', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'admin.php', ADMIN_QUERY );

		// English baseline (the onboarding title, shown while disconnected).
		await expect(
			page.getByRole( 'heading', {
				name: 'Connect your site to EaseAccess24',
			} )
		).toBeVisible();

		// Open the custom combobox and pick Swedish (rows show "endonym (English)").
		await page.locator( '#ea24-language-select' ).click();
		await page.getByRole( 'option', { name: /Svenska/ } ).click();

		// Same heading, now Swedish — no navigation occurred.
		await expect(
			page.getByRole( 'heading', {
				name: 'Anslut din webbplats till EaseAccess24',
			} )
		).toBeVisible();
		// The dropdown's own label is another real string that flips EN→SV.
		await expect( page.locator( '#ea24-language-label' ) ).toHaveText(
			'Språk'
		);
	} );
} );
