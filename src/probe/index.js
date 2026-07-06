/**
 * Health-check probe (front end).
 *
 * Runs ONLY inside the admin's hidden same-origin iframe during an on-demand
 * health check (enqueued in <head> before the async SDK by class-health-check.php).
 * It observes the page and reports a structured result back to the parent via
 * postMessage. It never mutates the DOM and makes no network calls except a
 * best-effort reachability probe of the SDK URL.
 *
 * CRITICAL: the SDK injects the widget button even on a disallowed domain / wrong
 * key, but leaves it hidden and inactive. So the PRIMARY success signal is
 * rendered-AND-VISIBLE, never mere DOM presence — see isVisible() and widgetCount.
 */

const config =
	typeof window !== 'undefined' ? window.easeAccess24Probe : undefined;

// Buffer of console messages that match the SDK's known failure signal(s).
// Installed synchronously at module load — before the async SDK executes — so we
// capture whatever the SDK logs.
const matchedSignals = [];

/**
 * Install a passthrough capture on console.error/warn that records any message
 * matching a configured SDK signal string, then calls the original method.
 *
 * @param {string[]} signals Console signal substrings to match.
 */
function installConsoleCapture( signals ) {
	const patterns = Array.isArray( signals ) ? signals : [];

	[ 'error', 'warn' ].forEach( ( method ) => {
		const original = window.console[ method ];

		window.console[ method ] = function ( ...args ) {
			try {
				const text = args
					.map( ( arg ) =>
						typeof arg === 'string' ? arg : String( arg )
					)
					.join( ' ' );

				if (
					patterns.some(
						( pattern ) => text.indexOf( pattern ) !== -1
					)
				) {
					matchedSignals.push( text );
				}
			} catch ( e ) {
				// Never let capture break the page's own logging.
			}

			if ( typeof original === 'function' ) {
				return original.apply( this, args );
			}
		};
	} );
}

/**
 * A widget button counts only if it is actually visible and active — not merely
 * present in the DOM.
 *
 * @param {Element} el Candidate element.
 * @return {boolean} Whether the element is rendered and visible.
 */
function isVisible( el ) {
	const rect = el.getBoundingClientRect();
	if ( rect.width === 0 || rect.height === 0 ) {
		return false;
	}

	const style = window.getComputedStyle( el );
	if ( style.display === 'none' || style.visibility === 'hidden' ) {
		return false;
	}

	if ( parseFloat( style.opacity ) === 0 ) {
		return false;
	}

	return true;
}

/**
 * Best-effort reachability check of the SDK URL. A no-cors fetch resolves
 * (opaque) when the resource is reachable and rejects on a network failure. HTTP
 * status is not readable cross-origin, so this is intentionally binary.
 *
 * @param {string} url SDK URL.
 * @return {Promise<boolean|null>} true/false, or null when no URL is configured.
 */
async function checkReachable( url ) {
	if ( ! url ) {
		return null;
	}

	try {
		await window.fetch( url, { mode: 'no-cors', cache: 'no-store' } );
		return true;
	} catch ( e ) {
		return false;
	}
}

/**
 * Snapshot the current DOM observations.
 *
 * @return {Object} Partial observation bundle (DOM only).
 */
function observeDom() {
	const buttons = Array.prototype.slice.call(
		document.querySelectorAll( config.widgetSelector )
	);
	const visibleButtons = buttons.filter( isVisible );

	const sdkScripts = Array.prototype.slice.call(
		document.querySelectorAll( 'script[src*="sdk.js"]' )
	);
	const extraSdkScripts = sdkScripts.filter(
		( el ) => el.id !== config.sdkScriptId
	).length;

	return {
		sdkTagPresent: !! document.getElementById( config.sdkScriptId ),
		widgetPresentCount: buttons.length,
		widgetCount: visibleButtons.length, // Visible instances only.
		widgetVisible: visibleButtons.length > 0,
		containerCount: config.containerSelector
			? document.querySelectorAll( config.containerSelector ).length
			: 0,
		extraSdkScripts,
	};
}

/**
 * Poll for a visible widget up to settleMs, resolving early once one appears.
 *
 * @return {Promise<Object>} The final DOM observation snapshot.
 */
function waitForWidget() {
	const settleMs = Number( config.settleMs ) || 4000;
	const stepMs = 200;

	return new Promise( ( resolve ) => {
		const start = Date.now();

		const tick = () => {
			const dom = observeDom();
			const elapsed = Date.now() - start;

			if ( dom.widgetVisible || elapsed >= settleMs ) {
				resolve( dom );
				return;
			}

			window.setTimeout( tick, stepMs );
		};

		tick();
	} );
}

/**
 * Run the probe: observe, then report the result to the parent exactly once.
 */
async function run() {
	installConsoleCapture( config.consoleSignals );

	const [ dom, sdkReachable ] = await Promise.all( [
		waitForWidget(),
		checkReachable( config.sdkUrl ),
	] );

	const observations = {
		...dom,
		sdkReachable,
		consoleSignalMatched: matchedSignals.length > 0,
	};

	// Parent is the same WordPress site (wp-admin), so it shares this origin.
	window.parent.postMessage(
		{ type: config.resultType, observations },
		window.location.origin
	);
}

// Only run inside the health-check iframe with config present.
if ( config && window.parent && window.parent !== window ) {
	run();
}
