import minify from 'rollup-plugin-babel-minify';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ file: MAIN_DEST_FILE, format: 'umd', exports: 'named' },
		{ file: MODULE_DEST_FILE, format: 'es' }
	],
	name: 'slimdom',
	sourcemap: true,
	onwarn(warning) {
		// Ignore "this is undefined" warning triggered by typescript's __extends helper
		if (warning.code === 'THIS_IS_UNDEFINED') {
			return;
		}

		console.error(warning.message);
	},
	plugins: [
		minify({
			comments: false,
			mangle: {
				exclude: [
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
			},
			sourceMap: true
		})
	]
};
