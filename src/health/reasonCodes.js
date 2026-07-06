/**
 * Reason-code catalog (shared contract with future platform endpoints).
 *
 * The full catalog is defined here for stability, but MVP derives codes from
 * OBSERVATION only. KEY_INVALID, SUBSCRIPTION_EXPIRED, and ORG_DISABLED have no
 * distinct observable signal in MVP, so `derive()` never selects them — they
 * exist so the vocabulary stays fixed when backend-confirmed diagnostics arrive.
 */
export const REASON = {
	OK: 'OK',
	KEY_INVALID: 'KEY_INVALID',
	DOMAIN_NOT_ALLOWED: 'DOMAIN_NOT_ALLOWED',
	SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
	ORG_DISABLED: 'ORG_DISABLED',
	SDK_UNREACHABLE: 'SDK_UNREACHABLE',
	WIDGET_NOT_INITIALIZED: 'WIDGET_NOT_INITIALIZED',
	DUPLICATE_WIDGET: 'DUPLICATE_WIDGET',
	POSSIBLE_DUPLICATE_WIDGET: 'POSSIBLE_DUPLICATE_WIDGET',
	OPTIMIZER_INTERFERENCE: 'OPTIMIZER_INTERFERENCE',
	STAGING_DETECTED: 'STAGING_DETECTED',
	LOCALHOST_DETECTED: 'LOCALHOST_DETECTED',
};

/**
 * Map a reason code to a status tone used for badges/cards/icons.
 *
 * @param {string} code A reason code.
 * @return {'pass'|'info'|'warn'|'fail'} The tone.
 */
export function statusForCode( code ) {
	switch ( code ) {
		case REASON.OK:
			return 'pass';
		case REASON.LOCALHOST_DETECTED:
		case REASON.STAGING_DETECTED:
			return 'info';
		case REASON.DUPLICATE_WIDGET:
		case REASON.POSSIBLE_DUPLICATE_WIDGET:
		case REASON.OPTIMIZER_INTERFERENCE:
			return 'warn';
		default:
			return 'fail';
	}
}
