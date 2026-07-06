/**
 * Connection REST client.
 *
 * Talks only to the plugin's own same-origin `easeaccess24/v1/connection`
 * endpoint. No client-side key parsing — the server extracts and sanitizes.
 */
import { apiRequest } from './client';

/**
 * Fetch the current connection state.
 *
 * @return {Promise<Object>} The connection state.
 */
export function getConnection() {
	return apiRequest( 'connection' );
}

/**
 * Save a Widget Key (or full snippet). The server extracts the key.
 *
 * @param {string} key Raw key or pasted script snippet.
 * @return {Promise<Object>} The updated connection state.
 */
export function saveConnection( key ) {
	return apiRequest( 'connection', { method: 'POST', body: { key } } );
}
