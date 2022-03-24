import * as slimdom from '../../src/index';

describe('DOMParser', () => {
	it('can parse an XML document', () => {
		const parser = new slimdom.DOMParser();
		const source = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html>
				<head>\r\n
					<title>Test document</title>
				</head>
				<body lang="en">
					<h1>Hello &lt;world&gt;!</h1>
					<!-- Comments are awesome! -->
					<?pi can be useful as well?>
					<![CDATA[<not>an<element/>!]]>
				</body>
			</html>`;
		const doc = parser.parseFromString(source, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(source.replace(/\r\n?/g, '\n'));
	});

	it('can parse an XML document with namespaces', () => {
		const parser = new slimdom.DOMParser();
		const source = `<root xmlns="ns1" xmlns:pre="ns2"><pre:bla attr="value" pre:attr="another" xmlns="ns3"><blup/></pre:bla><bla/></root>`;
		const doc = parser.parseFromString(source, 'text/xml');
		expect(doc.documentElement?.namespaceURI).toBe('ns1');
		expect(
			doc.documentElement?.firstElementChild?.getAttributeNode('pre:attr')?.namespaceURI
		).toBe('ns2');
		expect(doc.documentElement?.firstElementChild?.firstElementChild?.namespaceURI).toBe('ns3');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(source);
	});

	it('can handle character references and predefined entities in content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root attr="&#x1f4a9;">&lt;&quot;&#128169;&apos;&gt;</root>`;
		const out = `<root attr="\u{1f4a9}">&lt;"\u{1f4a9}'&gt;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('supports entities in content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;&#38;two;&amp;two;"><!ENTITY two "prrt">]><root>&amp;&one;</root>`;
		const out = `<!DOCTYPE root><root>&amp;prrtprrt&amp;two;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('throws on recursive entities in content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two "&one;">]><root>&one;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to entity one must not be recursive</parsererror>"`
		);
	});

	it('can get attributes from their defaults in the DTD', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root attr CDATA "value">]><root><root attr="override"/></root>`;
		const out = `<!DOCTYPE root><root attr="value"><root attr="override"/></root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can get namespace declarations from their defaults in the DTD', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root xmlns CDATA "ns1">]><root><root xmlns="ns2"/></root>`;
		const out = `<!DOCTYPE root><root xmlns="ns1"><root xmlns="ns2"/></root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can normalize attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root id ID #IMPLIED>]><root id=" \t\r\nbla\t\r\n " attr=" \t\r\nbla&#9;\t\r\n "/>`;
		const out = `<!DOCTYPE root><root id="bla" attr="   bla&#9;   "/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('supports entities in attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;&#38;two;&amp;two;"><!ENTITY two "prrt">]><root attr="&amp;&one;"/>`;
		const out = `<!DOCTYPE root><root attr="&amp;prrtprrt&amp;two;"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('throws on recursive entities in attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two "&one;">]><root attr="&one;"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to entity one must not be recursive</parsererror>"`
		);
	});

	it('returns an error document if parsing fails', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('NOT A VALID DOCUMENT', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 0: expected one of \\"&lt;\\", \\"&lt;\\" but found \\"N\\"</parsererror>"`
		);
	});

	it('returns an error document if the document is not well-formed', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root></toot>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: non-well-formed element: found end tag toot but expected root</parsererror>"`
		);
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
