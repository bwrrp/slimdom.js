import * as slimdom from '../../src/index';

describe('parseXmlDocument', () => {
	it('can parse an XML document', () => {
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
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('highlights where an error happens', () => {
		const xml = `<?xml version="1.0"?>
			<root>
				<blah=>Hello</blah>
			</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\">\\"
		At line 3, character 10:

						<blah=>Hello</blah>
						     ^"
	`);
	});

	it('returns the correct location even in the presence of surrogate pairs', () => {
		const xml = `<root>\u{1f4a9}</></root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"valid name start character\\"
		At line 1, character 10:

		<root>💩</></root>
		         ^"
	`);
	});

	it('truncates context if the line is too long', () => {
		const xml = `<?xml version="1.0"?><root>
			This is a very long line that will be a little too awkward to display an error on <blah>Hello</this-is-also-very-long-so-it-will-have-to-be-truncated-a-little-to-make-the-error-readable> and more text so it will have to truncate the text after the error as well.
		</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"non-well-formed element: found end tag \\"this-is-also-very-long-so-it-will-have-to-be-truncated-a-little-to-make-the-error-readable\\" but expected \\"blah\\"
		At line 2, character 97:

		… an error on <blah>Hello</this-is-also-…error-readable> and more text so it wil…
		                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('can parse an XML document with namespaces', () => {
		const xml = `<?xml version="1.0" standalone='no'?><!DOCTYPE root SYSTEM "id"><root xmlns="ns1" xmlns:pre="ns2"><pre:bla attr="value" pre:attr="another" xmlns="ns3"><blup><reset xmlns=""/></blup></pre:bla><bla/></root>`;
		const out = `<!DOCTYPE root SYSTEM "id"><root xmlns="ns1" xmlns:pre="ns2"><pre:bla attr="value" pre:attr="another" xmlns="ns3"><blup><reset xmlns=""/></blup></pre:bla><bla/></root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(doc.documentElement?.namespaceURI).toBe('ns1');
		expect(
			doc.documentElement?.firstElementChild?.getAttributeNode('pre:attr')?.namespaceURI
		).toBe('ns2');
		expect(doc.documentElement?.firstElementChild?.firstElementChild?.namespaceURI).toBe('ns3');
		expect(doc.getElementsByTagName('reset')[0]?.namespaceURI).toBe(null);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if an element prefix is not declared', () => {
		const xml = `<pre:root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"use of undeclared element prefix \\"pre\\"
		At line 1, character 2:

		<pre:root/>
		 ^^^^^^^^"
	`);
	});

	it('returns an error if an attribute prefix is not declared', () => {
		const xml = `<root pre:attr="value"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"use of undeclared attribute prefix pre
		At line 1, character 7:

		<root pre:attr=\\"value\\"/>
		      ^^^^^^^^"
	`);
	});

	it('returns an error if the xmlns prefix is declared', () => {
		const xml = `<root xmlns:xmlns="value"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the \\"xmlns\\" namespace prefix must not be declared
		At line 1, character 7:

		<root xmlns:xmlns=\\"value\\"/>
		      ^^^^^^^^^^^"
	`);
	});

	it('returns an error if the xml prefix is redeclared to a different namespace', () => {
		const xml = `<root xmlns:xml="value"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the xml namespace prefix must not be bound to any namespace other than \\"http://www.w3.org/XML/1998/namespace\\"
		At line 1, character 7:

		<root xmlns:xml=\\"value\\"/>
		      ^^^^^^^^^"
	`);
	});

	it('returns an error if the xml namespace is bound to a prefix other than xml', () => {
		const xml = `<root xmlns:pre="http://www.w3.org/XML/1998/namespace"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the namespace \\"http://www.w3.org/XML/1998/namespace\\" must be bound only to the prefix \\"xml\\"
		At line 1, character 7:

		<root xmlns:pre=\\"http://www.w3.org/XML/1998/namespace\\"/>
		      ^^^^^^^^^"
	`);
	});

	it('returns an error if the xml namespace is used as the default namespace', () => {
		const xml = `<root xmlns="http://www.w3.org/XML/1998/namespace"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the namespace \\"http://www.w3.org/XML/1998/namespace\\" must not be used as the default namespace
		At line 1, character 7:

		<root xmlns=\\"http://www.w3.org/XML/1998/namespace\\"/>
		      ^^^^^"
	`);
	});

	it('returns an error if the xmlns namespace is used as the default namespace', () => {
		const xml = `<root xmlns="http://www.w3.org/2000/xmlns/"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the namespace \\"http://www.w3.org/2000/xmlns/\\" must not be used as the default namespace
		At line 1, character 7:

		<root xmlns=\\"http://www.w3.org/2000/xmlns/\\"/>
		      ^^^^^"
	`);
	});

	it('returns an error if the xmlns namespace is bound to a prefix', () => {
		const xml = `<root xmlns:pre="http://www.w3.org/2000/xmlns/"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the namespace \\"http://www.w3.org/2000/xmlns/\\" must not be bound to a prefix
		At line 1, character 7:

		<root xmlns:pre=\\"http://www.w3.org/2000/xmlns/\\"/>
		      ^^^^^^^^^"
	`);
	});

	it('returns an error if the xmlns prefix is used for an element', () => {
		const xml = `<xmlns:root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"element names must not have the prefix \\"xmlns\\"
		At line 1, character 2:

		<xmlns:root/>
		 ^^^^^^^^^^"
	`);
	});

	it('returns an error if a prefix is redeclared to an empty namespace', () => {
		const xml = `<root xmlns:pre=""/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the prefix \\"pre\\" must not be undeclared
		At line 1, character 7:

		<root xmlns:pre=\\"\\"/>
		      ^^^^^^^^^"
	`);
	});

	it('returns an error if an element has a name with multiple colons', () => {
		const xml = `<a:b:c/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the name \\"a:b:c\\" is not a valid qualified name
		At line 1, character 2:

		<a:b:c/>
		 ^^^^^"
	`);
	});

	it('returns an error if an element has a name with an empty prefix', () => {
		const xml = `<:b/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the name \\":b\\" is not a valid qualified name
		At line 1, character 2:

		<:b/>
		 ^^"
	`);
	});

	it('returns an error if an element has a name an empty localName', () => {
		const xml = `<a:/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"the name \\"a:\\" is not a valid qualified name
		At line 1, character 2:

		<a:/>
		 ^^"
	`);
	});

	it('returns an error if an element has a name starting with an invalid character', () => {
		const xml = `<-/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"valid name start character\\"
		At line 1, character 2:

		<-/>
		 ^"
	`);
	});

	it('returns an error if an element has a name containing an invalid character', () => {
		const xml = `<a-\u{2050}/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\">\\"
		At line 1, character 4:

		<a-⁐/>
		   ^"
	`);
	});

	it('returns an error if the DTD public ID contains an invalid character (double quotes)', () => {
		const xml = `<!DOCTYPE root PUBLIC "\u{1f4a9}" ""><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected '\\"'
		At line 1, character 24:

		<!DOCTYPE root PUBLIC \\"💩\\" \\"\\"><root/>
		                       ^"
	`);
	});

	it('returns an error if the DTD public ID contains an invalid character (single quotes)', () => {
		const xml = `<!DOCTYPE root PUBLIC '\u{1f4a9}' ""><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"'\\"
		At line 1, character 24:

		<!DOCTYPE root PUBLIC '💩' \\"\\"><root/>
		                       ^"
	`);
	});

	it('returns an error if an entity has a name that contains a colon', () => {
		const xml = `<!DOCTYPE root [<!ENTITY a:b "a">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"name must not contain colon\\"
		At line 1, character 26:

		<!DOCTYPE root [<!ENTITY a:b \\"a\\">]><root/>
		                         ^"
	`);
	});

	it('returns an error if a notation has a name that contains a colon', () => {
		const xml = `<!DOCTYPE root [<!NOTATION a:b PUBLIC "a">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"name must not contain colon\\"
		At line 1, character 28:

		<!DOCTYPE root [<!NOTATION a:b PUBLIC \\"a\\">]><root/>
		                           ^"
	`);
	});

	it('returns an error if a processing instruction has a name that contains a colon', () => {
		const xml = `<?a:b?><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"name must not contain colon\\"
		At line 1, character 3:

		<?a:b?><root/>
		  ^"
	`);
	});

	it('returns an error if the DTD public ID contains an invalid character (2)', () => {
		const xml = `<!DOCTYPE root PUBLIC "\u{3c}" ""><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected '\\"'
		At line 1, character 24:

		<!DOCTYPE root PUBLIC \\"<\\" \\"\\"><root/>
		                       ^"
	`);
	});

	it('returns an error if the DTD public ID contains an invalid character (3)', () => {
		const xml = `<!DOCTYPE root PUBLIC "\u{3e}" ""><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected '\\"'
		At line 1, character 24:

		<!DOCTYPE root PUBLIC \\">\\" \\"\\"><root/>
		                       ^"
	`);
	});

	it('ignores trailing whitespace after the document element', () => {
		const xml = `<root/>\t\r\n `;
		const out = `<root/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if non-whitespace character data follows the document element', () => {
		const xml = `<root/>text`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(
			`"document must not contain text outside of elements"`
		);
	});

	it('returns an error if an entity reference follows the document element', () => {
		const xml = `<!DOCTYPE root [<!ENTITY e "">]><root/>&e;`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to entity \\"e\\" must not appear after the document element
		At line 1, character 40:

		<!DOCTYPE root [<!ENTITY e \\"\\">]><root/>&e;
		                                       ^^^"
	`);
	});

	it('returns an error if a character reference follows the document element', () => {
		const xml = `<root/>&#9;`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"character reference must not appear after the document element
		At line 1, character 8:

		<root/>&#9;
		       ^^^^"
	`);
	});

	it('returns an error if a CData section follows the document element', () => {
		const xml = `<root/><![CDATA[]]>;`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"CData section must not appear after the document element
		At line 1, character 8:

		<root/><![CDATA[]]>;
		       ^^^^^^^^^^^^"
	`);
	});

	it('can handle character references and predefined entities in content', () => {
		const xml = `<root attr="&#x1f4a9;">&lt;&quot;&#128169;&apos;&gt;</root>`;
		const out = `<root attr="\u{1f4a9}">&lt;"\u{1f4a9}'&gt;</root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('supports entities in content', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;&#38;two;&amp;two;"><!ENTITY two "prrt">]><root>&amp;&one;</root>`;
		const out = `<!DOCTYPE root><root>&amp;prrtprrt&amp;two;</root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error for recursive entities in content', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two "&one;">]><root>&one;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to entity \\"one\\" must not be recursive
		At line 1, character 1:

		&one;
		^^^^^"
	`);
	});

	it('returns an error for references to unknown entities in content', () => {
		const xml = `<!DOCTYPE root><root>&one;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to unknown entity \\"one\\" in content
		At line 1, character 22:

		<!DOCTYPE root><root>&one;</root>
		                     ^^^^^"
	`);
	});

	it('returns an error for entities that expand to content that does not match the content production', () => {
		const xml = `<!DOCTYPE root [<!ENTITY wrong "<p">]><root>&wrong;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing replacement text for entity wrong failed, expected one of \\">\\", \\"/>\\"
		At line 1, character 3:

		<!DOCTYPE root [<!ENTITY wrong \\"<p\\">]><root>&wrong;</root>
		  ^"
	`);
	});

	it('returns an error for entities that expand to content that is not well-formed', () => {
		const xml = `<!DOCTYPE root [<!ENTITY wrong "<p>text">]><root>&wrong;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(
			`"replacement text for entity \\"wrong\\" is not well-formed - element \\"p\\" is missing a closing tag"`
		);
	});

	it('returns an error for entity references in element tags', () => {
		const xml = `<!DOCTYPE root [<!ENTITY e SYSTEM "external">]><root &e;/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\">\\"
		At line 1, character 54:

		<!DOCTYPE root [<!ENTITY e SYSTEM \\"external\\">]><root &e;/>
		                                                     ^"
	`);
	});

	it('ignores references to external parsed entities', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one SYSTEM 'external'>]><root>&one;</root>`;
		const out = `<!DOCTYPE root><root/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if an unparsed entity is referenced', () => {
		const xml = `<!DOCTYPE root [<!ENTITY binary SYSTEM "uri" NDATA stuff>]><root>&binary;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to binary entity \\"binary\\" is not allowed
		At line 1, character 66:

		…ENTITY binary SYSTEM \\"uri\\" NDATA stuff>]><root>&binary;</root>
		                                                ^^^^^^^^"
	`);
	});

	it('returns an error if an entity in the internal subset contains a reference to a parameter entity', () => {
		const xml = `<!DOCTYPE root [<!ENTITY % pe "ignored"><!ENTITY ge "%pe;">]><root>&ge;</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to parameter entity \\"pe\\" must not occur in an entity declaration in the internal subset
		At line 1, character 54:

		…DOCTYPE root [<!ENTITY % pe \\"ignored\\"><!ENTITY ge \\"%pe;\\">]><root>&ge;</root>
		                                                    ^^^^"
	`);
	});

	it('returns an error if a parameter entity reference occurs within an entity value', () => {
		const xml = `<!DOCTYPE root [<!ENTITY % first SYSTEM "id"><!ENTITY % second "%first;">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to parameter entity \\"first\\" must not occur in an entity declaration in the internal subset
		At line 1, character 65:

		…<!ENTITY % first SYSTEM \\"id\\"><!ENTITY % second \\"%first;\\">]><root/>
		                                                 ^^^^^^^"
	`);
	});

	it('can handle the first example from appendix D', () => {
		const xml = `<!DOCTYPE test [<!ENTITY example "<p>An ampersand (&#38;#38;) may be escaped
		numerically (&#38;#38;#38;) or with a general entity
		(&amp;amp;).</p>" >]><root>&example;</root>`;
		const out = `<!DOCTYPE test><root><p>An ampersand (&amp;) may be escaped
		numerically (&amp;#38;) or with a general entity
		(&amp;amp;).</p></root>`.replace(/\r\n?/g, '\n');
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can get attributes from their defaults in the DTD', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST root attr CDATA "value">]><root><root attr="override"/></root>`;
		const out = `<!DOCTYPE root><root attr="value"><root attr="override"/></root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('ignores duplicate declarations for attributes but merges duplicate attribute lists for elements', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST root a CDATA "a" b CDATA "b"><!ATTLIST root b CDATA "bbb" c CDATA "c">]><root/>`;
		const out = `<!DOCTYPE root><root a="a" b="b" c="c"/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can get namespace declarations from their defaults in the DTD', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST root xmlns CDATA "ns1">]><root><root xmlns="ns2"/></root>`;
		const out = `<!DOCTYPE root><root xmlns="ns1"><root xmlns="ns2"/></root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can normalize attribute values', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST root id ID #IMPLIED n NOTATION (a|b) #IMPLIED e (one | two) #REQUIRED>]><root id=" \t\r\nbla\t\r\n " attr=" \t\r\nbla&#9;\t\r\n "/>`;
		const out = `<!DOCTYPE root><root id="bla" attr="   bla&#9;   "/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('can normalize attribute values (2)', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST root a NMTOKENS "a default">]><root a=" a b c "/>`;
		const out = `<!DOCTYPE root><root a="a b c"/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('supports entities in attribute values', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;&#38;two;&amp;two;"><!ENTITY two "prrt">]><root attr="&amp;&one;"/>`;
		const out = `<!DOCTYPE root><root attr="&amp;prrtprrt&amp;two;"/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('ignores duplicate entity definitions', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one "one"><!ENTITY one "two">]><root attr="&one;"/>`;
		const out = `<!DOCTYPE root><root attr="one"/>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error for references to unknown entities in attribute values', () => {
		const xml = `<!DOCTYPE root><root attr="&one;"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to unknown entity \\"one\\" in attribute value
		At line 1, character 28:

		<!DOCTYPE root><root attr=\\"&one;\\"/>
		                           ^^^^^"
	`);
	});

	it('returns an error if an attlist references an entity that is not defined earlier', () => {
		const xml = `<!DOCTYPE root [<!ATTLIST el a CDATA "&e;"><!ENTITY e "v">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"default value of attribute \\"a\\" contains reference to undefined entity \\"e\\"
		At line 1, character 39:

		<!DOCTYPE root [<!ATTLIST el a CDATA \\"&e;\\"><!ENTITY e \\"v\\">]><root/>
		                                      ^^^"
	`);
	});

	it('returns an error for recursive entities in attribute values', () => {
		const xml = `<!DOCTYPE root [<!ENTITY one "&two;"><!ENTITY two '&one;'>]><root attr="&one;"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to entity \\"one\\" must not be recursive
		At line 1, character 1:

		&one;
		^^^^^"
	`);
	});

	it('returns an error for external entity references in attribute values', () => {
		const xml = `<!DOCTYPE root [<!ENTITY e "&ext;"><!ENTITY ext SYSTEM "ext">]><root attr='&e;'/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to external entity \\"ext\\" is not allowed in attribute value
		At line 1, character 1:

		&ext;
		^^^^^"
	`);
	});

	it('returns an error for external entity references in default attribute values', () => {
		const xml = `<!DOCTYPE root [<!ENTITY ext SYSTEM "ext"><!ATTLIST root attr CDATA "&ext;">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"default value of attribute \\"attr\\" must not contain reference to external entity \\"ext\\"
		At line 1, character 70:

		…NTITY ext SYSTEM \\"ext\\"><!ATTLIST root attr CDATA \\"&ext;\\">]><root/>
		                                                   ^^^^^"
	`);
	});

	it('returns an error if the replacement text for an entity reference in an attribute value contains <', () => {
		const xml = `<!DOCTYPE root [<!ENTITY x "&#60;">]><root attr='&x;'/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing replacement text for entity \\"x\\" failed, expected \\"end of input\\"
		At line 1, character 1:

		<
		^"
	`);
	});

	it('returns an error document if parsing fails', () => {
		const xml = 'NOT A VALID DOCUMENT';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"<\\"
		At line 1, character 1:

		NOT A VALID DOCUMENT
		^"
	`);
	});

	it('returns an error document if the document is not well-formed', () => {
		const xml = '<root></toot>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"non-well-formed element: found end tag \\"toot\\" but expected \\"root\\"
		At line 1, character 7:

		<root></toot>
		      ^^^^^^^"
	`);
	});

	it('returns an error if a PI has target "xml"', () => {
		const xml = '<root><?xml version="1.0"?></root>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected 'processing instruction target must not be \\"xml\\"'
		At line 1, character 9:

		<root><?xml version=\\"1.0\\"?></root>
		        ^"
	`);
	});

	it('returns an error if a PI has target "xml" in the DTD', () => {
		const xml = '<!DOCTYPE root [<?xml version="1.0"?>]><root/>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected 'processing instruction target must not be \\"xml\\"'
		At line 1, character 19:

		<!DOCTYPE root [<?xml version=\\"1.0\\"?>]><root/>
		                  ^"
	`);
	});

	it('returns an error if there is more than one root element', () => {
		const xml = '<root/><another-root/>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"document must contain a single root element, but found \\"root\\" and \\"another-root\\"
		At line 1, character 9:

		<root/><another-root/>
		        ^^^^^^^^^^^^"
	`);
	});

	it('returns an error if the input is empty', () => {
		const xml = '';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"<\\"
		At line 1, character 1:


		^"
	`);
	});

	it('returns an error if there are not enough end tags', () => {
		const xml = '<root>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(
			`"document is not well-formed - element \\"root\\" is missing a closing tag"`
		);
	});

	it('returns an error if there are too many end tags', () => {
		const xml = '<root/></root>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"non-well-formed element: found end tag \\"root\\" but expected no such tag
		At line 1, character 8:

		<root/></root>
		       ^^^^^^^"
	`);
	});

	it('returns an error if an element has duplicate attributes', () => {
		const xml = '<root attr="value" attr="another value"/>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"attribute \\"attr\\" must not appear multiple times on element \\"root\\"
		At line 1, character 20:

		<root attr=\\"value\\" attr=\\"another value\\"/>
		                   ^^^^"
	`);
	});

	it('returns an error if an element has attributes with the same expanded name', () => {
		const xml = '<root xmlns:a="ns" xmlns:b="ns" a:attr="value" b:attr="another value"/>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"attribute \\"b:attr\\" must not appear multiple times on element \\"root\\"
		At line 1, character 48:

		<root xmlns:a=\\"ns\\" xmlns:b=\\"ns\\" a:attr=\\"value\\" b:attr=\\"another value\\"/>
		                                               ^^^^^^"
	`);
	});

	it('parses element declarations and notations but does not use them to validate content', () => {
		const xml = `<!DOCTYPE root [<!ELEMENT root (one, two, (three | (four, five)+))*><!NOTATION not PUBLIC "id">]><root><two/></root>`;
		const out = `<!DOCTYPE root><root><two/></root>`;
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(out);
	});

	it('returns an error if text contains an invalid character', () => {
		const xml = `<root>\u{19}</root>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"end of input\\"
		At line 1, character 7:

		<root>[invalid character]</root>
		      ^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('returns an error if an entity text contains an invalid character (double quotes)', () => {
		const xml = `<!DOCTYPE root [<!ENTITY a "\u{19}">]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected '\\"'
		At line 1, character 29:

		<!DOCTYPE root [<!ENTITY a \\"[invalid character]\\">]><root/>
		                            ^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('returns an error if an entity text contains an invalid character (single quotes)', () => {
		const xml = `<!DOCTYPE root [<!ENTITY a '\u{19}'>]><root/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"'\\"
		At line 1, character 29:

		<!DOCTYPE root [<!ENTITY a '[invalid character]'>]><root/>
		                            ^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('returns an error if an attribute contains an invalid character (double quotes)', () => {
		const xml = `<root attr="\u{19}"/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected '\\"'
		At line 1, character 13:

		<root attr=\\"[invalid character]\\"/>
		            ^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('returns an error if an attribute contains an invalid character (single quotes)', () => {
		const xml = `<root attr='\u{19}'/>`;
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"'\\"
		At line 1, character 13:

		<root attr='[invalid character]'/>
		            ^^^^^^^^^^^^^^^^^^^"
	`);
	});

	it('works with documents starting with a PI that looks like the XML declaration', () => {
		const xml = '<?xml-stylesheet type="text/css" href="styles.css"?><xml/>';
		const doc = slimdom.parseXmlDocument(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(xml);
	});

	it('does not accept a PI with a colon in the name as the first thing in the document', () => {
		const xml = '<?xml:stylesheet type="text/css" href="styles.css"?><xml/>';
		expect(() => slimdom.parseXmlDocument(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing document failed, expected \\"name must not contain colon\\"
		At line 1, character 3:

		<?xml:stylesheet type=\\"text/css\\" href=\\"styles.css\\"?><xml/>
		  ^"
	`);
	});
});
