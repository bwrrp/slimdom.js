const path = require('path');

const roots = ['<rootDir>/test'];
if (process.env.WEB_PLATFORM_TESTS_PATH) {
	roots.push(path.resolve(process.env.WEB_PLATFORM_TESTS_PATH, 'dom'));
} else {
	console.log(
		'ℹ to run web platform tests, set the WEB_PLATFORM_TESTS_PATH environment variable'
	);
}

module.exports = {
	rootDir: __dirname,
	roots: roots,
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.x?html$': '<rootDir>/test/web-platform-tests/preprocessor.js',
	},
	testRegex: '\\.x?html|test/.*(\\.tests\\.ts)$',
	moduleFileExtensions: ['html', 'xhtml', 'ts', 'tsx', 'js', 'json', 'jsx'],
	collectCoverageFrom: ['src/**/*.ts'],
	coverageReporters: ['html', 'text'],
	globals: {
		window: {},
	},
};
