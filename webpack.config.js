/**
 * Webpack config for the EaseAccess24 admin app + health probe.
 *
 * Extends the default `@wordpress/scripts` config with two entry points:
 *   - `index` — the React admin app (mounted in wp-admin).
 *   - `probe` — a small plain-JS script loaded on the front end only during an
 *     on-demand health check, to observe the widget's DOM/console.
 *
 * wp-scripts' default single entry is replaced; everything else (Babel, CSS
 * extraction, dependency extraction to `*.asset.php`) is inherited unchanged.
 *
 * Flag SVGs (Phase 10 language dropdown): the stock wp-scripts rule runs every
 * `*.svg` import through `@svgr/webpack` + `url-loader`, which INLINES the SVG as
 * a base64 data-URI into `build/index.js`. Some flags are detailed coats-of-arms
 * (rs.svg ~180KB) rendered at only 20×14px, so inlining all 33 would bloat the
 * admin bundle by hundreds of KB loaded on every admin page. Instead we opt those
 * imports out with a `?url` resource query and emit them as separate hashed files
 * under `build/images/flags/` (zero external requests — the files ship in build/).
 * Import flags as `import gb from '../assets/flags/gb.svg?url'`. Any SVG imported
 * WITHOUT `?url` still goes through the default svgr/inline pipeline unchanged.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// Exclude our `?url` flag imports from the inherited svg rules (the svgr/url-loader
// rule and the css asset/inline rule) so they fall through to the asset/resource
// rule below instead of being inlined.
const rules = defaultConfig.module.rules.map( ( rule ) => {
	if ( rule.test && String( rule.test ) === String( /\.svg$/ ) ) {
		return { ...rule, resourceQuery: { not: [ /url/ ] } };
	}
	return rule;
} );

// Flags imported with `?url` → emitted as standalone hashed files, referenced by URL.
rules.push( {
	test: /\.svg$/,
	resourceQuery: /url/,
	type: 'asset/resource',
	generator: {
		filename: 'images/flags/[name].[hash:8][ext]',
	},
} );

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		rules,
	},
	entry: {
		index: path.resolve( __dirname, 'src/index.js' ),
		probe: path.resolve( __dirname, 'src/probe/index.js' ),
	},
};
