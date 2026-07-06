/**
 * File download helper.
 *
 * Triggers a client-side download of in-memory text via a Blob and a transient
 * object URL. Used by the Support Report so the user can save exactly what the
 * preview shows — nothing is transmitted.
 */

/**
 * Download a string as a file.
 *
 * @param {string} filename Suggested file name (e.g. 'support-report.txt').
 * @param {string} mime     MIME type (e.g. 'text/plain', 'application/json').
 * @param {string} contents File contents.
 * @return {boolean} Whether the download was initiated.
 */
export function downloadFile( filename, mime, contents ) {
	try {
		const blob = new window.Blob( [ contents ], { type: mime } );
		const url = window.URL.createObjectURL( blob );

		const anchor = document.createElement( 'a' );
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild( anchor );
		anchor.click();
		document.body.removeChild( anchor );

		// Release the object URL on the next tick, once the click is handled.
		window.setTimeout( () => window.URL.revokeObjectURL( url ), 0 );
		return true;
	} catch ( error ) {
		return false;
	}
}
