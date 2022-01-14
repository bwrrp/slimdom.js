'use strict';

require('ts-node/register');

const convertHtmlToTestSuite = require('./convertHtmlToTestSuite').default;

const WEB_PLATFORM_TESTS_PATH = process.env.WEB_PLATFORM_TESTS_PATH;

module.exports = {
	process(src, filename) {
		return convertHtmlToTestSuite(src, filename, WEB_PLATFORM_TESTS_PATH);
	},
};
