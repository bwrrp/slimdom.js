import resolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

const {
	exports: {
		'.': { require: CJS_DEST_FILE, import: ESM_DEST_FILE },
	},
} = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ name: 'slimdom', file: CJS_DEST_FILE, format: 'umd', exports: 'named', sourcemap: true },
		{ file: ESM_DEST_FILE, format: 'es', sourcemap: true },
	],
	external: [],
	onwarn(warning) {
		// Ignore "this is undefined" warning triggered by typescript's __extends helper
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}

		console.error(warning.message);
	},
	plugins: [
		resolve(),
		sourcemaps(),
		terser({
			mangle: {
				properties: {
					regex: /^_/,
				},
				reserved: [
					'Attr',
					'CDATASection',
					'CharacterData',
					'Comment',
					'Document',
					'DocumentFragment',
					'DocumentType',
					'DOMImplementation',
					'DOMParser',
					'Element',
					'Node',
					'MutationObserver',
					'ProcessingInstruction',
					'Range',
					'Text',
					'XMLDocument',
					'XMLSerializer',
				],
			},
		}),
	],
};
