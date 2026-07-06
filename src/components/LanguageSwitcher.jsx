/**
 * Language dropdown.
 *
 * Lives in the app header (applies to every tab). Default is English. Changing
 * it (a) switches the UI immediately via i18next — App re-renders on the
 * `languageChanged` event, no page reload — and (b) persists the choice per site
 * so it survives reloads and matches what PHP injects next time. Language names
 * are endonyms (with the English name in parentheses) and are intentionally not
 * translated.
 *
 * Presentationally this is a custom accessible combobox/listbox (WAI-ARIA
 * select-only combobox pattern) with a flag per row, replacing the native
 * `<select>`. The persistence + switch behavior is unchanged: selecting a
 * language still calls `changeLanguage()` then `saveSettings({ language })` — the
 * exact same path the old `<select>`'s onChange used.
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { t, i18next, LANGUAGES, changeLanguage } from '../i18n';
import { saveSettings } from '../api/settings';
import { flagFor, enNameFor } from '../i18n/flags';
import { Chevron, Globe, Check } from './Icons';

const LABEL_ID = 'ea24-language-label';
const LISTBOX_ID = 'ea24-language-listbox';
const optionId = ( code ) => `ea24-lang-opt-${ code }`;

/**
 * Small flag image (or a neutral globe when no flag is available).
 *
 * @param {Object} props      Component props.
 * @param {string} props.code Language code.
 * @return {JSX.Element} Flag or globe.
 */
function Flag( { code } ) {
	const url = flagFor( code );
	if ( ! url ) {
		return (
			<span className="ea24-flex ea24-h-[14px] ea24-w-5 ea24-flex-none ea24-items-center ea24-justify-center">
				<Globe size={ 14 } />
			</span>
		);
	}
	return (
		<img
			src={ url }
			alt=""
			className="ea24-h-[14px] ea24-w-5 ea24-flex-none ea24-rounded-[3px] ea24-object-cover"
		/>
	);
}

export default function LanguageSwitcher() {
	const [ value, setValue ] = useState( i18next.language || 'en' );
	const [ open, setOpen ] = useState( false );
	const [ activeIndex, setActiveIndex ] = useState( 0 );

	const rootRef = useRef( null );
	const buttonRef = useRef( null );
	const optionRefs = useRef( [] );
	const typeahead = useRef( { buffer: '', timer: 0 } );

	const selectedIndex = Math.max(
		0,
		LANGUAGES.findIndex( ( lang ) => lang.code === value )
	);

	// Persist + apply the chosen language — the SAME path the native <select> used.
	async function selectLanguage( next ) {
		setValue( next );

		// Apply immediately so the UI updates without waiting on the network.
		await changeLanguage( next );

		try {
			await saveSettings( { language: next } );
		} catch ( error ) {
			// Persistence is best-effort: the language has already switched for
			// this session. There is nothing actionable to show the user here.
		}
	}

	const closeAndFocus = useCallback( () => {
		setOpen( false );
		if ( buttonRef.current ) {
			buttonRef.current.focus();
		}
	}, [] );

	// Open with the current selection highlighted.
	function openMenu() {
		setActiveIndex( selectedIndex );
		setOpen( true );
	}

	function commit( index ) {
		const lang = LANGUAGES[ index ];
		if ( lang ) {
			selectLanguage( lang.code );
		}
		closeAndFocus();
	}

	// Type-ahead: jump to the next option whose endonym or English name starts
	// with the accumulated keystrokes.
	function onTypeahead( char ) {
		const buffer = typeahead.current.buffer + char.toLowerCase();
		typeahead.current.buffer = buffer;
		window.clearTimeout( typeahead.current.timer );
		typeahead.current.timer = window.setTimeout( () => {
			typeahead.current.buffer = '';
		}, 600 );

		const match = LANGUAGES.findIndex( ( lang ) => {
			const endonym = ( lang.label || '' ).toLowerCase();
			const english = enNameFor( lang.code ).toLowerCase();
			return endonym.startsWith( buffer ) || english.startsWith( buffer );
		} );
		if ( match >= 0 ) {
			setActiveIndex( match );
			if ( ! open ) {
				setOpen( true );
			}
		}
	}

	function onKeyDown( event ) {
		const last = LANGUAGES.length - 1;
		switch ( event.key ) {
			case 'ArrowDown':
				event.preventDefault();
				if ( ! open ) {
					openMenu();
				} else {
					setActiveIndex( ( i ) => Math.min( last, i + 1 ) );
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if ( ! open ) {
					openMenu();
				} else {
					setActiveIndex( ( i ) => Math.max( 0, i - 1 ) );
				}
				break;
			case 'Home':
				if ( open ) {
					event.preventDefault();
					setActiveIndex( 0 );
				}
				break;
			case 'End':
				if ( open ) {
					event.preventDefault();
					setActiveIndex( last );
				}
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if ( open ) {
					commit( activeIndex );
				} else {
					openMenu();
				}
				break;
			case 'Escape':
				if ( open ) {
					event.preventDefault();
					closeAndFocus();
				}
				break;
			case 'Tab':
				if ( open ) {
					setOpen( false );
				}
				break;
			default:
				// Single printable character → type-ahead.
				if (
					event.key.length === 1 &&
					! event.metaKey &&
					! event.ctrlKey &&
					! event.altKey
				) {
					onTypeahead( event.key );
				}
				break;
		}
	}

	// Close on outside click.
	useEffect( () => {
		if ( ! open ) {
			return undefined;
		}
		function onDocPointer( event ) {
			if (
				rootRef.current &&
				! rootRef.current.contains( event.target )
			) {
				setOpen( false );
			}
		}
		document.addEventListener( 'mousedown', onDocPointer );
		return () => document.removeEventListener( 'mousedown', onDocPointer );
	}, [ open ] );

	// Keep the active option scrolled into view while navigating.
	useEffect( () => {
		if ( open && optionRefs.current[ activeIndex ] ) {
			optionRefs.current[ activeIndex ].scrollIntoView( {
				block: 'nearest',
			} );
		}
	}, [ open, activeIndex ] );

	const current = LANGUAGES[ selectedIndex ] || LANGUAGES[ 0 ];

	return (
		<div
			ref={ rootRef }
			className="ea24-relative ea24-flex ea24-items-center ea24-gap-2 ea24-text-sm ea24-font-medium ea24-text-white/90"
		>
			<span id={ LABEL_ID } className="ea24-sr-only sm:ea24-not-sr-only">
				{ t( 'settings.languageLabel' ) }
			</span>
			<button
				ref={ buttonRef }
				type="button"
				id="ea24-language-select"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={ open }
				aria-controls={ LISTBOX_ID }
				aria-labelledby={ `${ LABEL_ID } ea24-language-select` }
				aria-activedescendant={
					open
						? optionId( LANGUAGES[ activeIndex ]?.code )
						: undefined
				}
				onClick={ () => ( open ? setOpen( false ) : openMenu() ) }
				onKeyDown={ onKeyDown }
				className="ea24-inline-flex ea24-items-center ea24-gap-2 ea24-rounded-menu ea24-border ea24-border-solid ea24-border-white/30 ea24-bg-white/[0.16] ea24-py-1.5 ea24-pl-2.5 ea24-pr-2 ea24-text-sm ea24-font-medium ea24-text-white ea24-transition hover:ea24-bg-white/25 focus:ea24-outline-none"
			>
				<Flag code={ current.code } />
				<span>{ current.label }</span>
				<Chevron size={ 15 } color="currentColor" aria-hidden="true" />
			</button>

			{ open && (
				<ul
					id={ LISTBOX_ID }
					role="listbox"
					aria-labelledby={ LABEL_ID }
					tabIndex={ -1 }
					className="ea24-absolute ea24-right-0 ea24-top-full ea24-z-30 ea24-mt-2 ea24-max-h-[320px] ea24-w-[288px] ea24-overflow-auto ea24-rounded-menu ea24-border ea24-border-ea24-card-border ea24-bg-white ea24-p-1.5 ea24-shadow-menu"
				>
					{ LANGUAGES.map( ( lang, index ) => {
						const isSelected = lang.code === value;
						const isActive = index === activeIndex;
						return (
							// Listbox options are not individually focusable; all
							// keyboard interaction is handled on the combobox button
							// via aria-activedescendant (WAI-ARIA listbox pattern),
							// so a per-option key handler would be redundant.
							// eslint-disable-next-line jsx-a11y/click-events-have-key-events
							<li
								key={ lang.code }
								id={ optionId( lang.code ) }
								ref={ ( node ) => {
									optionRefs.current[ index ] = node;
								} }
								role="option"
								aria-selected={ isSelected }
								onClick={ () => commit( index ) }
								onMouseEnter={ () => setActiveIndex( index ) }
								className={ `ea24-flex ea24-cursor-pointer ea24-items-center ea24-gap-2.5 ea24-rounded-row ea24-px-2.5 ea24-py-2 ea24-text-sm ${
									isActive
										? 'ea24-bg-[rgba(93,41,215,.06)]'
										: ''
								} ${
									isSelected
										? 'ea24-text-ea24-brand'
										: 'ea24-text-ea24-body'
								}` }
							>
								<Flag code={ lang.code } />
								<span className="ea24-flex-1 ea24-truncate">
									<span className="ea24-font-semibold">
										{ lang.label }
									</span>{ ' ' }
									<span className="ea24-font-normal ea24-text-ea24-muted">
										({ enNameFor( lang.code ) })
									</span>
								</span>
								{ isSelected && (
									<Check
										size={ 15 }
										color="#5D29D7"
										strokeWidth={ 2.6 }
									/>
								) }
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}
