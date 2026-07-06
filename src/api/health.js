/**
 * Health REST client.
 *
 * Persists the OBSERVED outcome of an on-demand Health Check (a reason code the
 * browser probe derived). The server stamps the timestamp and stores the code as
 * an observation — it validates nothing.
 */
import { apiRequest } from './client';

/**
 * Persist a derived health-check reason code.
 *
 * @param {string} code A reason code from the diagnostics catalog.
 * @return {Promise<Object>} The updated connection state.
 */
export function persistHealthResult( code ) {
	return apiRequest( 'health', { method: 'POST', body: { code } } );
}
