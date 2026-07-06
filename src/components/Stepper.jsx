/**
 * Stepper — purely visual progress indicator. It owns no flow logic; the parent
 * passes the ordered steps and the current index. Progress is conveyed to
 * assistive tech via ordered-list semantics, `aria-current="step"`, and a
 * visually-hidden state word per step (not by color alone).
 */
import { t } from '../i18n';
import { Check } from './Icons';

/**
 * @param {Object}                              props
 * @param {Array<{key: string, label: string}>} props.steps   Ordered steps.
 * @param {number}                              props.current Index of the active step.
 */
export default function Stepper( { steps, current } ) {
	return (
		<ol
			className="ea24-flex ea24-items-start"
			aria-label={ t( 'stepper.aria' ) }
		>
			{ steps.map( ( step, index ) => {
				const state = stepState( index, current );
				const first = index === 0;

				return (
					<li
						key={ step.key }
						className={ `ea24-flex ea24-items-start ${
							first ? 'ea24-flex-none' : 'ea24-flex-1'
						}` }
						aria-current={
							state === 'current' ? 'step' : undefined
						}
					>
						{ ! first && (
							<span
								aria-hidden="true"
								className={ `ea24-mt-[17px] ea24-h-[3px] ea24-flex-1 ea24-rounded ${
									index <= current
										? 'ea24-bg-brand-gradient'
										: 'ea24-bg-ea24-card-border'
								}` }
							/>
						) }
						<div className="ea24-flex ea24-w-24 ea24-flex-none ea24-flex-col ea24-items-center ea24-gap-2">
							<span
								aria-hidden="true"
								className={ `ea24-flex ea24-h-9 ea24-w-9 ea24-items-center ea24-justify-center ea24-rounded-full ea24-text-sm ea24-font-bold ${ circleClasses(
									state
								) }` }
							>
								{ state === 'done' ? (
									<Check
										size={ 18 }
										color="#fff"
										strokeWidth={ 3 }
									/>
								) : (
									index + 1
								) }
							</span>
							<span className={ labelClasses( state ) }>
								{ step.label }
								<span className="ea24-sr-only">
									{ ' ' }
									({ t( `stepper.state.${ state }` ) })
								</span>
							</span>
						</div>
					</li>
				);
			} ) }
		</ol>
	);
}

/**
 * Classify a step relative to the active index.
 *
 * @param {number} index   Step index.
 * @param {number} current Active step index.
 * @return {'done'|'current'|'upcoming'} The step's state.
 */
function stepState( index, current ) {
	if ( index < current ) {
		return 'done';
	}
	if ( index === current ) {
		return 'current';
	}
	return 'upcoming';
}

/**
 * Circle badge classes per step state.
 *
 * @param {string} state 'done' | 'current' | 'upcoming'.
 * @return {string} Tailwind classes.
 */
function circleClasses( state ) {
	if ( state === 'done' ) {
		return 'ea24-bg-brand-gradient ea24-text-white ea24-shadow-chip';
	}
	if ( state === 'current' ) {
		return 'ea24-bg-white ea24-text-ea24-brand ea24-border-[2.5px] ea24-border-ea24-brand';
	}
	return 'ea24-bg-[#F0EEF8] ea24-text-[#a9adba] ea24-border-2 ea24-border-ea24-card-border';
}

/**
 * Label text classes per step state.
 *
 * @param {string} state 'done' | 'current' | 'upcoming'.
 * @return {string} Tailwind classes.
 */
function labelClasses( state ) {
	if ( state === 'upcoming' ) {
		return 'ea24-text-center ea24-text-xs ea24-text-[#9aa0ad]';
	}
	return 'ea24-text-center ea24-text-xs ea24-font-semibold ea24-text-ea24-body';
}
