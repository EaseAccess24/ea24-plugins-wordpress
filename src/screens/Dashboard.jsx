/**
 * Dashboard — the connected screen with the on-demand Health Check.
 *
 * Shows the Connection summary (masked key, domain, last check) and runs the
 * client-side probe on demand: it opens a hidden same-origin iframe, derives a
 * diagnosis from what the probe observed, persists the reason code, and renders
 * what/why/how-to-fix cards + a transparency checklist. No validation, no
 * backend calls — everything is observed locally.
 */
import { useState } from '@wordpress/element';
import { t } from '../i18n';
import Badge from '../components/Badge';
import Button from '../components/Button';
import MaskedKey, { SMALL_OUTLINE_BUTTON } from '../components/MaskedKey';
import Checklist from '../components/Checklist';
import DiagnosticCard from '../components/DiagnosticCard';
import { Check, Retry, Shield } from '../components/Icons';
import { runProbe } from '../health/probeClient';
import { derive } from '../health/diagnostics';
import { REASON, statusForCode } from '../health/reasonCodes';
import { persistHealthResult } from '../api/health';

/**
 * Format a unix timestamp (seconds) for display, or the "never" fallback.
 *
 * @param {number|null} ts Unix seconds.
 * @return {string} Human-readable time or the never-checked label.
 */
function formatLastCheck( ts ) {
	if ( ! ts ) {
		return t( 'dashboard.neverChecked' );
	}
	return new Date( ts * 1000 ).toLocaleString();
}

/**
 * @param {Object}   props
 * @param {Object}   props.connection         Stored connection state.
 * @param {Function} props.onUpdate           Switch to edit-key mode.
 * @param {Function} props.onConnectionChange Receives the updated connection.
 */
export default function Dashboard( {
	connection,
	onUpdate,
	onConnectionChange,
} ) {
	const boot =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
	const env = boot.environment || {};

	const [ status, setStatus ] = useState( 'idle' ); // 'idle' | 'running' | 'timeout'
	const [ result, setResult ] = useState( null );

	const running = status === 'running';
	const hasStoredResult =
		! result &&
		Object.values( REASON ).indexOf( connection.backend_status ) !== -1;

	// No persisted health result yet, and nothing observed this session either
	// (a timeout doesn't count as "never checked" — it means a check DID run,
	// it just didn't finish).
	const neverChecked = ! connection.last_health_check;
	const emptyState = neverChecked && status !== 'timeout' && ! result;

	async function runCheck() {
		setStatus( 'running' );
		setResult( null );

		try {
			const observations = await runProbe( {
				homeUrl: boot.homeUrl,
				nonce: boot.healthCheckNonce,
			} );

			const diagnosis = derive( observations, {
				keyPresent: Boolean( connection.widget_key ),
				isLocalhost: Boolean( env.isLocalhost ),
				isStaging: Boolean( env.isStaging ),
			} );

			// Persist the observed code; the server stamps the timestamp.
			try {
				const updated = await persistHealthResult(
					diagnosis.primary.code
				);
				if ( onConnectionChange ) {
					onConnectionChange( updated );
				}
			} catch ( persistError ) {
				// A failed persist doesn't invalidate the observed result; still
				// show it. The stepper simply won't advance until a check sticks.
			}

			setResult( diagnosis );
			setStatus( 'idle' );
		} catch ( probeError ) {
			setStatus( 'timeout' );
		}
	}

	return (
		<div>
			{ /* Status banner. Copy reflects the stored connection (reskin only —
			     no health derivation added here); the honest per-check health is
			     surfaced by the diagnostic cards below and the header pill. */ }
			<div className="ea24-mb-[22px] ea24-flex ea24-items-center ea24-gap-5 ea24-rounded-card ea24-border ea24-border-ea24-banner-border ea24-bg-banner ea24-px-7 ea24-py-6">
				<span
					aria-hidden="true"
					className="ea24-flex ea24-h-14 ea24-w-14 ea24-flex-none ea24-items-center ea24-justify-center ea24-rounded-full ea24-border ea24-border-ea24-success-border ea24-bg-ea24-success-bg"
				>
					<Check size={ 30 } color="#27AE60" strokeWidth={ 3 } />
				</span>
				<div>
					<div className="ea24-flex ea24-items-center ea24-gap-3">
						<h2 className="ea24-text-xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
							{ t( 'dashboard.title' ) }
						</h2>
						<Badge tone="success">
							{ t( 'dashboard.statusBadge' ) }
						</Badge>
					</div>
					<p className="ea24-mt-1 ea24-text-sm ea24-text-ea24-muted-2">
						{ t( 'dashboard.subtitle' ) }
					</p>
				</div>
			</div>

			{ /* Two-column: summary + health monitoring. */ }
			<div className="ea24-grid ea24-items-start ea24-gap-[22px] lg:ea24-grid-cols-2">
				{ /* Connection summary */ }
				<section className="ea24-overflow-hidden ea24-rounded-card ea24-bg-white ea24-shadow-card">
					<div className="ea24-border-b ea24-border-ea24-divider ea24-px-6 ea24-pb-4 ea24-pt-5">
						<h3 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
							{ t( 'dashboard.title' ) }
						</h3>
					</div>
					<div className="ea24-px-6 ea24-pb-5 ea24-pt-1">
						<SummaryRow label={ t( 'dashboard.keyLabel' ) }>
							<MaskedKey value={ connection.widget_key } />
						</SummaryRow>
						{ connection.resolved_domain && (
							<SummaryRow label={ t( 'dashboard.domainLabel' ) }>
								<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
									{ connection.resolved_domain }
								</span>
							</SummaryRow>
						) }
						<SummaryRow label={ t( 'dashboard.lastCheckLabel' ) }>
							<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
								{ formatLastCheck(
									connection.last_health_check
								) }
							</span>
						</SummaryRow>
						<div className="ea24-flex ea24-justify-end ea24-pt-3">
							<button
								type="button"
								onClick={ onUpdate }
								className={ SMALL_OUTLINE_BUTTON }
							>
								{ t( 'common.updateKey' ) }
							</button>
						</div>
					</div>
				</section>

				{ /* Health Check panel */ }
				<section className="ea24-overflow-hidden ea24-rounded-card ea24-bg-white ea24-shadow-card">
					<div className="ea24-flex ea24-items-center ea24-justify-between ea24-gap-4 ea24-border-b ea24-border-ea24-divider ea24-px-6 ea24-py-4">
						<h3 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
							{ t( 'health.heading' ) }
						</h3>
						{ ! emptyState && (
							<Button
								variant="secondary"
								busy={ running }
								onClick={ runCheck }
							>
								{ ! running && (
									<Retry size={ 15 } color="#5D29D7" />
								) }
								{ running
									? t( 'health.running' )
									: t( 'health.run' ) }
							</Button>
						) }
					</div>
					<div className="ea24-px-6 ea24-pb-5 ea24-pt-3">
						<div aria-live="polite" className="ea24-sr-only">
							{ running ? t( 'health.running' ) : '' }
						</div>

						{ emptyState ? (
							<div className="ea24-flex ea24-flex-col ea24-items-center ea24-py-6 ea24-text-center">
								<Shield size={ 34 } color="#8a8fa0" />
								<h4 className="ea24-mt-3 ea24-text-base ea24-font-bold ea24-text-ea24-body">
									{ t( 'dashboard.healthNotRunYet' ) }
								</h4>
								<p className="ea24-mt-1 ea24-max-w-[320px] ea24-text-sm ea24-text-ea24-muted">
									{ t( 'health.intro' ) }
								</p>
								<Button
									variant="primary"
									busy={ running }
									onClick={ runCheck }
									className="ea24-mt-5"
								>
									{ ! running && (
										<Retry size={ 15 } color="#fff" />
									) }
									{ running
										? t( 'health.running' )
										: t( 'health.run' ) }
								</Button>
							</div>
						) : (
							<p className="ea24-text-sm ea24-text-ea24-muted">
								{ t( 'health.intro' ) }
							</p>
						) }

						{ status === 'timeout' && (
							<div className="ea24-mt-4">
								<TimeoutCard
									onRetry={ runCheck }
									busy={ running }
								/>
							</div>
						) }

						{ result && (
							<div className="ea24-mt-2">
								<h4 className="ea24-mb-1 ea24-text-xs ea24-font-bold ea24-uppercase ea24-tracking-wide ea24-text-ea24-faint">
									{ t( 'health.checklistHeading' ) }
								</h4>
								<Checklist items={ result.checklist } />
							</div>
						) }
					</div>
				</section>
			</div>

			{ /* Diagnostic result cards are wide (Why/Fix grid), so they stack
			     full-width below the two-column grid, constrained and centered
			     so they don't stretch edge-to-edge on wide viewports. */ }
			{ result && (
				<div className="ea24-mx-auto ea24-mt-[22px] ea24-max-w-[780px] ea24-space-y-[18px]">
					<div>
						<h4 className="ea24-mb-2 ea24-text-sm ea24-font-bold ea24-text-ea24-body">
							{ t( 'health.resultsHeading' ) }
						</h4>
						<DiagnosticCard
							code={ result.primary.code }
							status={ result.primary.status }
							onRetry={ runCheck }
							busy={ running }
						/>
					</div>

					{ result.advisories.length > 0 && (
						<div>
							<h4 className="ea24-mb-2 ea24-text-sm ea24-font-bold ea24-text-ea24-body">
								{ t( 'health.advisoriesHeading' ) }
							</h4>
							<div className="ea24-space-y-[18px]">
								{ result.advisories.map( ( advisory ) => (
									<DiagnosticCard
										key={ advisory.code }
										code={ advisory.code }
										status={ advisory.status }
									/>
								) ) }
							</div>
						</div>
					) }
				</div>
			) }

			{ hasStoredResult && (
				<div className="ea24-mx-auto ea24-mt-[22px] ea24-max-w-[780px]">
					<h4 className="ea24-mb-2 ea24-text-sm ea24-font-bold ea24-text-ea24-body">
						{ t( 'health.resultsHeading' ) }
					</h4>
					<DiagnosticCard
						code={ connection.backend_status }
						status={ statusForCode( connection.backend_status ) }
						onRetry={ runCheck }
						busy={ running }
					/>
				</div>
			) }
		</div>
	);
}

/**
 * A labeled row inside the Connection summary card.
 *
 * @param {Object}  props
 * @param {string}  props.label    Row label.
 * @param {boolean} [props.last]   Drop the bottom divider on the last row.
 * @param {*}       props.children Row value.
 */
function SummaryRow( { label, last, children } ) {
	return (
		<div
			className={ `ea24-flex ea24-items-center ea24-justify-between ea24-gap-4 ea24-py-3 ${
				last ? '' : 'ea24-border-b ea24-border-ea24-divider'
			}` }
		>
			<span className="ea24-text-sm ea24-text-ea24-muted">{ label }</span>
			{ children }
		</div>
	);
}

/**
 * The honest fallback when the probe didn't finish — never a bare "Error".
 *
 * @param {Object}   props
 * @param {Function} props.onRetry Re-run handler.
 * @param {boolean}  props.busy    Whether a check is running.
 */
function TimeoutCard( { onRetry, busy } ) {
	return (
		<div className="ea24-rounded-card ea24-border-l-4 ea24-border-l-ea24-amber ea24-bg-white ea24-p-5 ea24-shadow-card">
			<h3 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
				{ t( 'health.timeoutTitle' ) }
			</h3>
			<p className="ea24-mt-2 ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted">
				{ t( 'health.timeoutBody' ) }
			</p>
			<div className="ea24-mt-4">
				<Button variant="secondary" busy={ busy } onClick={ onRetry }>
					{ ! busy && <Retry size={ 15 } color="#5D29D7" /> }
					{ t( 'actions.retry' ) }
				</Button>
			</div>
		</div>
	);
}
