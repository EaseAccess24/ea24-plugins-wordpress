/**
 * Button — the approved primary (gradient) and secondary (outline) actions.
 *
 * A real <button> so keyboard and screen-reader behavior come for free. Both
 * variants carry a visible focus ring; the busy state disables the control and
 * exposes `aria-busy` for assistive tech.
 */

const BASE =
	'ea24-inline-flex ea24-items-center ea24-justify-center ea24-gap-2 ea24-rounded-btn ea24-text-sm ea24-font-semibold ea24-transition disabled:ea24-opacity-60 disabled:ea24-cursor-not-allowed';

// Consistent button heights/padding across the plugin: small chips, the standard
// action, and taller call-to-action buttons.
const SIZES = {
	sm: 'ea24-h-[34px] ea24-px-4',
	md: 'ea24-h-11 ea24-px-5',
	lg: 'ea24-h-12 ea24-px-[22px]',
};

const VARIANTS = {
	primary:
		'ea24-gradbtn ea24-text-white ea24-bg-brand-gradient ea24-shadow-btn hover:ea24-brightness-[1.06] active:ea24-brightness-95',
	secondary:
		'ea24-text-ea24-brand ea24-bg-white ea24-border-[1.5px] ea24-border-solid ea24-border-ea24-brand hover:ea24-bg-ea24-surface active:ea24-brightness-95',
};

// In-button working spinner (border spinner, `ea-spin`), tinted per variant.
const SPINNER = {
	primary: 'ea24-border-white/40 ea24-border-t-white',
	secondary: 'ea24-border-ea24-brand/30 ea24-border-t-ea24-brand',
};

/**
 * @param {Object}                props
 * @param {'primary'|'secondary'} [props.variant]   Visual style.
 * @param {'sm'|'md'|'lg'}        [props.size]      Height/padding scale.
 * @param {'button'|'submit'}     [props.type]      Native button type.
 * @param {boolean}               [props.busy]      Shows a working state and disables the button.
 * @param {boolean}               [props.disabled]  Disables the button.
 * @param {string}                [props.className] Extra classes appended to the button.
 * @param {Function}              [props.onClick]   Click handler.
 * @param {*}                     props.children    Button label.
 */
export default function Button( {
	variant = 'primary',
	size = 'md',
	type = 'button',
	busy = false,
	disabled = false,
	className = '',
	children,
	...rest
} ) {
	return (
		<button
			// eslint-disable-next-line react/button-has-type
			type={ type }
			disabled={ disabled || busy }
			aria-busy={ busy || undefined }
			className={ `${ BASE } ${ SIZES[ size ] || SIZES.md } ${
				VARIANTS[ variant ] || VARIANTS.primary
			} ${ className }` }
			{ ...rest }
		>
			{ busy && (
				<span
					aria-hidden="true"
					className={ `ea24-h-4 ea24-w-4 ea24-flex-none ea24-animate-ea-spin ea24-rounded-full ea24-border-2 ${
						SPINNER[ variant ] || SPINNER.primary
					}` }
				/>
			) }
			{ children }
		</button>
	);
}
