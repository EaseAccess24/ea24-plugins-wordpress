/**
 * Relative-time bucketing for the Activity log.
 *
 * Pure: no i18n, no DOM. Buckets a unix-seconds timestamp against "now" into
 * one of four buckets, or null once it's old enough that the caller should
 * fall back to displaying the absolute date instead.
 */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * @param {number} ts    Unix seconds.
 * @param {number} [now] Unix seconds to compare against (injectable for tests).
 * @return {{bucket: ('justNow'|'minutesAgo'|'hoursAgo'|'daysAgo'|null), n: number}}
 *   `bucket` is null once the timestamp is ~7 days old or older — the caller
 *   should fall back to an absolute date display in that case.
 */
export function relativeBucket( ts, now = Math.floor( Date.now() / 1000 ) ) {
	const diff = Math.max( 0, now - ts );

	if ( diff < MINUTE ) {
		return { bucket: 'justNow', n: 0 };
	}
	if ( diff < HOUR ) {
		return { bucket: 'minutesAgo', n: Math.floor( diff / MINUTE ) };
	}
	if ( diff < DAY ) {
		return { bucket: 'hoursAgo', n: Math.floor( diff / HOUR ) };
	}
	if ( diff < WEEK ) {
		return { bucket: 'daysAgo', n: Math.floor( diff / DAY ) };
	}
	return { bucket: null, n: 0 };
}
