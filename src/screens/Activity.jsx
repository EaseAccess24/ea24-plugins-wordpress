/**
 * Activity — the local event log.
 *
 * Reads the capped, server-stored event log (health checks + lifecycle events),
 * newest first, and lets the user clear it. The log stays on the site and is
 * never transmitted automatically. No browser storage is used.
 */
import { useState, useEffect } from '@wordpress/element';
import { t } from '../i18n';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { statusForCode } from '../health/reasonCodes';
import { getEvents, clearEvents } from '../api/eventLog';
import { relativeBucket } from '../utils/relativeTime';

/**
 * Map a reason-code status to a Badge tone.
 *
 * @param {string} code Reason code.
 * @return {string} Badge tone.
 */
function toneForCode( code ) {
	switch ( statusForCode( code ) ) {
		case 'pass':
			return 'success';
		case 'warn':
			return 'warning';
		case 'fail':
			return 'danger';
		default:
			return 'neutral';
	}
}

/**
 * Format a unix timestamp (seconds) for display.
 *
 * @param {number} ts Unix seconds.
 * @return {string} Human-readable time.
 */
function formatTs( ts ) {
	return new Date( ts * 1000 ).toLocaleString();
}

export default function Activity() {
	const [ events, setEvents ] = useState( null ); // null = not loaded yet.
	const [ error, setError ] = useState( '' );
	const [ confirming, setConfirming ] = useState( false );
	const [ announce, setAnnounce ] = useState( '' );

	async function load() {
		setError( '' );
		try {
			const result = await getEvents();
			setEvents( Array.isArray( result ) ? result : [] );
		} catch ( loadError ) {
			setEvents( [] );
			setError( t( 'eventLog.loadError' ) );
		}
	}

	useEffect( () => {
		load();
	}, [] );

	async function handleClear() {
		setConfirming( false );
		try {
			await clearEvents();
			setEvents( [] );
			setAnnounce( t( 'eventLog.cleared' ) );
		} catch ( clearError ) {
			setError( t( 'eventLog.loadError' ) );
		}
	}

	return (
		<div>
			<header className="ea24-mb-6">
				<h2 className="ea24-text-2xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
					{ t( 'eventLog.title' ) }
				</h2>
				<p className="ea24-mt-1.5 ea24-max-w-[640px] ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted-2">
					{ t( 'eventLog.intro' ) }
				</p>
			</header>

			<div aria-live="polite" className="ea24-sr-only">
				{ announce || error }
			</div>

			{ null === events && (
				<p className="ea24-text-sm ea24-text-ea24-muted">
					{ t( 'eventLog.loading' ) }
				</p>
			) }

			{ error && (
				<p className="ea24-text-sm ea24-text-ea24-danger-text">
					{ error }
				</p>
			) }

			{ null !== events && events.length === 0 && ! error && (
				<div className="ea24-rounded-card ea24-bg-white ea24-p-6 ea24-text-sm ea24-text-ea24-muted ea24-shadow-card">
					{ t( 'eventLog.empty' ) }
				</div>
			) }

			{ null !== events && events.length > 0 && (
				<>
					<ul className="ea24-overflow-hidden ea24-rounded-card ea24-bg-white ea24-px-5 ea24-shadow-card">
						{ events.map( ( event, index ) => {
							const { bucket, n } = relativeBucket( event.ts );
							const absolute = formatTs( event.ts );
							return (
								<li
									key={ `${ event.ts }-${ index }` }
									className="ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-3 ea24-border-b ea24-border-ea24-divider ea24-py-3.5 last:ea24-border-0"
								>
									<time
										dateTime={ new Date(
											event.ts * 1000
										).toISOString() }
										title={ absolute }
										className="ea24-w-44 ea24-text-xs ea24-tabular-nums ea24-text-ea24-faint"
									>
										{ bucket
											? t(
													`eventLog.relative.${ bucket }`,
													{ n }
											  )
											: absolute }
										<span className="ea24-sr-only">
											{ ' ' }
											({ absolute })
										</span>
									</time>
									<span className="ea24-flex-1 ea24-text-sm ea24-text-ea24-body">
										{ t(
											`eventLog.types.${ event.type }`
										) }
									</span>
									{ event.code && (
										<Badge
											tone={ toneForCode( event.code ) }
										>
											{ event.code }
										</Badge>
									) }
								</li>
							);
						} ) }
					</ul>

					<div className="ea24-mt-6">
						{ confirming ? (
							<div className="ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-3">
								<span className="ea24-text-sm ea24-text-ea24-muted-2">
									{ t( 'eventLog.clearConfirm' ) }
								</span>
								<Button
									variant="primary"
									onClick={ handleClear }
								>
									{ t( 'eventLog.confirmClear' ) }
								</Button>
								<Button
									variant="secondary"
									onClick={ () => setConfirming( false ) }
								>
									{ t( 'eventLog.cancel' ) }
								</Button>
							</div>
						) : (
							<Button
								variant="secondary"
								onClick={ () => setConfirming( true ) }
							>
								{ t( 'eventLog.clear' ) }
							</Button>
						) }
					</div>
				</>
			) }
		</div>
	);
}
