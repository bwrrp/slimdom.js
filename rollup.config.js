import babili from 'rollup-plugin-babili';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
	entry: 'lib/index.js',
	targets: [{ dest: MAIN_DEST_FILE, format: 'umd' }, { dest: MODULE_DEST_FILE, format: 'es' }],
	moduleName: 'slimdom',
	exports: 'named',
	sourceMap: true,
	onwarn(warning) {
		// Ignore "this is undefined" warning triggered by typescript's __extends helper
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}

		console.error(warning.message);
	},
	plugins: [
		babili({
			comments: false,
			sourceMap: true
		})
	]
};
