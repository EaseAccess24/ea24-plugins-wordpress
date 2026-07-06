/**
 * Compatibility — cache/optimizer detection and exclusion recommendations.
 *
 * Reads the server-detected list of active cache/optimization plugins (passed in
 * the bootstrap data — local state only, no remote calls) and shows a per-plugin
 * exclusion recommendation. If a cache plugin is active AND the last Health Check
 * observed the SDK script missing (OPTIMIZER_INTERFERENCE), it elevates a warning
 * card. It never changes another plugin's settings.
 */
import { t } from '../i18n';
import Badge from '../components/Badge';
import DiagnosticCard from '../components/DiagnosticCard';
import { REASON } from '../health/reasonCodes';

export default function Compatibility() {
	const boot =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
	const detected = Array.isArray( boot.compatibility )
		? boot.compatibility
		: [];
	const settings = boot.settings || {};

	// Elevate only when a known plugin is active AND the last observed result was
	// the optimizer-interference symptom from the Health Check (Phase 04).
	const appearsModified =
		detected.length > 0 &&
		settings.backend_status === REASON.OPTIMIZER_INTERFERENCE;

	return (
		<div>
			<header className="ea24-mb-6">
				<h2 className="ea24-text-2xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
					{ t( 'compatibility.title' ) }
				</h2>
				<p className="ea24-mt-1.5 ea24-max-w-[640px] ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted-2">
					{ t( 'compatibility.intro' ) }
				</p>
			</header>

			{ appearsModified && (
				<div className="ea24-mb-6">
					<h3 className="ea24-mb-1 ea24-text-sm ea24-font-bold ea24-text-ea24-body">
						{ t( 'compatibility.modifiedTitle' ) }
					</h3>
					<p className="ea24-mb-2 ea24-text-sm ea24-text-ea24-muted">
						{ t( 'compatibility.modifiedBody' ) }
					</p>
					<DiagnosticCard
						code={ REASON.OPTIMIZER_INTERFERENCE }
						status="warn"
					/>
				</div>
			) }

			{ detected.length === 0 ? (
				<div className="ea24-rounded-card ea24-bg-white ea24-p-6 ea24-shadow-card">
					<Badge tone="success">
						{ t( 'compatibility.noneTitle' ) }
					</Badge>
					<p className="ea24-mt-3 ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted">
						{ t( 'compatibility.noneBody' ) }
					</p>
					<p className="ea24-mt-2 ea24-text-xs ea24-text-ea24-faint">
						{ t( 'compatibility.cloudflareCdnNote' ) }
					</p>
				</div>
			) : (
				<div>
					<h3 className="ea24-mb-3 ea24-text-sm ea24-font-bold ea24-text-ea24-body">
						{ t( 'compatibility.detectedTitle' ) }
					</h3>
					<ul className="ea24-space-y-3">
						{ detected.map( ( plugin ) => (
							<li
								key={ plugin.slug }
								className="ea24-rounded-card ea24-bg-white ea24-p-5 ea24-shadow-card"
							>
								<div className="ea24-flex ea24-items-center ea24-gap-2.5">
									<span className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
										{ plugin.name }
									</span>
									<Badge tone="warning">
										{ t( 'checklist.status.warn' ) }
									</Badge>
								</div>
								<dl className="ea24-mt-3">
									<dt className="ea24-text-[11.5px] ea24-font-bold ea24-uppercase ea24-tracking-wide ea24-text-ea24-faint">
										{ t(
											'compatibility.recommendationLabel'
										) }
									</dt>
									<dd className="ea24-mt-1 ea24-text-sm ea24-leading-relaxed ea24-text-[#3a3e4d]">
										{ t(
											`compatibility.plugins.${ plugin.slug }.recommendation`
										) }
									</dd>
								</dl>
							</li>
						) ) }
					</ul>
					<p className="ea24-mt-3 ea24-text-xs ea24-text-ea24-faint">
						{ t( 'compatibility.cloudflareCdnNote' ) }
					</p>
				</div>
			) }
		</div>
	);
}
