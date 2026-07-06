/**
 * Badge — a small status pill. `tone` maps to brand tokens so the color system
 * stays centralized in tailwind.config.js. Each tone also carries a small icon
 * so status is never conveyed by color alone.
 */
import { Check, Warn, Info } from './Icons';

const TONES = {
	neutral:
		'ea24-bg-ea24-neutral-bg ea24-text-ea24-neutral-text ea24-border-ea24-info-border',
	success:
		'ea24-bg-ea24-success-bg ea24-text-ea24-success-text ea24-border-ea24-success-border',
	warning:
		'ea24-bg-ea24-warning-bg ea24-text-ea24-warning-text ea24-border-ea24-warning-border',
	danger: 'ea24-bg-ea24-danger-bg ea24-text-ea24-danger-text ea24-border-ea24-danger-border',
};

const ICONS = {
	neutral: <Info size={ 13 } color="#525a66" />,
	success: <Check size={ 13 } color="#27AE60" strokeWidth={ 3.2 } />,
	warning: <Warn size={ 13 } color="#D98A12" strokeWidth={ 2.2 } />,
	danger: <Warn size={ 13 } color="#B42318" strokeWidth={ 2.2 } />,
};

/**
 * @param {Object}                                 props
 * @param {'neutral'|'success'|'warning'|'danger'} [props.tone]   Color tone.
 * @param {*}                                      props.children Badge label.
 */
export default function Badge( { tone = 'neutral', children } ) {
	return (
		<span
			className={ `ea24-inline-flex ea24-items-center ea24-gap-1.5 ea24-rounded-full ea24-border ea24-px-2.5 ea24-py-0.5 ea24-text-xs ea24-font-semibold ${
				TONES[ tone ] || TONES.neutral
			}` }
		>
			<span
				aria-hidden="true"
				className="ea24-inline-flex ea24-flex-none"
			>
				{ ICONS[ tone ] || ICONS.neutral }
			</span>
			{ children }
		</span>
	);
}
