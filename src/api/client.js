/**
 * Shared REST client for the plugin's own same-origin routes under
 * `easeaccess24/v1/`, authenticated with the `wp_rest` nonce localized by
 * includes/class-admin.php as `easeAccess24Data`. No external hosts.
 */

const ROUTE_BASE = 'easeaccess24/v1/';

/**
 * Read the localized bootstrap data. Returns safe empties if absent so calls
 * fail loudly (via a rejected fetch) rather than throwing on property access.
 *
 * @return {{restUrl: string, nonce: string}} Bootstrap config.
 */
function config() {
	const data =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};

	return {
		restUrl: data.restUrl || '',
		nonce: data.nonce || '',
	};
}

/**
 * Perform a nonce-authenticated JSON request against a plugin route.
 *
 * @param {string} route            Route path relative to `easeaccess24/v1/`.
 * @param {Object} [options]        Options.
 * @param {string} [options.method] HTTP method (default 'GET').
 * @param {Object} [options.body]   Optional JSON body.
 * @return {Promise<Object>} Parsed JSON response.
 * @throws {Error} On a non-2xx response (with `.status` set) or network failure.
 */
export async function apiRequest( route, { method = 'GET', body } = {} ) {
	const { restUrl, nonce } = config();

	const response = await fetch( `${ restUrl }${ ROUTE_BASE }${ route }`, {
		method,
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
		},
		body: body ? JSON.stringify( body ) : undefined,
	} );

	if ( ! response.ok ) {
		const error = new Error(
			`Request failed with status ${ response.status }`
		);
		error.status = response.status;
		throw error;
	}

	return response.json();
}
