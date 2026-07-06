/**
 * Checklist — the transparency list of what the Health Check observed.
 *
 * Status is conveyed by an icon chip AND a visible status badge (never by color
 * alone). Rows come from the pure diagnostics mapper; labels via `t()`.
 */
import { t } from '../i18n';
import Badge from './Badge';

const ICONS = {
	pass: '✓',
	fail: '✕',
	warn: '!',
	info: 'i',
	na: '–',
};

const CHIP_TONES = {
	pass: 'ea24-bg-ea24-success-bg ea24-text-ea24-success-text',
	fail: 'ea24-bg-ea24-danger-bg ea24-text-ea24-danger-text',
	warn: 'ea24-bg-ea24-warning-bg ea24-text-ea24-warning-text',
	info: 'ea24-bg-ea24-neutral-bg ea24-text-ea24-neutral-text',
	na: 'ea24-bg-ea24-neutral-bg ea24-text-ea24-neutral-text',
};

const BADGE_TONES = {
	pass: 'success',
	fail: 'danger',
	warn: 'warning',
	info: 'neutral',
	na: 'neutral',
};

/**
 * @param {Object}                               props
 * @param {Array<{key: string, status: string}>} props.items Checklist rows.
 */
export default function Checklist( { items } ) {
	return (
		<ul className="ea24-mt-2">
			{ items.map( ( item ) => (
				<li
					key={ item.key }
					className="ea24-flex ea24-items-center ea24-justify-between ea24-gap-4 ea24-border-b ea24-border-ea24-divider ea24-py-3 last:ea24-border-0"
				>
					<span className="ea24-flex ea24-items-center ea24-gap-3">
						<span
							aria-hidden="true"
							className={ `ea24-flex ea24-h-5 ea24-w-5 ea24-flex-none ea24-items-center ea24-justify-center ea24-rounded-full ea24-text-xs ea24-font-bold ${
								CHIP_TONES[ item.status ] || CHIP_TONES.na
							}` }
						>
							{ ICONS[ item.status ] || ICONS.na }
						</span>
						<span className="ea24-text-sm ea24-text-ea24-body">
							{ t( `checklist.${ item.key }` ) }
						</span>
					</span>
					<Badge tone={ BADGE_TONES[ item.status ] || 'neutral' }>
						{ t( `checklist.status.${ item.status }` ) }
					</Badge>
				</li>
			) ) }
		</ul>
	);
}
