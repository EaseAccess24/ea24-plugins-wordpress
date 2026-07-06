/**
 * Unit tests for the diagnostics mapper.
 *
 * This is where the OK/healthy path is proven — the real widget only renders on
 * an authorized production domain, so it cannot be exercised from the local dev
 * environment. The mapper is pure, so every branch is covered here.
 */
import { derive } from '../../src/health/diagnostics';
import { REASON } from '../../src/health/reasonCodes';

// A fully-passing observation bundle; individual tests override fields.
const base = {
	sdkTagPresent: true,
	sdkReachable: true,
	widgetVisible: true,
	widgetCount: 1,
	widgetPresentCount: 1,
	containerCount: 1,
	extraSdkScripts: 0,
	consoleSignalMatched: false,
};

const prod = { keyPresent: true, isLocalhost: false, isStaging: false };

function primaryCode( obs, ctx = prod ) {
	return derive( obs, ctx ).primary.code;
}

describe( 'derive() primary code', () => {
	it( 'reports OK only when a single visible widget is present', () => {
		expect( primaryCode( { ...base } ) ).toBe( REASON.OK );
	} );

	it( 'does NOT report OK when the button is present but hidden (console signal)', () => {
		const code = primaryCode( {
			...base,
			widgetVisible: false,
			widgetCount: 0,
			widgetPresentCount: 1, // Injected but hidden.
			consoleSignalMatched: true,
		} );
		expect( code ).toBe( REASON.DOMAIN_NOT_ALLOWED );
		expect( code ).not.toBe( REASON.OK );
	} );

	it( 'stays generic for a hidden button with no readable reason', () => {
		expect(
			primaryCode( {
				...base,
				widgetVisible: false,
				widgetCount: 0,
				widgetPresentCount: 1,
				consoleSignalMatched: false,
			} )
		).toBe( REASON.WIDGET_NOT_INITIALIZED );
	} );

	it( 'reports a confirmed duplicate for >1 visible widgets', () => {
		expect(
			primaryCode( { ...base, widgetCount: 2, widgetPresentCount: 2 } )
		).toBe( REASON.DUPLICATE_WIDGET );
	} );

	it( 'reports SDK_UNREACHABLE before anything else when unreachable', () => {
		expect(
			primaryCode( {
				...base,
				widgetVisible: false,
				widgetCount: 0,
				sdkReachable: false,
				consoleSignalMatched: true, // Should be outranked by unreachable.
			} )
		).toBe( REASON.SDK_UNREACHABLE );
	} );

	it( 'reports LOCALHOST_DETECTED (informational) on a local host', () => {
		expect(
			primaryCode(
				{ ...base, widgetVisible: false, widgetCount: 0 },
				{ keyPresent: true, isLocalhost: true, isStaging: false }
			)
		).toBe( REASON.LOCALHOST_DETECTED );
	} );

	it( 'reports STAGING_DETECTED on a staging host', () => {
		expect(
			primaryCode(
				{ ...base, widgetVisible: false, widgetCount: 0 },
				{ keyPresent: true, isLocalhost: false, isStaging: true }
			)
		).toBe( REASON.STAGING_DETECTED );
	} );

	it( 'reports OPTIMIZER_INTERFERENCE when the tag is stripped despite a key', () => {
		expect(
			primaryCode( {
				...base,
				widgetVisible: false,
				widgetCount: 0,
				sdkTagPresent: false,
			} )
		).toBe( REASON.OPTIMIZER_INTERFERENCE );
	} );

	it( 'never surfaces catalog-only codes from observation', () => {
		const unsurfaceable = [
			REASON.KEY_INVALID,
			REASON.SUBSCRIPTION_EXPIRED,
			REASON.ORG_DISABLED,
		];
		// Sweep a spread of plausible observations; none should yield these.
		const variants = [
			{ ...base },
			{ ...base, widgetVisible: false, widgetCount: 0 },
			{
				...base,
				widgetVisible: false,
				widgetCount: 0,
				sdkReachable: false,
			},
			{
				...base,
				widgetVisible: false,
				widgetCount: 0,
				consoleSignalMatched: true,
			},
			{
				...base,
				widgetVisible: false,
				widgetCount: 0,
				sdkTagPresent: false,
			},
		];
		variants.forEach( ( obs ) => {
			expect( unsurfaceable ).not.toContain( primaryCode( obs ) );
		} );
	} );
} );

describe( 'derive() advisories', () => {
	it( 'adds a possible-duplicate advisory for an extra sdk script', () => {
		const result = derive( { ...base, extraSdkScripts: 1 }, prod );
		expect( result.advisories.map( ( a ) => a.code ) ).toContain(
			REASON.POSSIBLE_DUPLICATE_WIDGET
		);
	} );

	it( 'adds a possible-duplicate advisory for extra containers', () => {
		const result = derive( { ...base, containerCount: 2 }, prod );
		expect( result.advisories.map( ( a ) => a.code ) ).toContain(
			REASON.POSSIBLE_DUPLICATE_WIDGET
		);
	} );

	it( 'does not double-report when a duplicate is already confirmed', () => {
		const result = derive(
			{ ...base, widgetCount: 2, containerCount: 2, extraSdkScripts: 1 },
			prod
		);
		expect( result.primary.code ).toBe( REASON.DUPLICATE_WIDGET );
		expect( result.advisories.map( ( a ) => a.code ) ).not.toContain(
			REASON.POSSIBLE_DUPLICATE_WIDGET
		);
	} );

	it( 'has no advisories on a clean OK result', () => {
		expect( derive( { ...base }, prod ).advisories ).toHaveLength( 0 );
	} );
} );

describe( 'derive() checklist', () => {
	it( 'marks the visible-widget row failed when hidden', () => {
		const { checklist } = derive(
			{ ...base, widgetVisible: false, widgetCount: 0 },
			prod
		);
		const row = checklist.find( ( r ) => r.key === 'widgetVisible' );
		expect( row.status ).toBe( 'fail' );
	} );

	it( 'marks reachability n/a when unknown (no URL)', () => {
		const { checklist } = derive( { ...base, sdkReachable: null }, prod );
		const row = checklist.find( ( r ) => r.key === 'sdkReachable' );
		expect( row.status ).toBe( 'na' );
	} );

	it( 'fails single-instance when more than one visible widget', () => {
		const { checklist } = derive(
			{ ...base, widgetCount: 2, widgetPresentCount: 2 },
			prod
		);
		const row = checklist.find( ( r ) => r.key === 'singleInstance' );
		expect( row.status ).toBe( 'fail' );
	} );
} );
