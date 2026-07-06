/**
 * Clipboard helper.
 *
 * Wraps the async Clipboard API and resolves to whether the write succeeded.
 * The API is unavailable in insecure contexts, so callers should treat a false
 * result as "copy unavailable" rather than an error — never throw at the user.
 */

/**
 * Copy text to the clipboard.
 *
 * @param {string} text Text to copy.
 * @return {Promise<boolean>} Whether the copy succeeded.
 */
export async function copyToClipboard( text ) {
	try {
		if (
			! window.navigator ||
			! window.navigator.clipboard ||
			typeof window.navigator.clipboard.writeText !== 'function'
		) {
			return false;
		}
		await window.navigator.clipboard.writeText( text );
		return true;
	} catch ( error ) {
		// Insecure context or permission denied — fail quietly.
		return false;
	}
}
