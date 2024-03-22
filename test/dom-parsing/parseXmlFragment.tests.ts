import * as slimdom from '../../src/index';

describe('parseXmlFragment', () => {
	it('can parse an XML fragment', () => {
		const xml = `<?xml version="1.0" encoding="utf-16"?>
			<head>\r\n
				<title>Test document</title>
			</head>
			<body lang="en">
				<h1>Hello &lt;world&gt;!</h1>
				<!-- Comments are awesome! -->
				<?pi can be useful as well?>
				<?pi-with-just-a-target?>
				<![CDATA[<not>an<element/>!]]>
			</body>`;
		const out = `
			<head>\r\n
				<title>Test document</title>
			</head>
			<body lang="en">
				<h1>Hello &lt;world&gt;!</h1>
				<!-- Comments are awesome! -->
				<?pi can be useful as well?>
				<?pi-with-just-a-target ?>
				<![CDATA[<not>an<element/>!]]>
			</body>`.replace(/\r\n?/g, '\n');
		const fragment = slimdom.parseXmlFragment(xml);
		expect(slimdom.serializeToWellFormedString(fragment)).toBe(out);
	});

	it('highlights where an error happens', () => {
		const xml = `<?xml encoding="utf-8"?>
			<root>
				<blah=>Hello</blah>
			</root>`;
		expect(() => slimdom.parseXmlFragment(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing fragment failed, expected ">"
		At line 3, character 10:

						<blah=>Hello</blah>
						     ^"
	`);
	});

	it('can resolve namespaces not defined in the input using a callback', () => {
		const xml = `<a:root xmlns:b="ns-b"><b:child xmlns:a="ns-a" c:attr="val"/></a:root>`;
		const out = `<a:root xmlns:a="resolved-a" xmlns:b="ns-b"><b:child xmlns:a="ns-a" xmlns:c="resolved-c" c:attr="val"/></a:root>`;
		const fragment = slimdom.parseXmlFragment(xml, {
			resolveNamespacePrefix(prefix) {
				return `resolved-${prefix}`;
			},
		});
		expect(slimdom.serializeToWellFormedString(fragment)).toBe(out);
	});

	it('can not yet resolve entity references to entities defined elsewhere', () => {
		const xml = `&entity;`;
		expect(() => slimdom.parseXmlFragment(xml)).toThrowErrorMatchingInlineSnapshot(`
		"reference to unknown entity "entity" in content
		At line 1, character 1:

		&entity;
		^^^^^^^^"
	`);
	});

	it('requires the content to be well-formed', () => {
		const xml = `<missing-end-tag>content`;
		expect(() => slimdom.parseXmlFragment(xml)).toThrowErrorMatchingInlineSnapshot(`
		"fragment is not well-formed - element "missing-end-tag" is missing a closing tag
		At line 1, character 2:

		<missing-end-tag>content
		 ^^^^^^^^^^^^^^^"
		`);
	});

	it('works with fragments starting with a PI that looks like the XML declaration', () => {
		const xml = '<?xml-stylesheet type="text/css" href="styles.css"?>';
		const doc = slimdom.parseXmlFragment(xml);
		expect(slimdom.serializeToWellFormedString(doc)).toBe(xml);
	});

	it('does not accept a PI with a colon in the name as the first thing in the fragment', () => {
		const xml = '<?xml:stylesheet type="text/css" href="styles.css"?>';
		expect(() => slimdom.parseXmlFragment(xml)).toThrowErrorMatchingInlineSnapshot(`
		"Parsing fragment failed, expected "name must not contain colon"
		At line 1, character 3:

		<?xml:stylesheet type="text/css" href="styles.css"?>
		  ^"
	`);
	});
});
