import convertHtmlToTestSuite, { PREAMBLE } from './convertHtmlToTestSuite';

describe('wpt: convertHtmlToTestSuite helper', () => {
	it('can convert a HTML file to a JS file containing a Jest test suite', () => {
		const src = '<!doctype html>Meep';
		const htmlPath = 'root/test.html';
		const rootPath = 'root';
		expect(convertHtmlToTestSuite(src, htmlPath, rootPath)).toBe(`${PREAMBLE}
describe("test.html", () => {
const { src, htmlPath, rootPath, blockReasonByTestName } = ${JSON.stringify({
			src,
			htmlPath,
			rootPath,
			blockReasonByTestName: {},
		})};
runTest(src, htmlPath, rootPath, blockReasonByTestName);
});`);
	});

	it('handles the blocklist', () => {
		expect(convertHtmlToTestSuite('Ignored', 'root/dom/historical.html', 'root'))
			.toBe(`${PREAMBLE}
describe("dom/historical.html", () => {
it.todo("WebIDL parsing not implemented");
});`);
	});

	it('handles the blocklist based on path prefixes', () => {
		expect(convertHtmlToTestSuite('Ignored', 'root/dom/events/test.html', 'root'))
			.toBe(`${PREAMBLE}
describe("dom/events/test.html", () => {
it.todo("Events not implemented");
});`);
	});
});
