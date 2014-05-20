require(
	{
		// Base url for all scripts
		baseUrl: '../src',
		// Paths for external libs
		paths: {
			lodash: '../test/src/lodash.min'
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
		'use strict';

		// Start the test suite
		var jasmineEnv = jasmine.getEnv();
		jasmineEnv.updateInterval = 1000;

		var htmlReporter = new jasmine.HtmlReporter();

		jasmineEnv.addReporter(htmlReporter);

		jasmineEnv.specFilter = function(spec) {
			return htmlReporter.specFilter(spec);
		};

		jasmineEnv.execute();
	}
);
