/**
 * Plugin footer.
 *
 * Presentational only: brand mark, attribution, plugin version, copyright, and a
 * couple of outbound links. The version string is read read-only from the
 * bootstrap data PHP already localizes (`window.easeAccess24Data.version`) — no
 * new logic and no PHP change. All copy goes through `t()`.
 */
import { t } from '../i18n';
import iconLogo from '../assets/logo-eye.svg?url';

const PLATFORM_URL = 'https://app.easeaccess24.com';

/**
 * Read the plugin version from the localized bootstrap data (read-only).
 *
 * @return {string} Version string, or empty when unavailable (dev/tests).
 */
function pluginVersion() {
	const data =
		( typeof window !== 'undefined' && window.easeAccess24Data ) || {};
	return data.version || '';
}

export default function Footer() {
	const version = pluginVersion();
	const year = new Date().getFullYear();

	return (
		<footer className="ea24-mt-8 ea24-rounded-card ea24-bg-white ea24-px-6 ea24-py-[18px] ea24-text-sm ea24-text-ea24-muted ea24-shadow-card">
			<div className="ea24-mb-3 ea24-border-b ea24-border-solid ea24-border-ea24-divider ea24-pb-3">
				<p className="ea24-text-ea24-muted">
					{ t( 'footer.tagline' ) }
				</p>
			</div>
			<div className="ea24-flex ea24-flex-wrap ea24-items-center ea24-justify-between ea24-gap-4">
				<div className="ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-x-3 ea24-gap-y-1">
					<img
						src={ iconLogo }
						alt=""
						className="ea24-h-[22px] ea24-w-auto"
					/>
					<span className="ea24-font-medium ea24-text-ea24-body">
						{ t( 'footer.madeBy' ) }
					</span>
					{ version && (
						<span className="ea24-rounded-chip ea24-bg-ea24-page ea24-px-2 ea24-py-0.5 ea24-font-mono ea24-text-xs ea24-text-ea24-muted">
							v{ version }
						</span>
					) }
					<span className="ea24-text-ea24-faint">
						{ t( 'footer.copyright', { year } ) }
					</span>
				</div>
				<div className="ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-x-5 ea24-gap-y-1 ea24-font-medium">
					<a
						href={ PLATFORM_URL }
						target="_blank"
						rel="noopener noreferrer"
						className="ea24-text-ea24-brand hover:ea24-underline"
					>
						{ t( 'footer.platform' ) }
					</a>
					<a
						href="https://www.easeaccess24.com/contact-us/"
						target="_blank"
						rel="noopener noreferrer"
						className="ea24-text-ea24-brand hover:ea24-underline"
					>
						{ t( 'footer.docs' ) }
					</a>
					{ /* Privacy Policy and issue-reporting (contact) links on
					     easeaccess24.com. */ }
					<a
						href="https://www.easeaccess24.com/privacy-policy/"
						target="_blank"
						rel="noopener noreferrer"
						className="ea24-text-ea24-brand hover:ea24-underline"
					>
						{ t( 'footer.privacyLink' ) }
					</a>
					<a
						href="https://www.easeaccess24.com/contact-us/"
						target="_blank"
						rel="noopener noreferrer"
						className="ea24-text-ea24-brand hover:ea24-underline"
					>
						{ t( 'footer.reportIssueLink' ) }
					</a>
				</div>
			</div>
		</footer>
	);
}
