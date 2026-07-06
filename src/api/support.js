/**
 * Support-report API.
 *
 * Fetches the assembled, already-redacted Support Report. The plugin transmits
 * nothing: this returns the report for the user to preview, copy, or download.
 */
import { apiRequest } from './client';

/**
 * Fetch the Support Report.
 *
 * @return {Promise<{report:Object,text:string}>} Structured report + plaintext.
 */
export function getSupportReport() {
	return apiRequest( 'support-report' );
}
