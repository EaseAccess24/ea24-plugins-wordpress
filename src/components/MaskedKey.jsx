/**
 * MaskedKey — shows the Widget Key masked (last few characters visible) with a
 * reveal toggle and a copy button.
 *
 * The Widget Key is a public identifier, not a secret; masking here is purely
 * for polish and design consistency, so revealing it is a plain toggle with no
 * confirmation.
 */
import { useState } from '@wordpress/element';
import { t } from '../i18n';
import { copyToClipboard } from '../utils/clipboard';
import { Eye, EyeOff, Copy, Check } from './Icons';

const VISIBLE_CHARS = 4;

/**
 * Build a masked representation keeping the last few characters.
 *
 * @param {string} key The Widget Key.
 * @return {string} Masked string.
 */
function mask( key ) {
	if ( ! key ) {
		return '';
	}
	if ( key.length <= VISIBLE_CHARS ) {
		return key;
	}
	const hidden = '•'.repeat( Math.max( 4, key.length - VISIBLE_CHARS ) );
	return hidden + key.slice( -VISIBLE_CHARS );
}

// Small brand-outline button shared by the Reveal/Copy buttons here and the
// relocated "Update key" button in Dashboard.jsx. `ea24-border-solid` is
// required, not decorative: with Tailwind's preflight disabled (see
// tailwind.config.js), a plain `ea24-border` utility only sets border-width —
// nothing in this app's build sets border-style, so a bare <button> keeps the
// browser's UA default `border-style: outset` (the same bug Phase 11a hit and
// fixed on the tab buttons). Focus ring comes from the global :focus-visible
// rule in admin.css.
export const SMALL_OUTLINE_BUTTON =
	'ea24-inline-flex ea24-h-8 ea24-items-center ea24-gap-1.5 ea24-rounded-chip ea24-border ea24-border-solid ea24-border-ea24-brand/35 ea24-px-3 ea24-text-xs ea24-font-medium ea24-text-ea24-brand ea24-transition hover:ea24-bg-[rgba(93,41,215,.06)] active:ea24-brightness-95 focus:ea24-outline-none';

/**
 * @param {Object} props
 * @param {string} props.value The Widget Key to display.
 */
export default function MaskedKey( { value } ) {
	const [ revealed, setRevealed ] = useState( false );
	const [ copied, setCopied ] = useState( false );

	async function copy() {
		const ok = await copyToClipboard( value );
		// Clipboard API unavailable (e.g. insecure context)? The key is still
		// readable via the reveal toggle, so fail silently.
		if ( ok ) {
			setCopied( true );
			// Reset the transient confirmation so the button returns to "Copy".
			window.setTimeout( () => setCopied( false ), 2000 );
		}
	}

	return (
		<div className="ea24-flex ea24-flex-wrap ea24-items-center ea24-gap-2">
			<code className="ea24-rounded-chip ea24-border ea24-border-ea24-card-border ea24-bg-ea24-page ea24-px-2.5 ea24-py-1 ea24-font-mono ea24-text-sm ea24-font-medium ea24-text-ea24-body">
				{ revealed ? value : mask( value ) }
			</code>
			<button
				type="button"
				onClick={ () => setRevealed( ( previous ) => ! previous ) }
				aria-pressed={ revealed }
				className={ SMALL_OUTLINE_BUTTON }
			>
				{ revealed ? <EyeOff size={ 14 } /> : <Eye size={ 14 } /> }
				{ revealed
					? t( 'onboarding.hideKey' )
					: t( 'onboarding.revealKey' ) }
			</button>
			<button
				type="button"
				onClick={ copy }
				className={ SMALL_OUTLINE_BUTTON }
			>
				{ copied ? (
					<Check size={ 14 } color="#5D29D7" strokeWidth={ 2.6 } />
				) : (
					<Copy size={ 14 } />
				) }
				{ copied
					? t( 'onboarding.copied' )
					: t( 'onboarding.copyKey' ) }
			</button>
		</div>
	);
}
