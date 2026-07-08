/**
 * Help / FAQ — short, static, translated entries.
 *
 * Each entry is a custom animated disclosure (a real <button aria-expanded>
 * trigger + an associated panel), replacing native <details>/<summary> so the
 * expand/collapse can be smoothly height-animated. The entry list (ids) lives
 * in src/faq/entries.js; the copy lives in i18n under faq.items.<id>.
 */
import { useState } from '@wordpress/element';
import { t } from '../i18n';
import { Chevron } from '../components/Icons';
import FAQ_ENTRIES from '../faq/entries';

export default function Faq() {
	return (
		<div>
			<header className="ea24-mb-6">
				<h2 className="ea24-text-2xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
					{ t( 'faq.title' ) }
				</h2>
				<p className="ea24-mt-1.5 ea24-max-w-[640px] ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted-2">
					{ t( 'faq.intro' ) }
				</p>
			</header>

			<div className="ea24-space-y-3">
				{ FAQ_ENTRIES.map( ( entry ) => (
					<FaqItem key={ entry.id } entry={ entry } />
				) ) }
			</div>
		</div>
	);
}

/**
 * A single animated FAQ disclosure. Kept independent per entry so multiple
 * items can be open at once, matching the previous native <details> behavior.
 *
 * @param {Object} props
 * @param {Object} props.entry FAQ entry ({ id }).
 */
function FaqItem( { entry } ) {
	const [ open, setOpen ] = useState( false );
	const buttonId = `ea24-faq-btn-${ entry.id }`;
	const panelId = `ea24-faq-panel-${ entry.id }`;

	return (
		<div className="ea24-rounded-card ea24-bg-white ea24-shadow-card">
			<h3>
				<button
					type="button"
					id={ buttonId }
					aria-expanded={ open }
					aria-controls={ panelId }
					onClick={ () => setOpen( ( previous ) => ! previous ) }
					className="ea24-flex ea24-w-full ea24-items-center ea24-justify-between ea24-gap-3 ea24-p-5 ea24-text-left ea24-text-sm ea24-font-bold ea24-text-ea24-body"
				>
					<span>{ t( `faq.items.${ entry.id }.q` ) }</span>
					<span
						aria-hidden="true"
						className={ `ea24-flex-none ea24-text-ea24-muted ea24-transition-transform ea24-duration-200 ${
							open ? 'ea24-rotate-0' : 'ea24-rotate-[-90deg]'
						}` }
					>
						<Chevron size={ 16 } />
					</span>
				</button>
			</h3>
			<div
				id={ panelId }
				aria-labelledby={ buttonId }
				aria-hidden={ ! open }
				className={ `ea24-grid ea24-transition-[grid-template-rows] ea24-duration-200 ea24-ease-out ${
					open ? 'ea24-grid-rows-[1fr]' : 'ea24-grid-rows-[0fr]'
				}` }
			>
				<div className="ea24-min-h-0 ea24-overflow-hidden">
					<div className="ea24-px-5 ea24-pb-5">
						<p className="ea24-text-sm ea24-leading-relaxed ea24-text-[#3a3e4d]">
							{ t( `faq.items.${ entry.id }.a` ) }
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
