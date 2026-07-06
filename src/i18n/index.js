/**
 * Translation runtime.
 *
 * The exported `t(key, vars)` delegates to i18next but keeps the exact contract
 * the previous shim had — dot-path keys, `{{var}}` interpolation, and a missing
 * key returning the key itself — so not a single call site changes.
 *
 * Keys are NESTED: `en.json`/`sv.json` are trees of dot-free key names (e.g.
 * `{ "diagnostics": { "DOMAIN_NOT_ALLOWED": { "title": … } } }`), which is what
 * the external translator pipeline consumes (it rejects keys containing literal
 * dots). Call sites still pass dotted keys (`t('diagnostics.OK.title')`), so
 * i18next runs with its default `keySeparator: '.'` to walk the tree, while
 * `nsSeparator` stays disabled (single default namespace, no `:` in any key).
 *
 * Resources come from PHP: `includes/class-admin.php` reads the launch-language
 * JSON and exposes it on `window.easeAccess24Data.translations` (see §3 of the
 * Phase 06 plan). English is ALSO bundled here as a guaranteed fallback so that
 * (a) strings resolve on the very first paint, (b) the app still works when the
 * global is absent (dev/tests), and (c) an untranslated key in another language
 * falls back to English instead of rendering a raw key.
 *
 * Scaling note: for the two launch languages PHP injects both up front, so
 * switching is instant and client-side. When the language count grows, inject
 * only the active language + English and lazy-fetch others — the nested key
 * structure and this runtime stay the same (a documented seam, not built now).
 */
import i18next from 'i18next';
import enFallback from '../../languages/en.json';
import manifest from '../../languages/languages-manifest.json';

/**
 * Languages offered in the dropdown — code, endonym label, and text direction —
 * from the shared manifest that PHP also reads (single source of truth). Every
 * registered language is listed even if its translation JSON has not shipped
 * yet; selecting one just falls back to English at runtime (fallbackLng below).
 * Endonyms are intentionally NOT translated — that is the convention for
 * language pickers.
 *
 * @type {Array<{code:string,label:string,dir:string}>}
 */
export const LANGUAGES = manifest;

/**
 * Text direction for a language code ('ltr' | 'rtl'); 'ltr' if unknown.
 *
 * @param {string} code Language code.
 * @return {string} 'ltr' or 'rtl'.
 */
export function dirFor( code ) {
	const entry = manifest.find( ( lang ) => lang.code === code );
	return entry && entry.dir === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * The bootstrap data localized by PHP. Returns an empty object when absent so
 * the module still initializes (with the bundled English fallback) outside
 * WordPress — e.g. in unit tests.
 *
 * @return {Object} Bootstrap config.
 */
function bootData() {
	return ( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
}

/**
 * Build i18next resources: the bundled English fallback, overlaid with whatever
 * language bundles PHP injected (which win, so a shipped translation update
 * takes effect without a rebuild).
 *
 * @return {Object} i18next `resources` map keyed by language code.
 */
function buildResources() {
	const resources = { en: { translation: enFallback } };
	const { translations } = bootData();

	if ( translations && typeof translations === 'object' ) {
		for ( const [ lng, dict ] of Object.entries( translations ) ) {
			if ( dict && typeof dict === 'object' ) {
				resources[ lng ] = { translation: dict };
			}
		}
	}

	return resources;
}

// Synchronous init: with inline `resources` and `initImmediate: false`, the
// resource store is populated before this call returns, so `t()` yields real
// strings on the first render rather than keys.
i18next.init( {
	resources: buildResources(),
	lng: bootData().language || 'en',
	fallbackLng: 'en',
	ns: [ 'translation' ],
	defaultNS: 'translation',
	// Nested keys: split dotted call-site keys on '.' to walk the tree, but
	// never split on ':' (single default namespace).
	keySeparator: '.',
	nsSeparator: false,
	// React renders values as text, so no HTML escaping (matches the old shim,
	// which did none). A missing key returns the key by default.
	interpolation: { escapeValue: false },
	initImmediate: false,
} );

/**
 * Translate a dotted key (walked into the nested tree), interpolating `{{var}}`
 * placeholders.
 *
 * @param {string} key    Dot-path key.
 * @param {Object} [vars] Optional interpolation values.
 * @return {string} The resolved string, or the key itself if not found.
 */
export function t( key, vars ) {
	return i18next.t( key, vars );
}

/**
 * Switch the active UI language. Components re-render because `App` subscribes
 * to i18next's `languageChanged` event.
 *
 * @param {string} lng Language code (e.g. 'en', 'sv').
 * @return {Promise} Resolves once the language has changed.
 */
export function changeLanguage( lng ) {
	return i18next.changeLanguage( lng );
}

export { i18next };
