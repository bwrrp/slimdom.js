import * as slimdom from '../../src/index';
import checkPositions from './checkPositions';

type Sliced =
	| { type: 'element'; startTag: string; endTag: string | null }
	| { type: 'attribute'; span: string; value: string }
	| { type: 'node' | 'xmlDeclaration' | 'textDeclaration'; span: string };

type Positions =
	| Map<slimdom.Node, slimdom.NodePosition>
	| WeakMap<slimdom.Node, slimdom.NodePosition>;

// Creates the map that the tests pass to the parser, set for each run of the tests below
let createPositions: () => Positions;

function parseDocument(input: string, options: slimdom.ParseOptions = {}) {
	const positions = createPositions();
	const document = slimdom.parseXmlDocument(input, { ...options, positions });
	checkPositions(input, document, positions);
	return { document, positions, at: (node: slimdom.Node) => sliced(input, positions, node) };
}

function parseFragment(input: string, options: { treatCDataAsText?: boolean } = {}) {
	const positions = createPositions();
	const fragment = slimdom.parseXmlFragment(input, { ...options, positions });
	checkPositions(input, fragment, positions);
	return { fragment, positions, at: (node: slimdom.Node) => sliced(input, positions, node) };
}

// Replaces each span of the position of node with the text it covers, to make tests readable
function sliced(input: string, positions: Positions, node: slimdom.Node): Sliced | undefined {
	const position = positions.get(node);
	if (position === undefined) {
		return undefined;
	}
	const text = (span: slimdom.Span) => input.slice(span.start, span.end);
	switch (position.type) {
		case 'element':
			return {
				type: 'element',
				startTag: text(position.startTag),
				endTag: position.endTag && text(position.endTag),
			};
		case 'attribute':
			return { type: 'attribute', span: text(position.span), value: text(position.value) };
		default:
			return { type: position.type, span: text(position.span) };
	}
}

describe.each([
	['WeakMap', () => new WeakMap<slimdom.Node, slimdom.NodePosition>()],
	['Map', () => new Map<slimdom.Node, slimdom.NodePosition>()],
])('positions in a %s', (_name, create) => {
	beforeEach(() => {
		createPositions = create;
	});

	describe('elements', () => {
		it('records the start and end tags', () => {
			const { document, at } = parseDocument('<root><child >text</child\n></root>');
			const root = document.documentElement!;
			expect(at(root)).toEqual({ type: 'element', startTag: '<root>', endTag: '</root>' });
			expect(at(root.firstChild!)).toEqual({
				type: 'element',
				startTag: '<child >',
				endTag: '</child\n>',
			});
		});

		it('records an empty-element tag without end tag', () => {
			const { document, at } = parseDocument('<root><empty a="1" /><other></other></root>');
			const [empty, other] = document.documentElement!.childNodes;
			expect(at(empty)).toEqual({
				type: 'element',
				startTag: '<empty a="1" />',
				endTag: null,
			});
			expect(at(other)).toEqual({ type: 'element', startTag: '<other>', endTag: '</other>' });
		});

		it('records the exact offsets', () => {
			const { document, positions } = parseDocument('<a><b/></a>');
			const a = document.documentElement!;
			expect(positions.get(a)).toEqual({
				type: 'element',
				startTag: { start: 0, end: 3 },
				endTag: { start: 7, end: 11 },
			});
			expect(positions.get(a.firstChild!)).toEqual({
				type: 'element',
				startTag: { start: 3, end: 7 },
				endTag: null,
			});
		});
	});

	describe('attributes', () => {
		it('records the whole attribute and its value including the quotes', () => {
			const { document, at } = parseDocument(
				`<root a="1" b = 'two'\n\tc\n=\n"x &amp; &#x79;" xmlns:p="urn:p" p:d=""/>`
			);
			const root = document.documentElement!;
			expect(at(root.getAttributeNode('a')!)).toEqual({
				type: 'attribute',
				span: 'a="1"',
				value: '"1"',
			});
			expect(at(root.getAttributeNode('b')!)).toEqual({
				type: 'attribute',
				span: "b = 'two'",
				value: "'two'",
			});
			expect(at(root.getAttributeNode('c')!)).toEqual({
				type: 'attribute',
				span: 'c\n=\n"x &amp; &#x79;"',
				value: '"x &amp; &#x79;"',
			});
			expect(at(root.getAttributeNode('xmlns:p')!)).toEqual({
				type: 'attribute',
				span: 'xmlns:p="urn:p"',
				value: '"urn:p"',
			});
			expect(at(root.getAttributeNodeNS('urn:p', 'd')!)).toEqual({
				type: 'attribute',
				span: 'p:d=""',
				value: '""',
			});
		});

		it('records no position for attributes defaulted from the DTD', () => {
			const { document, at } = parseDocument(
				'<!DOCTYPE root [<!ATTLIST root def CDATA "default">]><root given="1"/>'
			);
			const root = document.documentElement!;
			expect(root.getAttribute('def')).toBe('default');
			expect(at(root.getAttributeNode('def')!)).toBeUndefined();
			expect(at(root.getAttributeNode('given')!)).toEqual({
				type: 'attribute',
				span: 'given="1"',
				value: '"1"',
			});
		});
	});

	describe('text', () => {
		it('records text', () => {
			const { document, at } = parseDocument('<root>some text</root>');
			expect(at(document.documentElement!.firstChild!)).toEqual({
				type: 'node',
				span: 'some text',
			});
		});

		it('records text with character references and predefined entities', () => {
			const { document, at } = parseDocument('<root>&#x41;&lt;b&gt;&amp;</root>');
			const text = document.documentElement!.firstChild!;
			expect(text.nodeValue).toBe('A<b>&');
			expect(at(text)).toEqual({ type: 'node', span: '&#x41;&lt;b&gt;&amp;' });
		});

		it('includes references to entities whose replacement text is only text', () => {
			const { document, at } = parseDocument(
				'<!DOCTYPE root [<!ENTITY e "entity &#38;lt; text">]><root>&e; and more &e;</root>'
			);
			const text = document.documentElement!.firstChild!;
			expect(text.nodeValue).toBe('entity < text and more entity < text');
			expect(at(text)).toEqual({ type: 'node', span: '&e; and more &e;' });
		});

		it('records no position for text that contains part of an entity with markup', () => {
			const { document, at } = parseDocument(
				'<!DOCTYPE root [<!ENTITY e "in<x/>out">]><root>before&e;after<y/>last</root>'
			);
			const [before, x, after, y, last] = document.documentElement!.childNodes;
			expect(before.nodeValue).toBe('beforein');
			expect(at(before)).toBeUndefined();
			expect(at(x)).toBeUndefined();
			expect(after.nodeValue).toBe('outafter');
			expect(at(after)).toBeUndefined();
			expect(at(y)).toEqual({ type: 'element', startTag: '<y/>', endTag: null });
			expect(at(last)).toEqual({ type: 'node', span: 'last' });
		});

		it('records text before an entity that starts with markup', () => {
			const { document, at } = parseDocument(
				'<!DOCTYPE root [<!ENTITY e "<x>inner</x>">]><root>before&e;</root>'
			);
			const [before, x] = document.documentElement!.childNodes;
			expect(at(before)).toEqual({ type: 'node', span: 'before' });
			expect(at(x)).toBeUndefined();
			expect(at(x.firstChild!)).toBeUndefined();
		});

		it('includes CDATA sections in text when they are treated as text', () => {
			const { document, at } = parseDocument('<root>a<![CDATA[<b>]]>c</root>', {
				treatCDataAsText: true,
			});
			const text = document.documentElement!.firstChild!;
			expect(text.nodeValue).toBe('a<b>c');
			expect(at(text)).toEqual({ type: 'node', span: 'a<![CDATA[<b>]]>c' });
		});
	});

	describe('other nodes', () => {
		it('records CDATA sections, comments and processing instructions', () => {
			const { document, at } = parseDocument(
				'<root><![CDATA[<raw>]]><!-- comment --><?target data?><?empty?></root>'
			);
			const [cdata, comment, pi, emptyPi] = document.documentElement!.childNodes;
			expect(at(cdata)).toEqual({ type: 'node', span: '<![CDATA[<raw>]]>' });
			expect(at(comment)).toEqual({ type: 'node', span: '<!-- comment -->' });
			expect(at(pi)).toEqual({ type: 'node', span: '<?target data?>' });
			expect(at(emptyPi)).toEqual({ type: 'node', span: '<?empty?>' });
		});

		it('records nodes before and after the document element', () => {
			const { document, at } = parseDocument(
				'<!-- before --><?pi before?>\n<!DOCTYPE root SYSTEM "root.dtd" [\n<!ELEMENT root EMPTY>\n]>\n<root/><!-- after -->'
			);
			const [comment, pi, doctype, root, after] = document.childNodes;
			expect(at(comment)).toEqual({ type: 'node', span: '<!-- before -->' });
			expect(at(pi)).toEqual({ type: 'node', span: '<?pi before?>' });
			expect(at(doctype)).toEqual({
				type: 'node',
				span: '<!DOCTYPE root SYSTEM "root.dtd" [\n<!ELEMENT root EMPTY>\n]>',
			});
			expect(at(root)).toEqual({ type: 'element', startTag: '<root/>', endTag: null });
			expect(at(after)).toEqual({ type: 'node', span: '<!-- after -->' });
		});

		it('records no position for nodes from the replacement text of an entity', () => {
			const { document, at } = parseDocument(
				'<!DOCTYPE root [<!ENTITY e "<x a=\'1\'><!--c--><?pi?><![CDATA[d]]></x>">]><root>&e;</root>'
			);
			const x = document.documentElement!.firstChild as slimdom.Element;
			expect(at(x)).toBeUndefined();
			expect(at(x.getAttributeNode('a')!)).toBeUndefined();
			for (const child of x.childNodes) {
				expect(at(child)).toBeUndefined();
			}
		});
	});

	describe('declarations', () => {
		it('records the XML declaration for the document', () => {
			const { document, at } = parseDocument(
				'<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n<root/>'
			);
			expect(at(document)).toEqual({
				type: 'xmlDeclaration',
				span: '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>',
			});
		});

		it('records nothing for a document without XML declaration', () => {
			const { document, at } = parseDocument('<root/>');
			expect(at(document)).toBeUndefined();
		});

		it('records the text declaration for a fragment', () => {
			const { fragment, at } = parseFragment('<?xml encoding="utf-8"?>text<a/>more');
			expect(at(fragment)).toEqual({
				type: 'textDeclaration',
				span: '<?xml encoding="utf-8"?>',
			});
			const [text, a, more] = fragment.childNodes;
			expect(at(text)).toEqual({ type: 'node', span: 'text' });
			expect(at(a)).toEqual({ type: 'element', startTag: '<a/>', endTag: null });
			expect(at(more)).toEqual({ type: 'node', span: 'more' });
		});

		it('records nothing for a fragment without text declaration', () => {
			const { fragment, at } = parseFragment('text<a>b</a>');
			expect(at(fragment)).toBeUndefined();
			expect(at(fragment.firstChild!)).toEqual({ type: 'node', span: 'text' });
			expect(at(fragment.lastChild!)).toEqual({
				type: 'element',
				startTag: '<a>',
				endTag: '</a>',
			});
		});
	});

	describe('offsets in the original input', () => {
		it('counts both characters of CR LF', () => {
			const input = '<root>\r\n<a/>x\r\ny\r\n</root>';
			const { document, positions } = parseDocument(input);
			const [, a, text] = document.documentElement!.childNodes;
			expect(positions.get(a)).toEqual({
				type: 'element',
				startTag: { start: 8, end: 12 },
				endTag: null,
			});
			expect(text.nodeValue).toBe('x\ny\n');
			expect(positions.get(text)).toEqual({ type: 'node', span: { start: 12, end: 18 } });
			expect(input.slice(18)).toBe('</root>');
		});

		it('counts a CR on its own as one character', () => {
			const input = '<root>\r<a/>\r</root>';
			const { document, positions } = parseDocument(input);
			const [, a] = document.documentElement!.childNodes;
			expect(positions.get(a)).toEqual({
				type: 'element',
				startTag: { start: 7, end: 11 },
				endTag: null,
			});
			expect(positions.get(document.documentElement!)).toEqual({
				type: 'element',
				startTag: { start: 0, end: 6 },
				endTag: { start: 12, end: 19 },
			});
		});

		it('counts the byte order mark', () => {
			const input = '\uFEFF<?xml version="1.0"?><root/>';
			const { document, positions } = parseDocument(input);
			expect(positions.get(document)).toEqual({
				type: 'xmlDeclaration',
				span: { start: 1, end: 22 },
			});
			expect(positions.get(document.documentElement!)).toEqual({
				type: 'element',
				startTag: { start: 22, end: 29 },
				endTag: null,
			});
		});

		it('counts the byte order mark and CR LF in a fragment', () => {
			const input = '\uFEFF<?xml encoding="utf-8"?>\r\n<a\r\nb="1"/>';
			const { fragment, at } = parseFragment(input);
			expect(at(fragment)).toEqual({
				type: 'textDeclaration',
				span: '<?xml encoding="utf-8"?>',
			});
			const a = fragment.lastChild as slimdom.Element;
			expect(at(fragment.firstChild!)).toEqual({ type: 'node', span: '\r\n' });
			expect(at(a)).toEqual({ type: 'element', startTag: '<a\r\nb="1"/>', endTag: null });
			expect(at(a.getAttributeNode('b')!)).toEqual({
				type: 'attribute',
				span: 'b="1"',
				value: '"1"',
			});
		});

		it('translates offsets that come before offsets translated earlier', () => {
			// The start tag is recorded before its attributes, so translating the offsets of
			// attribute a has to go back over the CR LF after it
			const input = '<root\r\na="1"\r\nb="2"\r\n>\r\n<x/>\r\n</root>';
			const { document, positions, at } = parseDocument(input);
			const root = document.documentElement!;
			expect(at(root)).toEqual({
				type: 'element',
				startTag: '<root\r\na="1"\r\nb="2"\r\n>',
				endTag: '</root>',
			});
			expect(positions.get(root.getAttributeNode('a')!)).toEqual({
				type: 'attribute',
				span: { start: 7, end: 12 },
				value: { start: 9, end: 12 },
			});
			expect(at(root.getAttributeNode('b')!)).toEqual({
				type: 'attribute',
				span: 'b="2"',
				value: '"2"',
			});
			expect(at(root.firstElementChild!)).toEqual({
				type: 'element',
				startTag: '<x/>',
				endTag: null,
			});
		});

		it('handles CR LF inside comments, attribute values and the doctype', () => {
			const input =
				'<!DOCTYPE root [\r\n<!ENTITY e "x">\r\n]>\r\n<!--a\r\nb-->\r\n<root a="1\r\n2">&e;\r\n</root>';
			const { document, at } = parseDocument(input);
			const [doctype, comment, root] = document.childNodes;
			expect(at(doctype)).toEqual({
				type: 'node',
				span: '<!DOCTYPE root [\r\n<!ENTITY e "x">\r\n]>',
			});
			expect(at(comment)).toEqual({ type: 'node', span: '<!--a\r\nb-->' });
			expect(at((root as slimdom.Element).getAttributeNode('a')!)).toEqual({
				type: 'attribute',
				span: 'a="1\r\n2"',
				value: '"1\r\n2"',
			});
			expect(at(root.firstChild!)).toEqual({ type: 'node', span: '&e;\r\n' });
		});
	});
});
