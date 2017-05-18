import babili from 'rollup-plugin-babili';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
    entry: 'lib/index.js',
    targets: [
        { dest: MAIN_DEST_FILE, format: 'umd' },
        { dest: MODULE_DEST_FILE, format: 'es' },
    ],
    moduleName: 'slimdom',
    exports: 'default',
    sourceMap: true,
    plugins: [
        babili({
            comments: false,
            sourceMap: true
        })
    ]
}
