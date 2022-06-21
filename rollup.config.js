import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ name: 'slimdom', file: MAIN_DEST_FILE, format: 'umd', exports: 'named', sourcemap: true },
		{ file: MODULE_DEST_FILE, format: 'es', sourcemap: true },
	],
	external: [],
	onwarn(warning) {
		// Ignore "this is undefined" warning triggered by typescript's __extends helper
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}

		console.error(warning.message);
	},
	plugins: [resolve(), sourcemaps()],
};
