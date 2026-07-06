/**
 * Tailwind CSS configuration for the EaseAccess24 admin app.
 *
 * The admin app renders inside wp-admin, whose own stylesheets we must not
 * disturb. Two guards keep Tailwind scoped:
 *
 *   - `prefix: 'ea24-'` namespaces every utility class so nothing collides
 *     with core admin styles.
 *   - `corePlugins.preflight: false` disables Tailwind's global reset, which
 *     would otherwise reset margins/typography across the whole wp-admin page.
 *     A CONTAINED reset scoped to `#easeaccess24-admin-root` lives in
 *     `src/admin.css` instead, so our app gets clean typography without leaking
 *     into wp-admin.
 */
module.exports = {
	prefix: 'ea24-',
	content: [ './src/**/*.{js,jsx,ts,tsx}' ],
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			/*
			 * Brand tokens for the approved (Phase 08) design system. Values are
			 * the exact palette from `.claude/context/09-design-spec.md`.
			 * Components reference these token NAMES, never raw hex, so the whole
			 * system re-tones from here. Existing token keys keep their names so
			 * no component className has to change just to pick up new colors.
			 */
			colors: {
				ea24: {
					brand: '#5D29D7', // Primary purple: buttons, links, active tab, ring.
					'brand-dark': '#4A1FA8', // Darker brand for hover/active.
					'brand-light': '#A73BEA', // Accent magenta (gradient end).
					accent: '#A73BEA',
					'gradient-from': '#5D29D7', // Primary gradient start.
					'gradient-to': '#A73BEA', // Primary gradient end.
					surface: '#F3EEFC', // Tinted panel / secondary-button hover.
					page: '#F6F5FB', // App page background.
					card: '#FFFFFF', // Card surface.
					'card-border': '#E5E2F0', // Card border.
					divider: '#F1EFF8', // Divider inside cards.
					body: '#1F2230', // Body text.
					muted: '#6B7480', // Muted text.
					'muted-2': '#5b5f6e', // Secondary muted.
					faint: '#8a8fa0', // Faint labels / eyebrow.
					amber: '#F7AA2F', // Signal amber (diagnostic stripe).
					// Info / neutral tone.
					'neutral-bg': '#EEF0F3',
					'neutral-text': '#525a66',
					'info-border': '#DDE0E6',
					'info-stripe': '#6B7480',
					// Success tone.
					'success-bg': '#E7F7EE',
					'success-text': '#1B7A43',
					'success-border': '#BCE8CD',
					'success-check': '#27AE60',
					// Warning / amber tone.
					'warning-bg': '#FEF3DF',
					'warning-text': '#9A6510',
					'warning-border': '#F6DFB0',
					'warning-icon': '#D98A12',
					// Danger tone (accessible red on white for `fail`).
					'danger-bg': '#FDECEC',
					'danger-text': '#B42318',
					'danger-border': '#F4C7C3',
					// Dashboard status banner border.
					'banner-border': '#E3D6F7',
					// Dark support-report preview block.
					preview: '#1F2230',
					'preview-text': '#D7D9E3',
					'preview-label': '#8B90A3',
					'preview-prefix': '#A88BF0',
				},
			},
			borderRadius: {
				card: '14px',
				'card-lg': '16px',
				btn: '10px',
				chip: '8px',
				input: '11px',
				seg: '12px',
				segItem: '10px',
				menu: '12px',
				row: '8px',
			},
			boxShadow: {
				// Signature purple-tinted card elevation (shadow-only, no
				// border — Phase 11a modern-UI pass).
				card: '0 1px 3px rgba(31,34,48,.06), 0 4px 16px rgba(93,41,215,.06)',
				'card-lg':
					'0 1px 3px rgba(31,34,48,.06), 0 6px 20px rgba(93,41,215,.08)',
				// Interactive-card hover lift; applied only where a card
				// signals clickability (consumed by later Phase 11b-11d work).
				'card-hover':
					'0 2px 6px rgba(31,34,48,.08), 0 8px 24px rgba(93,41,215,.10)',
				btn: '0 4px 14px rgba(93,41,215,.28)',
				cta: '0 6px 18px rgba(93,41,215,.3)',
				header: '0 2px 18px rgba(93,41,215,.22)',
				chip: '0 6px 16px rgba(93,41,215,.28)',
				pill: '0 2px 8px rgba(31,34,48,.16)',
				seg: '0 2px 8px rgba(93,41,215,.28)',
				menu: '0 12px 36px rgba(31,34,48,.16)',
			},
			fontFamily: {
				sans: [ 'Inter', 'system-ui', '-apple-system', 'sans-serif' ],
				mono: [
					'"JetBrains Mono"',
					'ui-monospace',
					'SFMono-Regular',
					'monospace',
				],
			},
			backgroundImage: {
				'brand-gradient':
					'linear-gradient(135deg, #5D29D7 0%, #A73BEA 100%)',
				banner: 'linear-gradient(120deg, #F3EEFC 0%, #FBF7FF 100%)',
			},
			keyframes: {
				'ea-spin': {
					to: { transform: 'rotate(360deg)' },
				},
			},
			animation: {
				'ea-spin': 'ea-spin .7s linear infinite',
			},
		},
	},
	plugins: [],
};
