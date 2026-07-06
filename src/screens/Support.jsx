/**
 * Support — the user-initiated Support Report.
 *
 * Generates an already-redacted report (masked key, no personal data) and shows
 * the exact text that will be copied or downloaded. Nothing is transmitted: the
 * MVP has no endpoint, so "send" means copy or download and share it yourself.
 * The .txt and .json outputs are the same data shown in the preview.
 */
import { useState, useEffect } from '@wordpress/element';
import { t } from '../i18n';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { Shield, Lock } from '../components/Icons';
import { getSupportReport } from '../api/support';
import { getSettings, saveSettings } from '../api/settings';
import { copyToClipboard } from '../utils/clipboard';
import { downloadFile } from '../utils/download';

const TXT_FILENAME = 'easeaccess24-support-report.txt';
const JSON_FILENAME = 'easeaccess24-support-report.json';

// Static plugin-info values: no PHP constants are exposed for these (only
// plain docblock comments in the plugin header), and they change at most
// once per release, so a hardcoded string is acceptable here. Only the
// version below is read from already-exposed bootstrap data.
const WP_COMPAT_VALUE = '6.0 and above';
const PHP_MIN_VALUE = '7.4 or higher';
const TESTED_UP_TO_VALUE = 'WordPress 7.0';

export default function Support() {
	const [ status, setStatus ] = useState( 'idle' ); // 'idle' | 'generating'
	const [ data, setData ] = useState( null ); // { report, text }
	const [ error, setError ] = useState( '' );
	const [ copied, setCopied ] = useState( false );
	const [ announce, setAnnounce ] = useState( '' );

	// Data & privacy: the remove-all-data-on-uninstall opt-in. Loaded once so the
	// checkbox reflects the stored flag; toggling persists it immediately.
	const [ removeData, setRemoveData ] = useState( false );
	const [ removeDataReady, setRemoveDataReady ] = useState( false );
	const [ settingsAnnounce, setSettingsAnnounce ] = useState( '' );

	useEffect( () => {
		let active = true;
		getSettings()
			.then( ( prefs ) => {
				if ( active ) {
					setRemoveData( Boolean( prefs.removeDataOnUninstall ) );
					setRemoveDataReady( true );
				}
			} )
			.catch( () => {
				if ( active ) {
					setSettingsAnnounce( t( 'settings.loadError' ) );
					setRemoveDataReady( true );
				}
			} );
		return () => {
			active = false;
		};
	}, [] );

	async function handleRemoveDataChange( event ) {
		const next = event.target.checked;
		setRemoveData( next ); // Optimistic.
		try {
			await saveSettings( { removeDataOnUninstall: next } );
			setSettingsAnnounce( t( 'settings.saved' ) );
		} catch ( saveError ) {
			setRemoveData( ! next ); // Revert on failure.
			setSettingsAnnounce( t( 'settings.saveError' ) );
		}
	}

	const generating = status === 'generating';

	function generateLabel() {
		if ( generating ) {
			return t( 'supportReport.generating' );
		}
		return data
			? t( 'supportReport.regenerate' )
			: t( 'supportReport.generate' );
	}

	async function generate() {
		setStatus( 'generating' );
		setError( '' );
		setCopied( false );
		try {
			const result = await getSupportReport();
			setData( result );
		} catch ( generateError ) {
			setError( t( 'supportReport.generateError' ) );
		}
		setStatus( 'idle' );
	}

	async function handleCopy() {
		if ( ! data ) {
			return;
		}
		const ok = await copyToClipboard( data.text );
		if ( ok ) {
			setCopied( true );
			setAnnounce( t( 'supportReport.copied' ) );
			window.setTimeout( () => setCopied( false ), 2000 );
		} else {
			setError( t( 'supportReport.copyFailed' ) );
		}
	}

	function handleDownloadTxt() {
		if ( ! data ) {
			return;
		}
		downloadFile( TXT_FILENAME, 'text/plain', data.text );
	}

	function handleDownloadJson() {
		if ( ! data ) {
			return;
		}
		// Serialize the same structured data shown in the preview so the download
		// matches byte-for-byte what the user reviewed.
		downloadFile(
			JSON_FILENAME,
			'application/json',
			JSON.stringify( data.report, null, 2 )
		);
	}

	const boot =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
	const version = boot.version || '';

	return (
		<div className="ea24-mx-auto ea24-max-w-[740px]">
			<section className="ea24-mb-6 ea24-overflow-hidden ea24-rounded-card ea24-bg-white ea24-shadow-card">
				<div className="ea24-border-b ea24-border-ea24-divider ea24-px-6 ea24-pb-4 ea24-pt-5">
					<h3 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
						{ t( 'pluginInfo.title' ) }
					</h3>
				</div>
				<div className="ea24-px-6 ea24-pb-5 ea24-pt-1">
					<InfoRow label={ t( 'pluginInfo.version' ) }>
						<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
							{ version }
						</span>
					</InfoRow>
					<InfoRow label={ t( 'pluginInfo.wpCompat' ) }>
						<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
							{ WP_COMPAT_VALUE }
						</span>
					</InfoRow>
					<InfoRow label={ t( 'pluginInfo.phpMin' ) }>
						<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
							{ PHP_MIN_VALUE }
						</span>
					</InfoRow>
					<InfoRow label={ t( 'pluginInfo.testedUpTo' ) }>
						<span className="ea24-text-sm ea24-font-semibold ea24-text-ea24-body">
							{ TESTED_UP_TO_VALUE }
						</span>
					</InfoRow>
					<InfoRow label={ t( 'pluginInfo.supportStatus' ) } last>
						<Badge tone="success">
							{ t( 'pluginInfo.supportStatusActive' ) }
						</Badge>
					</InfoRow>
				</div>
			</section>

			<section className="ea24-rounded-card-lg ea24-bg-white ea24-p-8 ea24-shadow-card-lg">
				<div className="ea24-mb-2 ea24-flex ea24-items-center ea24-gap-3">
					<span className="ea24-flex ea24-h-11 ea24-w-11 ea24-flex-none ea24-items-center ea24-justify-center ea24-rounded-[12px] ea24-border ea24-border-ea24-banner-border ea24-bg-ea24-surface">
						<Shield size={ 23 } color="#5D29D7" />
					</span>
					<h2 className="ea24-text-xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
						{ t( 'supportReport.title' ) }
					</h2>
				</div>
				<p className="ea24-mb-6 ea24-ml-14 ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted-2">
					{ t( 'supportReport.intro' ) }
				</p>

				<div aria-live="polite" className="ea24-sr-only">
					{ announce || error }
				</div>

				<Button
					variant="primary"
					size="lg"
					busy={ generating }
					onClick={ generate }
				>
					{ generateLabel() }
				</Button>

				{ error && (
					<p className="ea24-mt-4 ea24-text-sm ea24-text-ea24-danger-text">
						{ error }
					</p>
				) }

				{ data && (
					<div className="ea24-mt-6">
						<label
							htmlFor="ea24-support-report-preview"
							className="ea24-mb-2 ea24-block ea24-text-sm ea24-font-semibold ea24-text-ea24-body"
						>
							{ t( 'supportReport.previewLabel' ) }
						</label>
						<pre
							id="ea24-support-report-preview"
							className="ea24-max-h-96 ea24-overflow-auto ea24-whitespace-pre-wrap ea24-break-words ea24-rounded-[12px] ea24-bg-ea24-preview ea24-p-5 ea24-font-mono ea24-text-[13px] ea24-leading-relaxed ea24-text-ea24-preview-text"
						>
							{ data.text }
						</pre>

						<div className="ea24-mt-4 ea24-flex ea24-items-start ea24-gap-2.5 ea24-rounded-[11px] ea24-border ea24-border-ea24-success-border ea24-bg-ea24-success-bg ea24-px-4 ea24-py-3">
							<span
								aria-hidden="true"
								className="ea24-mt-0.5 ea24-flex-none"
							>
								<Lock size={ 18 } color="#1B7A43" />
							</span>
							<span className="ea24-text-sm ea24-leading-relaxed ea24-text-ea24-success-text">
								{ t( 'supportReport.privacyNote' ) }
							</span>
						</div>

						<div className="ea24-mt-5 ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-3">
							<Button
								variant="secondary"
								size="sm"
								onClick={ handleCopy }
							>
								{ copied
									? t( 'supportReport.copied' )
									: t( 'supportReport.copy' ) }
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={ handleDownloadTxt }
							>
								{ t( 'supportReport.downloadTxt' ) }
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={ handleDownloadJson }
							>
								{ t( 'supportReport.downloadJson' ) }
							</Button>
						</div>
					</div>
				) }
			</section>

			<section className="ea24-mt-6 ea24-rounded-card ea24-bg-white ea24-p-6 ea24-shadow-card">
				<h3 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
					{ t( 'settings.dataTitle' ) }
				</h3>

				<div aria-live="polite" className="ea24-sr-only">
					{ settingsAnnounce }
				</div>

				<label
					htmlFor="ea24-remove-data"
					className="ea24-mt-3 ea24-flex ea24-cursor-pointer ea24-items-start ea24-gap-3"
				>
					<input
						id="ea24-remove-data"
						type="checkbox"
						checked={ removeData }
						disabled={ ! removeDataReady }
						onChange={ handleRemoveDataChange }
						className="ea24-mt-0.5 ea24-h-[18px] ea24-w-[18px] ea24-shrink-0 ea24-cursor-pointer ea24-rounded-[5px] ea24-accent-ea24-brand disabled:ea24-cursor-not-allowed"
					/>
					<span className="ea24-text-sm ea24-text-ea24-body">
						{ t( 'settings.removeDataLabel' ) }
						<span className="ea24-mt-1 ea24-block ea24-text-sm ea24-text-ea24-muted">
							{ t( 'settings.removeDataHelp' ) }
						</span>
					</span>
				</label>
			</section>
		</div>
	);
}

/**
 * A labeled row inside the Plugin information card.
 *
 * @param {Object}  props
 * @param {string}  props.label    Row label.
 * @param {boolean} [props.last]   Drop the bottom divider on the last row.
 * @param {*}       props.children Row value.
 */
function InfoRow( { label, last, children } ) {
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
