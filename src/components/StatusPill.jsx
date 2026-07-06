/**
 * StatusPill — the live connection/health chip in the app header.
 *
 * Reads the PERSISTED connection state from the PHP bootstrap
 * (`window.easeAccess24Data.settings`) read-only — it lifts no state and drives
 * no data flow, so it stays within the reskin boundary. It reflects the last
 * health check that was persisted (honest: never hardcoded "healthy"):
 *
 *   - no Widget Key saved  → neutral "Not connected"
 *   - backend_status === OK → green  "Connected · Healthy"
 *   - key saved, not OK yet → amber  "Connected · Needs attention"
 *
 * Status is conveyed by icon + word, never color alone.
 */
import { t } from '../i18n';
import { Check, Warn, Dash } from './Icons';

/** Read the persisted connection once (read-only bootstrap access). */
function readState() {
	const boot =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
	const settings = boot.settings || {};
	const hasKey = Boolean( settings.widget_key );

	if ( ! hasKey ) {
		return 'disconnected';
	}
	return settings.backend_status === 'OK' ? 'healthy' : 'attention';
}

const TONE = {
	healthy: {
		dot: '#27AE60',
		text: 'ea24-text-ea24-success-text',
		labelKey: 'status.healthy',
		Icon: Check,
		iconColor: '#27AE60',
	},
	attention: {
		dot: '#D98A12',
		text: 'ea24-text-ea24-warning-text',
		labelKey: 'status.attention',
		Icon: Warn,
		iconColor: '#D98A12',
	},
	disconnected: {
		dot: '#c9ccd6',
		text: 'ea24-text-ea24-muted-2',
		labelKey: 'status.notConnected',
		Icon: Dash,
		iconColor: '#8a8fa0',
	},
};

export default function StatusPill() {
	const state = readState();
	const { dot, text, labelKey, Icon, iconColor } = TONE[ state ];

	return (
		<span className="ea24-inline-flex ea24-items-center ea24-gap-2 ea24-rounded-full ea24-bg-white ea24-py-1.5 ea24-pl-3 ea24-pr-3.5 ea24-shadow-pill">
			<span
				aria-hidden="true"
				className="ea24-h-2 ea24-w-2 ea24-flex-none ea24-rounded-full"
				style={ { background: dot } }
			/>
			<span aria-hidden="true" className="ea24-inline-flex">
				<Icon size={ 14 } color={ iconColor } />
			</span>
			<span className={ `ea24-text-sm ea24-font-bold ${ text }` }>
				{ t( labelKey ) }
			</span>
		</span>
	);
}
