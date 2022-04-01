import * as slimdom from '../../src/index';

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

	it('returns an error if an element prefix is not declared', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<pre:root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: use of undeclared element prefix pre</parsererror>"`
		);
	});

	it('returns an error if an attribute prefix is not declared', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root pre:attr="value"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: use of undeclared attribute prefix pre</parsererror>"`
		);
	});

	it('returns an error if the xmlns prefix is declared', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns:xmlns="value"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the xmlns namespace prefix must not be declared</parsererror>"`
		);
	});

	it('returns an error if the xml prefix is redeclared to a different namespace', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns:xml="value"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the xml namespace prefix must not be bound to any namespace other than http://www.w3.org/XML/1998/namespace</parsererror>"`
		);
	});

	it('returns an error if the xml namespace is bound to a prefix other than xml', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns:pre="http://www.w3.org/XML/1998/namespace"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the namespace http://www.w3.org/XML/1998/namespace must be bound only to the prefix \\"xml\\"</parsererror>"`
		);
	});

	it('returns an error if the xml namespace is used as the default namespace', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns="http://www.w3.org/XML/1998/namespace"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the namespace http://www.w3.org/XML/1998/namespace must not be used as the default namespace</parsererror>"`
		);
	});

	it('returns an error if the xmlns namespace is used as the default namespace', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns="http://www.w3.org/2000/xmlns/"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the namespace http://www.w3.org/2000/xmlns/ must not be used as the default namespace</parsererror>"`
		);
	});

	it('returns an error if the xmlns namespace is bound to a prefix', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns:pre="http://www.w3.org/2000/xmlns/"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the namespace http://www.w3.org/2000/xmlns/ must not be bound to a prefix</parsererror>"`
		);
	});

	it('returns an error if the xmlns prefix is used for an element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<xmlns:root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: element names must not have the prefix \\"xmlns\\"</parsererror>"`
		);
	});

	it('returns an error if a prefix is redeclared to an empty namespace', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root xmlns:pre=""/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the prefix pre must not be undeclared</parsererror>"`
		);
	});

	it('returns an error if an element has a name with multiple colons', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<a:b:c/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the name a:b:c is not a valid qualified name</parsererror>"`
		);
	});

	it('returns an error if an element has a name with an empty prefix', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<:b/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the name :b is not a valid qualified name</parsererror>"`
		);
	});

	it('returns an error if an element has a name an empty localName', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<a:/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: the name a: is not a valid qualified name</parsererror>"`
		);
	});

	it('returns an error if an element has a name starting with an invalid character', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<-/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 1: expected \\"valid name start character\\" but found \\"-\\"</parsererror>"`
		);
	});

	it('returns an error if an element has a name containing an invalid character', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<a-\u{2050}/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 3: expected one of \\"/&gt;\\", \\"&gt;\\" but found \\"⁐\\"</parsererror>"`
		);
	});

	it('returns an error if the DTD public ID contains an invalid character (double quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root PUBLIC "\u{1f4a9}" ""><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 23: expected \\"\\"\\" but found \\"💩\\"</parsererror>"`
		);
	});

	it('returns an error if the DTD public ID contains an invalid character (single quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root PUBLIC '\u{1f4a9}' ""><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 23: expected \\"'\\" but found \\"💩\\"</parsererror>"`
		);
	});

	it('returns an error if text contains an invalid character', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root>\u{19}</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 6: expected \\"end of input\\" but found invalid character</parsererror>"`
		);
	});

	it('returns an error if an entity text contains an invalid character (double quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY a "\u{19}">]><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 28: expected \\"\\"\\" but found invalid character</parsererror>"`
		);
	});

	it('returns an error if an entity text contains an invalid character (single quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY a '\u{19}'>]><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 28: expected \\"'\\" but found invalid character</parsererror>"`
		);
	});

	it('returns an error if an attribute contains an invalid character (double quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root attr="\u{19}"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 12: expected \\"\\"\\" but found invalid character</parsererror>"`
		);
	});

	it('returns an error if an attribute contains an invalid character (single quotes)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root attr='\u{19}'/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 12: expected \\"'\\" but found invalid character</parsererror>"`
		);
	});

	it('returns an error if an entity has a name that contains a colon', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY a:b "a">]><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 25: expected one of \\"name must not contain colon\\", \\"%\\" but found \\"a\\"</parsererror>"`
		);
	});

	it('returns an error if a notation has a name that contains a colon', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!NOTATION a:b PUBLIC "a">]><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 27: expected \\"name must not contain colon\\" but found \\"a\\"</parsererror>"`
		);
	});

	it('returns an error if a processing instruction has a name that contains a colon', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<?a:b?><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 2: expected \\"name must not contain colon\\" but found \\"a\\"</parsererror>"`
		);
	});

	it('returns an error if the DTD public ID contains an invalid character (2)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root PUBLIC "\u{3c}" ""><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 23: expected \\"\\"\\" but found \\"&lt;\\"</parsererror>"`
		);
	});

	it('returns an error if the DTD public ID contains an invalid character (3)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root PUBLIC "\u{3e}" ""><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 23: expected \\"\\"\\" but found \\"&gt;\\"</parsererror>"`
		);
	});

	it('ignores trailing whitespace after the document element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root/>\t\r\n `;
		const out = `<root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if non-whitespace character data follows the document element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root/>text`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: document must not contain text outside of elements</parsererror>"`
		);
	});

	it('returns an error if an entity reference follows the document element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY e "">]><root/>&e;`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to entity e must not appear after the document element</parsererror>"`
		);
	});

	it('returns an error if a character reference follows the document element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root/>&#9;`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: character reference must not appear after the document element</parsererror>"`
		);
	});

	it('returns an error if a CData section follows the document element', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<root/><![CDATA[]]>;`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: CData section must not appear after the document element</parsererror>"`
		);
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

	it('returns an error for recursive entities in content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two "&one;">]><root>&one;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to entity one must not be recursive</parsererror>"`
		);
	});

	it('returns an error for references to unknown entities in content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root><root>&one;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to unknown entity one in content</parsererror>"`
		);
	});

	it('returns an error for entities that expand to content that does not match the content production', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY wrong "<p">]><root>&wrong;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing replacement text for entity wrong at offset 2: expected one of \\"/&gt;\\", \\"&gt;\\" but found \\"D\\"</parsererror>"`
		);
	});

	it('returns an error for entities that expand to content that is not well-formed', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY wrong "<p>text">]><root>&wrong;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: replacement text for entity wrong is not well-formed - element p is missing a closing tag</parsererror>"`
		);
	});

	it('returns an error for entity references in element tags', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY e SYSTEM "external">]><root &e;/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 53: expected one of \\"/&gt;\\", \\"&gt;\\" but found \\"&amp;\\"</parsererror>"`
		);
	});

	it('ignores references to external parsed entities', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one SYSTEM 'external'>]><root>&one;</root>`;
		const out = `<!DOCTYPE root><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if an unparsed entity is referenced', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY binary SYSTEM "uri" NDATA stuff>]><root>&binary;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to binary entity binary is not allowed</parsererror>"`
		);
	});

	it('returns an error if an entity in the internal subset contains a reference to a parameter entity', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY % pe "ignored"><!ENTITY ge "%pe;">]><root>&ge;</root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to parameter entity pe must not occur in an entity declaration in the internal subset</parsererror>"`
		);
	});

	it('can handle the first example from appendix D', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE test [<!ENTITY example "<p>An ampersand (&#38;#38;) may be escaped
		numerically (&#38;#38;#38;) or with a general entity
		(&amp;amp;).</p>" >]><root>&example;</root>`;
		const out = `<!DOCTYPE test><root><p>An ampersand (&amp;) may be escaped
		numerically (&amp;#38;) or with a general entity
		(&amp;amp;).</p></root>`.replace(/\r\n?/g, '\n');
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can get attributes from their defaults in the DTD', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root attr CDATA "value">]><root><root attr="override"/></root>`;
		const out = `<!DOCTYPE root><root attr="value"><root attr="override"/></root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('ignores duplicate declarations for attributes but merges duplicate attribute lists for elements', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root a CDATA "a" b CDATA "b"><!ATTLIST root b CDATA "bbb" c CDATA "c">]><root/>`;
		const out = `<!DOCTYPE root><root a="a" b="b" c="c"/>`;
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
		const xml = `<!DOCTYPE root [<!ATTLIST root id ID #IMPLIED n NOTATION (a|b) #IMPLIED e (one | two) #REQUIRED>]><root id=" \t\r\nbla\t\r\n " attr=" \t\r\nbla&#9;\t\r\n "/>`;
		const out = `<!DOCTYPE root><root id="bla" attr="   bla&#9;   "/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can normalize attribute values (2)', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST root a NMTOKENS "a default">]><root a=" a b c "/>`;
		const out = `<!DOCTYPE root><root a="a b c"/>`;
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

	it('ignores duplicate entity definitions', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "one"><!ENTITY one "two">]><root attr="&one;"/>`;
		const out = `<!DOCTYPE root><root attr="one"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error for references to unknown entities in attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root><root attr="&one;"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to unknown entity one in attribute value</parsererror>"`
		);
	});

	it('returns an error if an attlist references an entity that is not defined earlier', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ATTLIST el a CDATA "&e;"><!ENTITY e "v">]><root/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: default value of attribute a contains reference to undefined entity e</parsererror>"`
		);
	});

	it('returns an error for recursive entities in attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two '&one;'>]><root attr="&one;"/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to entity one must not be recursive</parsererror>"`
		);
	});

	it('returns an error for external entity references in attribute values', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY e "&ext;"><!ENTITY ext SYSTEM "ext">]><root attr='&e;'/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: reference to external entity ext is not allowed in attribute value</parsererror>"`
		);
	});

	it('returns an error if the replacement text for an entity reference in an attribute value contains <', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ENTITY x "&#60;">]><root attr='&x;'/>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing replacement text for entity x at offset 0: expected \\"end of input\\" but found \\"&lt;\\"</parsererror>"`
		);
	});

	it('returns an error document if parsing fails', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('NOT A VALID DOCUMENT', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 0: expected \\"&lt;\\" but found \\"N\\"</parsererror>"`
		);
	});

	it('returns an error document if the document is not well-formed', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root></toot>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: non-well-formed element: found end tag toot but expected root</parsererror>"`
		);
	});

	it('returns an error if a PI has target "xml"', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root><?xml version="1.0"?></root>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 8: expected \\"processing instruction target must not be \\"xml\\"\\" but found \\"x\\"</parsererror>"`
		);
	});

	it('returns an error if a PI has target "xml" in the DTD', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString(
			'<!DOCTYPE root [<?xml version="1.0"?>]><root/>',
			'text/xml'
		);
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 18: expected \\"processing instruction target must not be \\"xml\\"\\" but found \\"x\\"</parsererror>"`
		);
	});

	it('returns an error if there is more than one root element', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root/><another-root/>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: document must contain a single root element, but found root and another-root</parsererror>"`
		);
	});

	it('returns an error if the input is empty', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: Error parsing document at offset 0: expected \\"&lt;\\" but found end of input</parsererror>"`
		);
	});

	it('returns an error if there are not enough end tags', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: document is not well-formed - element root is missing a closing tag</parsererror>"`
		);
	});

	it('returns an error if there are too many end tags', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root/></root>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: non-well-formed element: found end tag root but expected no such tag</parsererror>"`
		);
	});

	it('returns an error if an element has duplicate attributes', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString('<root attr="value" attr="another value"/>', 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: attribute attr must not appear multiple times on element root</parsererror>"`
		);
	});

	it('returns an error if an element has attributes with the same expanded name', () => {
		const parser = new slimdom.DOMParser();
		const doc = parser.parseFromString(
			'<root xmlns:a="ns" xmlns:b="ns" a:attr="value" b:attr="another value"/>',
			'text/xml'
		);
		expect(slimdom.serializeToWellFormedString(doc)).toMatchInlineSnapshot(
			`"<parsererror xmlns=\\"http://www.mozilla.org/newlayout/xml/parsererror.xml\\">Error: attribute b:attr must not appear multiple times on element root</parsererror>"`
		);
	});

	it('parses element declarations and notations but does not use them to validate content', () => {
		const parser = new slimdom.DOMParser();
		const xml = `<!DOCTYPE root [<!ELEMENT root (one, two, (three | (four, five)+))*><!NOTATION not PUBLIC "id">]><root><two/></root>`;
		const out = `<!DOCTYPE root><root><two/></root>`;
		const doc = parser.parseFromString(xml, 'text/xml');
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
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
