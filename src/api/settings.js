/**
 * App-settings REST client.
 *
 * Reads and writes per-site preferences (UI language, remove-data-on-uninstall)
 * via the plugin's own same-origin `easeaccess24/v1/settings` endpoint.
 */
import { apiRequest } from './client';

/**
 * Fetch the current app preferences.
 *
 * @return {Promise<{language:string,removeDataOnUninstall:boolean}>} Preferences.
 */
export function getSettings() {
	return apiRequest( 'settings' );
}

/**
 * Persist app preferences. Send only the fields you want to change.
 *
 * @param {Object}  body                         Partial preferences.
 * @param {string}  [body.language]              UI language code.
 * @param {boolean} [body.removeDataOnUninstall] Remove-data-on-uninstall flag.
 * @return {Promise<{language:string,removeDataOnUninstall:boolean}>} Updated prefs.
 */
export function saveSettings( body ) {
	return apiRequest( 'settings', { method: 'POST', body } );
}
