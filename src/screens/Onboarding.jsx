/**
 * Onboarding / Connect screen (app container).
 *
 * The plugin's front door: paste a Widget Key (or full script snippet), save it
 * via the same-origin REST endpoint, and land in the connected Dashboard. The
 * plugin validates nothing and makes no external calls — the server extracts and
 * sanitizes the key, and the SDK/platform handle real validation at load time.
 *
 * The stepper is honest (plan A1): saving advances to "Health Check"; only a
 * passing on-demand Health Check (backend_status === OK) reaches "Done".
 */
import { useState } from '@wordpress/element';
import { t } from '../i18n';
import { saveConnection } from '../api/connection';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import TextField from '../components/TextField';
import { Link, Help, Check } from '../components/Icons';
import Dashboard from './Dashboard';

// Both CTAs point at the platform app; the exact deep link can change in en.js.
const APP_URL = 'https://app.easeaccess24.com';

// Stepper indices, derived from state (never manually incremented). "Done"
// (index 3) is reached only by a passing Health Check, not by saving the key.
const STEP_PASTE = 0;
const STEP_VALIDATE = 1;
const STEP_HEALTH_CHECK = 2;
const STEP_DONE = 3;

/**
 * Map the current flow state to a stepper index.
 *
 * @param {Object}  state             Flow state.
 * @param {boolean} state.isConnected A Widget Key is saved and not being edited.
 * @param {boolean} state.saving      A save request is in flight.
 * @param {boolean} state.healthOk    The last Health Check passed (OK).
 * @return {number} The active stepper index.
 */
function deriveStep( { isConnected, saving, healthOk } ) {
	if ( isConnected ) {
		return healthOk ? STEP_DONE : STEP_HEALTH_CHECK;
	}
	if ( saving ) {
		return STEP_VALIDATE;
	}
	return STEP_PASTE;
}

export default function Onboarding() {
	const bootstrap =
		( typeof window !== 'undefined' &&
			window.easeAccess24Data &&
			window.easeAccess24Data.settings ) ||
		{};

	const [ connection, setConnection ] = useState( bootstrap );
	const [ rawInput, setRawInput ] = useState( '' );
	const [ status, setStatus ] = useState( 'idle' ); // 'idle' | 'saving'
	const [ error, setError ] = useState( '' );
	const [ editing, setEditing ] = useState( false );

	const savedKey =
		connection && connection.widget_key ? connection.widget_key : '';
	const isConnected = Boolean( savedKey ) && ! editing;
	const isFirstRun = ! savedKey && ! editing;

	const currentStep = deriveStep( {
		isConnected,
		saving: status === 'saving',
		healthOk: connection.backend_status === 'OK',
	} );

	const steps = [
		{ key: 'paste', label: t( 'stepper.paste' ) },
		{ key: 'validate', label: t( 'stepper.validate' ) },
		{ key: 'healthCheck', label: t( 'stepper.healthCheck' ) },
		{ key: 'done', label: t( 'stepper.done' ) },
	];

	async function handleConnect() {
		if ( ! rawInput.trim() ) {
			setError( t( 'onboarding.errors.empty' ) );
			return;
		}

		setStatus( 'saving' );
		setError( '' );

		try {
			const result = await saveConnection( rawInput );

			// The server returns an empty key when the snippet had none to extract.
			if ( ! result || ! result.widget_key ) {
				setStatus( 'idle' );
				setError( t( 'onboarding.errors.noKey' ) );
				return;
			}

			setConnection( result );
			setRawInput( '' );
			setEditing( false );
			setStatus( 'idle' );
		} catch ( requestError ) {
			setStatus( 'idle' );
			setError( t( 'onboarding.errors.network' ) );
		}
	}

	function handleUpdate() {
		setEditing( true );
		setError( '' );
	}

	function handleCancelEdit() {
		setEditing( false );
		setRawInput( '' );
		setError( '' );
	}

	// Connected: the design's Dashboard state has no stepper/onboarding header —
	// just the status banner + summary/health. (Presentational routing on the
	// existing `isConnected` gate; no flow logic changes.)
	if ( isConnected ) {
		return (
			<Dashboard
				connection={ connection }
				onUpdate={ handleUpdate }
				onConnectionChange={ setConnection }
			/>
		);
	}

	// Not connected: the centered onboarding — honest stepper + connect card.
	return (
		<div className="ea24-mx-auto ea24-max-w-[620px]">
			<div className="ea24-mb-7 ea24-mt-2">
				<Stepper steps={ steps } current={ currentStep } />
			</div>

			{ /* Announce transient status/errors to assistive tech. */ }
			<div aria-live="polite" className="ea24-sr-only">
				{ status === 'saving' ? t( 'common.saving' ) : error }
			</div>

			<section className="ea24-rounded-card-lg ea24-bg-white ea24-p-8 ea24-shadow-card-lg">
				<div className="ea24-mb-2 ea24-flex ea24-items-center ea24-gap-3">
					<span className="ea24-flex ea24-h-11 ea24-w-11 ea24-flex-none ea24-items-center ea24-justify-center ea24-rounded-[12px] ea24-bg-brand-gradient ea24-shadow-chip">
						<Link size={ 23 } color="#fff" />
					</span>
					<h1 className="ea24-text-xl ea24-font-bold ea24-tracking-tight ea24-text-ea24-body">
						{ t( 'onboarding.title' ) }
					</h1>
				</div>
				<p className="ea24-mb-6 ea24-ml-14 ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted">
					{ t( 'onboarding.subtitle' ) }
				</p>

				<ConnectForm
					firstRun={ isFirstRun }
					rawInput={ rawInput }
					onChange={ ( value ) => {
						setRawInput( value );
						if ( error ) {
							setError( '' );
						}
					} }
					onConnect={ handleConnect }
					onCancel={ savedKey ? handleCancelEdit : null }
					busy={ status === 'saving' }
					error={ error }
				/>
			</section>
		</div>
	);
}

/**
 * The paste + connect form, including the first-run "get a key" callout.
 *
 * @param {Object}        props
 * @param {boolean}       props.firstRun  Show the first-run "get a key" callout.
 * @param {string}        props.rawInput  Current textarea value.
 * @param {Function}      props.onChange  Receives the new textarea value.
 * @param {Function}      props.onConnect Save handler.
 * @param {Function|null} props.onCancel  Cancel-edit handler, or null to hide it.
 * @param {boolean}       props.busy      A save request is in flight.
 * @param {string}        props.error     Error copy, if any.
 */
function ConnectForm( {
	firstRun,
	rawInput,
	onChange,
	onConnect,
	onCancel,
	busy,
	error,
} ) {
	return (
		<div>
			{ firstRun && (
				<div className="ea24-mb-6 ea24-rounded-card ea24-border ea24-border-ea24-banner-border ea24-bg-ea24-surface ea24-p-4">
					<h2 className="ea24-text-base ea24-font-bold ea24-text-ea24-body">
						{ t( 'onboarding.emptyTitle' ) }
					</h2>
					<p className="ea24-mt-1 ea24-text-sm ea24-leading-relaxed ea24-text-ea24-muted">
						{ t( 'onboarding.emptyBody' ) }
					</p>
					<a
						href={ APP_URL }
						target="_blank"
						rel="noopener noreferrer"
						className="ea24-gradbtn ea24-mt-3 ea24-inline-flex ea24-h-11 ea24-items-center ea24-gap-2 ea24-rounded-btn ea24-bg-brand-gradient ea24-px-5 ea24-text-sm ea24-font-semibold ea24-text-white ea24-shadow-btn hover:ea24-brightness-[1.06]"
					>
						{ t( 'onboarding.getKeyCta' ) }
					</a>
				</div>
			) }

			<TextField
				id="ea24-widget-key"
				label={ t( 'onboarding.fieldLabel' ) }
				helpText={ t( 'onboarding.helper' ) }
				error={ error }
				value={ rawInput }
				onChange={ onChange }
				placeholder={ t( 'onboarding.placeholder' ) }
			/>

			<div className="ea24-mt-3">
				<a
					href={ APP_URL }
					target="_blank"
					rel="noopener noreferrer"
					className="ea24-inline-flex ea24-items-center ea24-gap-1.5 ea24-rounded ea24-text-sm ea24-font-semibold ea24-text-ea24-accent hover:ea24-underline"
				>
					<Help size={ 14 } color="#A73BEA" />
					{ t( 'onboarding.whereLink' ) }
				</a>
			</div>

			<Button
				variant="primary"
				busy={ busy }
				onClick={ onConnect }
				className="ea24-mt-6 ea24-h-[52px] ea24-w-full ea24-text-base ea24-font-bold"
			>
				{ ! busy && (
					<Check size={ 18 } color="#fff" strokeWidth={ 2.4 } />
				) }
				{ busy ? t( 'common.saving' ) : t( 'onboarding.connectCta' ) }
			</Button>
			{ onCancel && (
				<Button
					variant="secondary"
					disabled={ busy }
					onClick={ onCancel }
					className="ea24-mt-3 ea24-w-full"
				>
					{ t( 'common.cancel' ) }
				</Button>
			) }
		</div>
	);
}
