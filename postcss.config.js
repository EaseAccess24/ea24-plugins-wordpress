/**
 * PostCSS config. `@wordpress/scripts` auto-detects this file and runs it for
 * every imported stylesheet, so Tailwind is compiled as part of the normal
 * wp-scripts build with no extra webpack wiring.
 */
module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
};
