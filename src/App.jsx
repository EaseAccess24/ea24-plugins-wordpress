/**
 * Admin app root.
 *
 * Hosts the plugin's sections in an accessible tab interface (no router — the
 * app deliberately avoids dependencies; even React comes from WordPress). The
 * Connection tab keeps the existing Onboarding → Dashboard flow; the other tabs
 * are the Phase 05 surfaces. Tabs follow the WAI-ARIA tabs pattern: roving
 * tabindex, arrow/Home/End navigation, and automatic activation.
 */
import {
	useState,
	useRef,
	useReducer,
	useEffect,
	useLayoutEffect,
} from '@wordpress/element';
import { t, i18next, dirFor } from './i18n';
import LanguageSwitcher from './components/LanguageSwitcher';
import StatusPill from './components/StatusPill';
import Footer from './components/Footer';
import iconLogo from './assets/EA24_Icon_Logo.png';
import Onboarding from './screens/Onboarding';
import Compatibility from './screens/Compatibility';
import Activity from './screens/Activity';
import Support from './screens/Support';
import Faq from './screens/Faq';

const TABS = [
	{ key: 'connection', labelKey: 'nav.connection', Component: Onboarding },
	{
		key: 'compatibility',
		labelKey: 'nav.compatibility',
		Component: Compatibility,
	},
	{ key: 'activity', labelKey: 'nav.activity', Component: Activity },
	{ key: 'support', labelKey: 'nav.support', Component: Support },
	{ key: 'help', labelKey: 'nav.help', Component: Faq },
];

// Underlined tabs on a shared baseline. The active tab is brand-purple text
// plus a sliding gradient indicator bar (measured via refs, see
// useLayoutEffect below); focus rings come from the global :focus-visible
// rule in admin.css.
const TAB_BASE =
	'ea24-whitespace-nowrap ea24-border-0 ea24-bg-transparent ea24-px-0.5 ea24-py-3.5 ea24-text-sm ea24-transition-colors focus:ea24-outline-none';
const TAB_ACTIVE = 'ea24-font-semibold ea24-text-ea24-brand';
const TAB_INACTIVE =
	'ea24-font-medium ea24-text-ea24-muted hover:ea24-text-ea24-body';

export default function App() {
	const [ active, setActive ] = useState( 0 );
	const tabRefs = useRef( [] );
	const tablistRef = useRef( null );
	const [ indicator, setIndicator ] = useState( null );

	// `t` is a plain function, not a hook, so a language change does not re-render
	// on its own. Subscribe to i18next and force a re-render of the whole tree;
	// every child re-resolves its `t()` calls with the new language. State (active
	// tab, typed key, health results) is preserved because we do not remount.
	const [ , forceRender ] = useReducer( ( n ) => n + 1, 0 );
	useEffect( () => {
		i18next.on( 'languageChanged', forceRender );
		return () => i18next.off( 'languageChanged', forceRender );
	}, [] );

	// Scope text direction to our app so RTL languages (e.g. Arabic, Persian)
	// lay out correctly without touching the surrounding wp-admin chrome. Updates
	// instantly on a language switch because App re-renders on `languageChanged`.
	const dir = dirFor( i18next.language );

	// Slide the indicator bar under the active tab. Measured with
	// getBoundingClientRect() deltas from the tablist's own edge (not raw
	// offsetLeft) so the result is already "distance from the reading-direction
	// start edge" — applied via the logical `insetInlineStart` CSS property, it
	// mirrors correctly under RTL with no sign-flipping needed. Recalculated on
	// tab change, language change (labels can change width), and window resize.
	useLayoutEffect( () => {
		function measure() {
			const node = tabRefs.current[ active ];
			const container = tablistRef.current;
			if ( ! node || ! container ) {
				return;
			}
			const nodeRect = node.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			setIndicator( {
				insetInlineStart:
					dir === 'rtl'
						? containerRect.right - nodeRect.right
						: nodeRect.left - containerRect.left,
				width: nodeRect.width,
			} );
		}
		measure();
		window.addEventListener( 'resize', measure );
		return () => window.removeEventListener( 'resize', measure );
	}, [ active, dir ] );

	function focusTab( index ) {
		setActive( index );
		const node = tabRefs.current[ index ];
		if ( node ) {
			node.focus();
		}
	}

	function onKeyDown( event ) {
		const last = TABS.length - 1;
		let next = null;

		switch ( event.key ) {
			case 'ArrowRight':
				next = active === last ? 0 : active + 1;
				break;
			case 'ArrowLeft':
				next = active === 0 ? last : active - 1;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = last;
				break;
			default:
				return;
		}

		event.preventDefault();
		focusTab( next );
	}

	const ActivePanel = TABS[ active ].Component;

	return (
		<div dir={ dir } className="ea24-font-sans ea24-text-ea24-body">
			{ /* Contained brand gradient header. It is a bar at the top of our
			     own content area — not full-viewport — and its sticky offset is
			     the WP admin-bar height so it never slides under that bar. The
			     wp-admin left menu sits outside #wpcontent, so it is never
			     overlapped. */ }
			<header
				className="ea24-sticky ea24-z-20 ea24-flex ea24-h-[66px] ea24-items-center ea24-justify-between ea24-gap-4 ea24-bg-brand-gradient ea24-px-8 ea24-shadow-header"
				style={ { top: 'var(--wp-admin--admin-bar--height, 32px)' } }
			>
				<div className="ea24-flex ea24-items-center ea24-gap-2.5">
					{ /* Icon mark recolored to a clean white silhouette via CSS
					     filter (brightness(0) turns every opaque pixel black
					     regardless of hue, invert(1) flips it to white; alpha is
					     untouched) so it reads directly on the gradient with no
					     background chip. Decorative (alt="") because the visible
					     wordmark text carries the name, and the sr-only heading
					     below carries the full product name for assistive tech. */ }
					<img
						src={ iconLogo }
						alt=""
						className="ea24-h-[28px] ea24-w-auto ea24-object-contain ea24-brightness-0 ea24-invert"
					/>
					<span className="ea24-text-[19px] ea24-font-bold ea24-text-white">
						{ t( 'common.appNameShort' ) }
					</span>
					<h1 className="ea24-sr-only">{ t( 'common.appName' ) }</h1>
				</div>
				<div className="ea24-flex ea24-items-center ea24-gap-4">
					<StatusPill />
					<LanguageSwitcher />
				</div>
			</header>

			<div className="ea24-bg-ea24-page">
				<div className="ea24-mx-auto ea24-w-full ea24-max-w-[960px] ea24-px-8 ea24-pb-16 ea24-pt-8">
					<div className="ea24-relative ea24-mb-8">
						<div
							ref={ tablistRef }
							role="tablist"
							aria-label={ t( 'nav.aria' ) }
							aria-orientation="horizontal"
							className="ea24-flex ea24-gap-7 ea24-overflow-x-auto ea24-border-b ea24-border-ea24-card-border"
						>
							{ TABS.map( ( tab, index ) => {
								const selected = index === active;
								return (
									<button
										key={ tab.key }
										type="button"
										role="tab"
										id={ `ea24-tab-${ tab.key }` }
										aria-selected={ selected }
										aria-controls={ `ea24-panel-${ tab.key }` }
										tabIndex={ selected ? 0 : -1 }
										ref={ ( node ) => {
											tabRefs.current[ index ] = node;
										} }
										onClick={ () => setActive( index ) }
										onKeyDown={ onKeyDown }
										className={ `${ TAB_BASE } ${
											selected ? TAB_ACTIVE : TAB_INACTIVE
										}` }
									>
										{ t( tab.labelKey ) }
									</button>
								);
							} ) }
						</div>
						{ indicator && (
							<span
								aria-hidden="true"
								className="ea24-pointer-events-none ea24-absolute ea24-bottom-[-1px] ea24-h-[3px] ea24-rounded-[3px_3px_0_0] ea24-bg-brand-gradient ea24-transition-all ea24-duration-200"
								style={ {
									insetInlineStart:
										indicator.insetInlineStart,
									width: indicator.width,
								} }
							/>
						) }
					</div>

					<div
						role="tabpanel"
						id={ `ea24-panel-${ TABS[ active ].key }` }
						aria-labelledby={ `ea24-tab-${ TABS[ active ].key }` }
						tabIndex={ 0 }
						className="focus:ea24-outline-none"
					>
						<ActivePanel />
					</div>

					<Footer />
				</div>
			</div>
		</div>
	);
}
