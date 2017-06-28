import * as slimdom from '../../src/index';

describe('DOMParser', () => {
	it('can parse an XML document', () => {
		const parser = new slimdom.DOMParser();
		const source = `<!DOCTYPE html><html>
				<head>
					<title>Test document</title>
				</head>
				<body>
					<h1>Hello world!</h1>
				</body>
			</html>`;
		const doc = parser.parseFromString(source, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(source);
	});

	it('returns an error document if parsing fails', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('NOT A VALID DOCUMENT', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 0: expected one of \\"&lt;\\", \\"&lt;\\" but found \\"N\\"</parsererror>"`
		);
	});
});
