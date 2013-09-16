// Start the test suite
require(
	{
		// Base url for all scripts
		baseUrl: '/base/lib',
		// Paths for external libs
		paths: {
			lodash: '../test/lib/lodash.min'
		},
		// Tell RequireJS how to load non-AMD modules
		shim: {
		},
		packages: [
			{
				name: 'slimdom',
				location: '.'
			}
		]
	},
	[
		'../test/specs'
	],
	function() {
		window.__karma__.start();
	}
);
