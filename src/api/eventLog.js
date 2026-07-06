/**
 * Event-log API.
 *
 * Thin wrappers over the shared REST client for reading and clearing the local
 * event log. The log lives on the server (a capped option) — it is never sent
 * anywhere automatically.
 */
import { apiRequest } from './client';

/**
 * Fetch the local event log, newest first.
 *
 * @return {Promise<Array<{ts:number,type:string,code?:string}>>} Events.
 */
export function getEvents() {
	return apiRequest( 'events' );
}

/**
 * Clear the local event log.
 *
 * @return {Promise<{cleared:boolean}>} Result.
 */
export function clearEvents() {
	return apiRequest( 'events/clear', { method: 'POST' } );
}
