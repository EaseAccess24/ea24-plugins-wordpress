/**
 * DiagnosticCard — one what/why/how-to-fix card for a reason code.
 *
 * Copy comes entirely from `diagnostics.<CODE>.*`. Tone (left stripe, icon chip,
 * badge) reflects the status via icon + text, not color alone. Actions are
 * chosen from the code: every non-OK card can re-run the check; codes the
 * platform Dashboard can fix also link out to app.easeaccess24.com.
 */
import { t } from '../i18n';
import Badge from './Badge';
import Button from './Button';
import { Check, Warn, Info, ArrowOut, Retry } from './Icons';

const APP_URL = 'https://app.easeaccess24.com';

// Codes whose fix lives in the EaseAccess24 platform (add domain, check key,
// renew, etc.) — these show an "Open Dashboard" action.
const DASHBOARD_CODES = [
	'DOMAIN_NOT_ALLOWED',
	'WIDGET_NOT_INITIALIZED',
	'LOCALHOST_DETECTED',
	'STAGING_DETECTED',
	'KEY_INVALID',
	'SUBSCRIPTION_EXPIRED',
	'ORG_DISABLED',
];

const TONE_FOR_STATUS = {
	pass: 'success',
	info: 'neutral',
	warn: 'warning',
	fail: 'danger',
};

// Left stripe color per severity (the signature 6px accent).
const STRIPE = {
	pass: '#27AE60',
	info: '#6B7480',
	warn: '#F7AA2F',
	fail: '#B42318',
};

// Icon-chip background + the icon rendered inside it, per severity.
const CHIP_BG = {
	pass: 'ea24-bg-ea24-success-bg',
	info: 'ea24-bg-ea24-neutral-bg',
	warn: 'ea24-bg-ea24-warning-bg',
	fail: 'ea24-bg-ea24-danger-bg',
};

// "WHY" label color per severity (amber / gray / green / red).
const WHY_LABEL = {
	pass: 'ea24-text-ea24-success-text',
	info: 'ea24-text-ea24-neutral-text',
	warn: 'ea24-text-ea24-warning-text',
	fail: 'ea24-text-ea24-danger-text',
};

/**
 * The severity icon rendered inside the chip.
 *
 * @param {string} status Card status.
 * @return {JSX.Element} Icon element.
 */
function chipIcon( status ) {
	if ( status === 'pass' ) {
		return <Check size={ 20 } color="#27AE60" strokeWidth={ 3 } />;
	}
	if ( status === 'info' ) {
		return <Info size={ 20 } color="#6B7480" />;
	}
	if ( status === 'fail' ) {
		return <Warn size={ 20 } color="#B42318" />;
	}
	return <Warn size={ 20 } color="#D98A12" />;
}

/**
 * @param {Object}   props
 * @param {string}   props.code      Reason code.
 * @param {string}   props.status    'pass' | 'info' | 'warn' | 'fail'.
 * @param {Function} [props.onRetry] Re-run handler (omit to hide Retry).
 * @param {boolean}  [props.busy]    Disables actions while a check runs.
 */
export default function DiagnosticCard( { code, status, onRetry, busy } ) {
	const isOk = status === 'pass';
	const showDashboard = DASHBOARD_CODES.indexOf( code ) !== -1;
	const showRetry = onRetry && ! isOk;

	return (
		<article className="ea24-flex ea24-overflow-hidden ea24-rounded-card ea24-bg-white ea24-shadow-card">
			<div
				className="ea24-w-1.5 ea24-flex-none"
				style={ { background: STRIPE[ status ] || STRIPE.info } }
			/>
			<div className="ea24-flex-1 ea24-p-6">
				<div className="ea24-mb-4 ea24-flex ea24-items-center ea24-gap-3">
					<span
						aria-hidden="true"
						className={ `ea24-flex ea24-h-9 ea24-w-9 ea24-flex-none ea24-items-center ea24-justify-center ea24-rounded-[10px] ${
							CHIP_BG[ status ] || CHIP_BG.info
						}` }
					>
						{ chipIcon( status ) }
					</span>
					<h3 className="ea24-flex-1 ea24-text-lg ea24-font-bold ea24-text-ea24-body">
						{ t( `diagnostics.${ code }.title` ) }
					</h3>
					<Badge tone={ TONE_FOR_STATUS[ status ] || 'neutral' }>
						{ t( `checklist.status.${ statusWord( status ) }` ) }
					</Badge>
				</div>

				<dl className="ea24-grid ea24-grid-cols-[96px_1fr] ea24-gap-x-4 ea24-gap-y-2.5">
					<dt
						className={ `ea24-pt-0.5 ea24-text-[11.5px] ea24-font-bold ea24-uppercase ea24-tracking-wide ${
							WHY_LABEL[ status ] || WHY_LABEL.info
						}` }
					>
						{ t( 'diagnostics.whyLabel' ) }
					</dt>
					<dd className="ea24-text-sm ea24-leading-relaxed ea24-text-[#3a3e4d]">
						{ t( `diagnostics.${ code }.why` ) }
					</dd>
					<dt className="ea24-pt-0.5 ea24-text-[11.5px] ea24-font-bold ea24-uppercase ea24-tracking-wide ea24-text-ea24-success-text">
						{ t( 'diagnostics.fixLabel' ) }
					</dt>
					<dd className="ea24-text-sm ea24-leading-relaxed ea24-text-[#3a3e4d]">
						{ t( `diagnostics.${ code }.fix` ) }
					</dd>
				</dl>

				{ ( showDashboard || showRetry ) && (
					<div className="ea24-mt-5 ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-3">
						{ showDashboard && (
							<a
								href={ APP_URL }
								target="_blank"
								rel="noopener noreferrer"
								className="ea24-gradbtn ea24-inline-flex ea24-h-11 ea24-items-center ea24-gap-2 ea24-rounded-btn ea24-bg-brand-gradient ea24-px-5 ea24-text-sm ea24-font-semibold ea24-text-white ea24-shadow-btn hover:ea24-brightness-[1.06]"
							>
								{ t( 'actions.openDashboard' ) }
								<ArrowOut size={ 15 } color="#fff" />
							</a>
						) }
						{ showRetry && (
							<Button
								variant="secondary"
								busy={ busy }
								onClick={ onRetry }
							>
								{ ! busy && (
									<Retry size={ 15 } color="#5D29D7" />
								) }
								{ t( 'actions.retry' ) }
							</Button>
						) }
					</div>
				) }
			</div>
		</article>
	);
}

/**
 * The i18n status vocabulary uses pass/fail/warn/info; map card status to it.
 *
 * @param {string} status Card status.
 * @return {string} Status word key.
 */
function statusWord( status ) {
	if ( status === 'pass' || status === 'fail' || status === 'warn' ) {
		return status;
	}
	return 'info';
}
