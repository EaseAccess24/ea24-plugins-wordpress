/**
 * Icons — small inline SVGs matching the approved Phase 08 mockup.
 *
 * Purely presentational: every icon is `aria-hidden` (labels/roles come from the
 * surrounding text). Icons carry no logic and take only display props. Kept in
 * one place so the design stays consistent across screens.
 */

/**
 * @typedef {Object} IconProps
 * @property {number} [size]        Width/height in px.
 * @property {string} [color]       Stroke/fill color.
 * @property {number} [strokeWidth] Stroke width.
 */

/**
 * Shared <svg> wrapper.
 *
 * @param {Object} props          Standard SVG props plus size.
 * @param {number} [props.size]   Width/height in px.
 * @param {*}      props.children Path contents.
 * @return {JSX.Element} The SVG element.
 */
function Svg( { size = 18, children, ...rest } ) {
	return (
		<svg
			width={ size }
			height={ size }
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			focusable="false"
			{ ...rest }
		>
			{ children }
		</svg>
	);
}

const stroke = ( color, w = 2 ) => ( {
	stroke: color,
	strokeWidth: w,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
} );

/**
 * Universal-access brand mark.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function BrandMark( props ) {
	const { size = 19, color = '#fff' } = props;
	return (
		<Svg size={ size }>
			<circle cx="12" cy="12" r="9" { ...stroke( color, 1.9 ) } />
			<circle cx="12" cy="7" r="1.7" fill={ color } />
			<path d="M12 10v7M8 12.5h8" { ...stroke( color, 1.9 ) } />
		</Svg>
	);
}

/**
 * Check mark.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Check( props ) {
	const { size = 18, color = '#27AE60', strokeWidth = 3 } = props;
	return (
		<Svg size={ size }>
			<path d="M20 6L9 17l-5-5" { ...stroke( color, strokeWidth ) } />
		</Svg>
	);
}

/**
 * Warning triangle with exclamation.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Warn( props ) {
	const { size = 18, color = '#D98A12', strokeWidth = 2 } = props;
	return (
		<Svg size={ size }>
			<path
				d="M12 3.5L21.5 20H2.5z"
				{ ...stroke( color, strokeWidth ) }
			/>
			<path
				d="M12 10v4.3M12 17.2v.2"
				{ ...stroke( color, strokeWidth + 0.2 ) }
			/>
		</Svg>
	);
}

/**
 * Info circle.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Info( props ) {
	const { size = 18, color = '#6B7480', strokeWidth = 2 } = props;
	return (
		<Svg size={ size }>
			<circle cx="12" cy="12" r="8.5" { ...stroke( color, 1.8 ) } />
			<path d="M12 11v5M12 7.8v.2" { ...stroke( color, strokeWidth ) } />
		</Svg>
	);
}

/**
 * Small dash (not-connected).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Dash( props ) {
	const { size = 15, color = '#8a8fa0' } = props;
	return (
		<Svg size={ size }>
			<path d="M6 12h12" { ...stroke( color, 2.4 ) } />
		</Svg>
	);
}

/**
 * Circular retry arrow.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Retry( props ) {
	const { size = 15, color = '#5D29D7' } = props;
	return (
		<Svg size={ size }>
			<path
				d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7M4 4v3.7H7.7"
				{ ...stroke( color, 2 ) }
			/>
		</Svg>
	);
}

/**
 * Arrow leaving the box (open-in-dashboard / external).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function ArrowOut( props ) {
	const { size = 15, color = '#fff' } = props;
	return (
		<Svg size={ size }>
			<path d="M7 17L17 7M9 7h8v8" { ...stroke( color, 2 ) } />
		</Svg>
	);
}

/**
 * Linked chain (connect).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Link( props ) {
	const { size = 23, color = '#fff' } = props;
	return (
		<Svg size={ size }>
			<path
				d="M10 13a5 5 0 007.5.5l2-2a5 5 0 00-7-7l-1.2 1.1"
				{ ...stroke( color, 2 ) }
			/>
			<path
				d="M14 11a5 5 0 00-7.5-.5l-2 2a5 5 0 007 7l1.2-1.1"
				{ ...stroke( color, 2 ) }
			/>
		</Svg>
	);
}

/**
 * Shield with check (support report).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Shield( props ) {
	const { size = 23, color = '#5D29D7' } = props;
	return (
		<Svg size={ size }>
			<path
				d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"
				stroke={ color }
				strokeWidth="1.9"
				strokeLinejoin="round"
			/>
			<path d="M9 12l2 2 4-4.2" { ...stroke( color, 1.9 ) } />
		</Svg>
	);
}

/**
 * Padlock (logs stay local).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Lock( props ) {
	const { size = 18, color = '#1B7A43' } = props;
	return (
		<Svg size={ size }>
			<rect
				x="5"
				y="10"
				width="14"
				height="9"
				rx="2"
				stroke={ color }
				strokeWidth="1.8"
			/>
			<path d="M8 10V7.5a4 4 0 018 0V10" { ...stroke( color, 1.8 ) } />
		</Svg>
	);
}

/**
 * Question mark in a circle (where do I find this?).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Help( props ) {
	const { size = 14, color = '#A73BEA' } = props;
	return (
		<Svg size={ size }>
			<circle cx="12" cy="12" r="9" stroke={ color } strokeWidth="1.8" />
			<path
				d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.3M12 17.2v.2"
				{ ...stroke( color, 1.8 ) }
			/>
		</Svg>
	);
}

/**
 * Chevron (dropdown caret). Defaults pointing down.
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Chevron( props ) {
	const { size = 16, color = 'currentColor', strokeWidth = 2 } = props;
	return (
		<Svg size={ size }>
			<path d="M6 9l6 6 6-6" { ...stroke( color, strokeWidth ) } />
		</Svg>
	);
}

/**
 * Globe (neutral flag fallback).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Globe( props ) {
	const { size = 16, color = '#6B7480', strokeWidth = 1.6 } = props;
	return (
		<Svg size={ size }>
			<circle cx="12" cy="12" r="9" { ...stroke( color, strokeWidth ) } />
			<path
				d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
				{ ...stroke( color, strokeWidth ) }
			/>
		</Svg>
	);
}

/**
 * Eye (reveal).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Eye( props ) {
	const { size = 15, color = 'currentColor', strokeWidth = 1.8 } = props;
	return (
		<Svg size={ size }>
			<path
				d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
				{ ...stroke( color, strokeWidth ) }
			/>
			<circle cx="12" cy="12" r="3" { ...stroke( color, strokeWidth ) } />
		</Svg>
	);
}

/**
 * Eye with a slash (hide).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function EyeOff( props ) {
	const { size = 15, color = 'currentColor', strokeWidth = 1.8 } = props;
	return (
		<Svg size={ size }>
			<path
				d="M9.9 5.7A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3 3.6M6.3 7.3A15.8 15.8 0 002.5 12S6 18.5 12 18.5a9.4 9.4 0 004-.9"
				{ ...stroke( color, strokeWidth ) }
			/>
			<path d="M4 4l16 16" { ...stroke( color, strokeWidth ) } />
		</Svg>
	);
}

/**
 * Copy (two overlapping sheets).
 *
 * @param {IconProps} props Icon display props.
 * @return {JSX.Element} The icon.
 */
export function Copy( props ) {
	const { size = 15, color = 'currentColor', strokeWidth = 1.8 } = props;
	return (
		<Svg size={ size }>
			<rect
				x="9"
				y="9"
				width="11"
				height="11"
				rx="2"
				{ ...stroke( color, strokeWidth ) }
			/>
			<path
				d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"
				{ ...stroke( color, strokeWidth ) }
			/>
		</Svg>
	);
}
