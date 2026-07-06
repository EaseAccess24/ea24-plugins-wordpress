/**
 * i18n runtime: nested-key resolution.
 *
 * Guards the contract — en.json/sv.json are NESTED trees of dot-free key names
 * (the external translator rejects literal dots), and i18next runs with
 * keySeparator '.' (nsSeparator disabled), so dotted call-site keys (including
 * the dynamic template-literal keys used across the app) resolve by walking the
 * tree, and a missing key returns the key itself. No WordPress global is present
 * in the test env, so the bundled English fallback is used.
 */
import { t, changeLanguage, LANGUAGES, dirFor } from '../../src/i18n';

describe( 'i18n nested-key lookup', () => {
	it( 'resolves a static dotted key against the nested tree', () => {
		expect( t( 'common.cancel' ) ).toBe( 'Cancel' );
	} );

	it( 'resolves a dynamic reason-code key against nested en.json', () => {
		const code = 'DOMAIN_NOT_ALLOWED';
		expect( t( `diagnostics.${ code }.title` ) ).toBe(
			'Domain not allowed / key not authorized'
		);
	} );

	it( 'resolves a deep dynamic key (faq item)', () => {
		const id = 'findKey';
		expect( t( `faq.items.${ id }.q` ) ).toBe(
			'Where do I find my Widget Key?'
		);
	} );

	it( 'returns the key itself when a key is missing', () => {
		expect( t( 'does.not.exist' ) ).toBe( 'does.not.exist' );
	} );
} );

describe( 'i18n launch-language registry', () => {
	it( 'registers all 33 launch languages including the new codes', () => {
		const codes = LANGUAGES.map( ( lang ) => lang.code );
		expect( codes ).toHaveLength( 33 );
		expect( codes ).toContain( 'en' );
		expect( codes ).toContain( 'sv' );
		expect( codes ).toContain( 'mk' );
		expect( codes ).toContain( 'ar' );
	} );

	it( 'reports text direction from the manifest', () => {
		expect( dirFor( 'ar' ) ).toBe( 'rtl' );
		expect( dirFor( 'fa' ) ).toBe( 'rtl' );
		expect( dirFor( 'en' ) ).toBe( 'ltr' );
		expect( dirFor( 'mk' ) ).toBe( 'ltr' );
		expect( dirFor( 'unknown' ) ).toBe( 'ltr' );
	} );

	it( 'falls back to English (never raw keys) for a language with no JSON shipped', async () => {
		// 'de' is registered in the manifest but ships no de.json yet.
		await changeLanguage( 'de' );
		expect( t( 'common.cancel' ) ).toBe( 'Cancel' );
		expect( t( 'diagnostics.OK.title' ) ).toBe( 'Your widget is live' );
		// A truly nonexistent key still returns the key, as before.
		expect( t( 'does.not.exist' ) ).toBe( 'does.not.exist' );
		await changeLanguage( 'en' );
	} );

	it( 'also falls back cleanly for an RTL language with no JSON', async () => {
		await changeLanguage( 'ar' );
		expect( t( 'common.retry' ) ).toBe( 'Retry' );
		await changeLanguage( 'en' );
	} );
} );
