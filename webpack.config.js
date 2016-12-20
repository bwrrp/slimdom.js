module.exports = {
	entry: './src/index.ts',
	output: {
		path: './dist',
		filename: 'slimdom.js',
		library: 'slimdom',
		libraryTarget: 'umd'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		loaders: [
			{ test: /\.js$/, loader: 'source-map-loader', enforce: 'pre' },
			{ test: /\.ts$/, loader: 'awesome-typescript-loader' }
		]
	}
};
