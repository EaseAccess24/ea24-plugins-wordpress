/**
 * Probe client (admin side).
 *
 * Opens a hidden, same-origin iframe pointed at the site front page with a
 * nonce'd health-check flag, waits for the probe's postMessage result (validated
 * by origin + source + type), and resolves the observation bundle. Always cleans
 * up the iframe; rejects on timeout so the UI can show an honest fallback card.
 */

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Run the front-end probe and resolve its observations.
 *
 * @param {Object} options
 * @param {string} options.homeUrl      Front-end URL to load (from easeAccess24Data).
 * @param {string} options.nonce        Health-check nonce.
 * @param {number} [options.timeoutMs]  Max wait before rejecting.
 * @param {string} [options.resultType] Expected postMessage type.
 * @return {Promise<Object>} The observation bundle.
 */
export function runProbe( {
	homeUrl,
	nonce,
	timeoutMs = DEFAULT_TIMEOUT_MS,
	resultType = 'ea24-health-result',
} ) {
	return new Promise( ( resolve, reject ) => {
		const iframe = document.createElement( 'iframe' );
		iframe.setAttribute( 'aria-hidden', 'true' );
		iframe.setAttribute( 'tabindex', '-1' );
		iframe.style.cssText =
			'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;opacity:0;';

		const separator = homeUrl.indexOf( '?' ) === -1 ? '?' : '&';
		const src = `${ homeUrl }${ separator }ea24-health-check=${ encodeURIComponent(
			nonce
		) }`;

		let settled = false;

		function cleanup() {
			window.removeEventListener( 'message', onMessage );
			if ( timer ) {
				window.clearTimeout( timer );
			}
			if ( iframe.parentNode ) {
				iframe.parentNode.removeChild( iframe );
			}
		}

		function onMessage( event ) {
			// Same-origin only, and only from our iframe, with the right type.
			if ( event.origin !== window.location.origin ) {
				return;
			}
			if ( event.source !== iframe.contentWindow ) {
				return;
			}
			const data = event.data;
			if ( ! data || data.type !== resultType ) {
				return;
			}
			if ( settled ) {
				return;
			}
			settled = true;
			cleanup();
			resolve( data.observations );
		}

		window.addEventListener( 'message', onMessage );

		const timer = window.setTimeout( () => {
			if ( settled ) {
				return;
			}
			settled = true;
			cleanup();
			reject( new Error( 'probe-timeout' ) );
		}, timeoutMs );

		iframe.src = src;
		document.body.appendChild( iframe );
	} );
}
