/**
 * Diagnostics mapper — the honest core of the Health Check.
 *
 * Pure function: turns browser observations + environment context into a primary
 * reason code, advisories, and a transparency checklist. It contains NO copy
 * (that lives in i18n) and performs NO I/O, so it is fully unit-testable.
 *
 * The guiding rule (see the SDK behavior): the widget button is injected even on
 * a disallowed domain / wrong key, but stays hidden and inactive. So the PRIMARY
 * success signal is rendered-AND-VISIBLE (`widgetVisible` + visible `widgetCount`),
 * never mere DOM presence. We NEVER report OK just because the element exists.
 */
import { REASON, statusForCode } from './reasonCodes';

/**
 * Derive the primary reason code from observations + context.
 *
 * @param {Object} o Observations.
 * @param {Object} c Context.
 * @return {string} A reason code.
 */
function derivePrimary( o, c ) {
	// Success requires a VISIBLE widget, not mere presence.
	if ( o.widgetVisible && o.widgetCount === 1 ) {
		return REASON.OK;
	}
	if ( o.widgetVisible && o.widgetCount > 1 ) {
		return REASON.DUPLICATE_WIDGET;
	}

	// Not visible: injected-but-hidden (disallowed domain / wrong key) OR absent.
	// Both mean "the widget did not load"; explain as specifically as observation
	// honestly allows, else stay generic.
	if ( o.sdkReachable === false ) {
		return REASON.SDK_UNREACHABLE;
	}
	if ( o.consoleSignalMatched ) {
		// Single SDK signal covers wrong-key AND disallowed-domain.
		return REASON.DOMAIN_NOT_ALLOWED;
	}
	if ( c.isLocalhost ) {
		return REASON.LOCALHOST_DETECTED;
	}
	if ( c.isStaging ) {
		return REASON.STAGING_DETECTED;
	}
	if ( c.keyPresent && ! o.sdkTagPresent ) {
		// Tag stripped despite a saved key → browser-observed interference.
		return REASON.OPTIMIZER_INTERFERENCE;
	}

	// Injected-but-hidden with no readable reason, or plain no-show.
	return REASON.WIDGET_NOT_INITIALIZED;
}

/**
 * Build the always-visible transparency checklist.
 *
 * @param {Object} o Observations.
 * @param {Object} c Context.
 * @return {Array<{key: string, status: string}>} Checklist rows.
 */
function buildChecklist( o, c ) {
	let reachable = 'na';
	if ( o.sdkReachable === true ) {
		reachable = 'pass';
	} else if ( o.sdkReachable === false ) {
		reachable = 'fail';
	}

	let singleInstance = 'na';
	if ( o.widgetCount > 1 ) {
		singleInstance = 'fail';
	} else if ( o.widgetVisible ) {
		singleInstance = 'pass';
	}

	return [
		{ key: 'keySaved', status: c.keyPresent ? 'pass' : 'fail' },
		{ key: 'sdkTag', status: o.sdkTagPresent ? 'pass' : 'fail' },
		{ key: 'sdkReachable', status: reachable },
		// PRIMARY signal: rendered AND visible.
		{ key: 'widgetVisible', status: o.widgetVisible ? 'pass' : 'fail' },
		{ key: 'singleInstance', status: singleInstance },
	];
}

/**
 * Derive the full diagnostics result.
 *
 * @param {Object}       observations                      Browser observations.
 * @param {boolean}      observations.sdkTagPresent        SDK <script> present.
 * @param {boolean|null} observations.sdkReachable         SDK URL reachable (null=unknown).
 * @param {boolean}      observations.widgetVisible        ≥1 visible widget button.
 * @param {number}       observations.widgetCount          Visible widget instances.
 * @param {number}       observations.widgetPresentCount   Widget buttons in DOM (any visibility).
 * @param {number}       observations.containerCount       Widget panel iframes present.
 * @param {number}       observations.extraSdkScripts      Non-plugin sdk.js scripts.
 * @param {boolean}      observations.consoleSignalMatched SDK failure signal seen.
 * @param {Object}       context                           Environment context.
 * @param {boolean}      context.keyPresent                A Widget Key is saved.
 * @param {boolean}      context.isLocalhost               Non-authorized local host.
 * @param {boolean}      context.isStaging                 Non-authorized staging host.
 * @return {{primary: Object, advisories: Array, checklist: Array}} Result.
 */
export function derive( observations, context ) {
	const o = observations || {};
	const c = context || {};

	const primaryCode = derivePrimary( o, c );

	const advisories = [];
	const confirmedDuplicate = primaryCode === REASON.DUPLICATE_WIDGET;
	if (
		! confirmedDuplicate &&
		( o.extraSdkScripts >= 1 || o.containerCount > 1 )
	) {
		advisories.push( {
			code: REASON.POSSIBLE_DUPLICATE_WIDGET,
			status: statusForCode( REASON.POSSIBLE_DUPLICATE_WIDGET ),
		} );
	}

	return {
		primary: { code: primaryCode, status: statusForCode( primaryCode ) },
		advisories,
		checklist: buildChecklist( o, c ),
	};
}
