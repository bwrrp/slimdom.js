import { terser } from 'rollup-plugin-terser';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ name: 'slimdom', file: MAIN_DEST_FILE, format: 'umd', exports: 'named', sourcemap: true },
		{ file: MODULE_DEST_FILE, format: 'es', sourcemap: true }
	],
	onwarn(warning) {
		// Ignore "this is undefined" warning triggered by typescript's __extends helper
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}

		console.error(warning.message);
	},
	plugins: [
		terser({
			mangle: {
				properties: {
					regex: /^_/
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
					'Element',
					'Node',
					'MutationObserver',
					'ProcessingInstruction',
					'Range',
					'Text',
					'XMLDocument',
					'XMLSerializer'
				]
			}
		})
	]
};
