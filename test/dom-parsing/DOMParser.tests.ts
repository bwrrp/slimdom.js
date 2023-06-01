import * as slimdom from '../../src/index';
import { expectObject } from '../../src/util/errorHelpers';

describe('DOMParser', () => {
	it('can parse an XML document', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<?xml version="1.0" encoding="utf-16" standalone="yes"?>
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
			<html>
				<head>\r\n
					<title>Test document</title>
				</head>
				<body lang="en">
					<h1>Hello &lt;world&gt;!</h1>
					<!-- Comments are awesome! -->
					<?pi can be useful as well?>
					<?pi-with-just-a-target?>
					<![CDATA[<not>an<element/>!]]>
				</body>
			</html>`;
		const out =
			`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html>
				<head>\r\n
					<title>Test document</title>
				</head>
				<body lang="en">
					<h1>Hello &lt;world&gt;!</h1>
					<!-- Comments are awesome! -->
					<?pi can be useful as well?>
					<?pi-with-just-a-target ?>
					<![CDATA[<not>an<element/>!]]>
				</body>
			</html>`.replace(/\r\n?/g, '\n');
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can parse an XML document with namespaces', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<?xml version="1.0" standalone='no'?><!DOCTYPE root SYSTEM "id"><root xmlns="ns1" xmlns:pre="ns2"><pre:bla attr="value" pre:attr="another" xmlns="ns3"><blup><reset xmlns=""/></blup></pre:bla><bla/></root>`;
		const out = `<!DOCTYPE root SYSTEM "id"><root xmlns="ns1" xmlns:pre="ns2"><pre:bla attr="value" pre:attr="another" xmlns="ns3"><blup><reset xmlns=""/></blup></pre:bla><bla/></root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(doc.documentElement?.namespaceURI).toBe('ns1');
		expect(
			doc.documentElement?.firstElementChild?.getAttributeNode('pre:attr')?.namespaceURI
		).toBe('ns2');
		expect(doc.documentElement?.firstElementChild?.firstElementChild?.namespaceURI).toBe('ns3');
		expect(doc.getElementsByTagName('reset')[0]?.namespaceURI).toBe(null);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('produces a well-formed document even if the error contains invalid characters', () => {
		const parser = new slimdom.DOMParser();
		const xml = `\u{0019}`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(`
		"<parsererror xmlns="http://www.mozilla.org/newlayout/xml/parsererror.xml">Error: Parsing document failed, expected "&lt;"
		At line 1, character 1:

		[invalid character]
		^^^^^^^^^^^^^^^^^^^</parsererror>"
	`);
	});

	it("doesn't support HTML parsing", () => {
		const parser = new slimdom.DOMParser();
		expect(() => parser.parseFromString('<p>hello!</p>', 'text/html')).toThrow(
			'not implemented'
		);
	});

	it('throws when asked for an unsupported mime type', () => {
		const parser = new slimdom.DOMParser();
		expect(() => parser.parseFromString('<p>hello!</p>', 'image/png')).toThrow(
			'not a valid value'
		);
	});
});
