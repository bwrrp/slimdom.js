import {
	Attr,
	CDATASection,
	Comment,
	Document,
	DocumentFragment,
	DocumentType,
	Element,
	Node,
	NodePosition,
	ProcessingInstruction,
	Span,
	Text,
} from '../../src/index';

function normalize(text: string): string {
	return text.replace(/\r\n?/g, '\n');
}

const PREDEFINED_ENTITIES: { [name: string]: string } = {
	lt: '<',
	gt: '>',
	amp: '&',
	apos: "'",
	quot: '"',
};

/**
 * Replaces character references and references to predefined entities. Returns null if the text
 * contains a reference to another entity.
 */
function resolveReferences(text: string): string | null {
	let unknownEntity = false;
	const resolved = text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[^;]+);/g, (_, ref: string) => {
		if (ref.startsWith('#x')) {
			return String.fromCodePoint(parseInt(ref.slice(2), 16));
		}
		if (ref.startsWith('#')) {
			return String.fromCodePoint(parseInt(ref.slice(1), 10));
		}
		if (ref in PREDEFINED_ENTITIES) {
			return PREDEFINED_ENTITIES[ref];
		}
		unknownEntity = true;
		return '';
	});
	return unknownEntity ? null : resolved;
}

/**
 * Checks that the positions recorded while parsing input into root are consistent with the parsed
 * nodes:
 *
 * - each span points to the text of its node;
 * - the spans are in document order and do not overlap;
 * - the spans of children are between the start and end tags of their parent;
 * - if the input has no DTD, every node has a position.
 */
export default function checkPositions(
	input: string,
	root: Document | DocumentFragment,
	positions: WeakMap<Node, NodePosition>
): void {
	const hasDtd = root.nodeType === Node.DOCUMENT_NODE && (root as Document).doctype !== null;
	let cursor = input.charCodeAt(0) === 0xfeff ? 1 : 0;

	function slice(span: Span): string {
		return input.slice(span.start, span.end);
	}

	function advance(span: Span, what: string): void {
		if (span.start < cursor || span.end < span.start) {
			throw new Error(
				`${what} spans ${span.start}-${span.end}, which is before ${cursor} or reversed`
			);
		}
		cursor = span.end;
	}

	function expectText(actual: string, expected: string, what: string): void {
		if (actual !== expected) {
			throw new Error(
				`${what}: span contains ${JSON.stringify(actual)}, expected ${JSON.stringify(
					expected
				)}`
			);
		}
	}

	function expectMatch(actual: string, pattern: RegExp, what: string): void {
		if (!pattern.test(actual)) {
			throw new Error(
				`${what}: span contains ${JSON.stringify(actual)}, expected ${pattern}`
			);
		}
	}

	function escape(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function checkAttribute(attr: Attr, startTag: Span): void {
		const position = positions.get(attr);
		if (position === undefined) {
			// Attributes defaulted from the DTD have no position
			if (!hasDtd) {
				throw new Error(`attribute ${attr.name} has no position`);
			}
			return;
		}
		if (position.type !== 'attribute') {
			throw new Error(`attribute ${attr.name} has a position of type ${position.type}`);
		}
		const what = `attribute ${attr.name}`;
		if (position.span.start < startTag.start || position.span.end > startTag.end) {
			throw new Error(`${what} is outside its start tag`);
		}
		if (position.value.end !== position.span.end) {
			throw new Error(`${what}: value does not end the attribute`);
		}
		const whole = slice(position.span);
		const value = slice(position.value);
		expectMatch(
			whole,
			new RegExp(`^${escape(attr.name)}[\\x20\\t\\r\\n]*=[\\x20\\t\\r\\n]*${escape(value)}$`),
			what
		);
		expectMatch(value, /^("[^"]*"|'[^']*')$/, `${what} value`);
		if (!hasDtd) {
			// Without a DTD, every attribute is CDATA and only references and white space change
			const resolved = resolveReferences(
				normalize(value.slice(1, -1)).replace(/[\n\t]/g, ' ')
			);
			if (resolved !== null) {
				expectText(resolved, attr.value, `${what} value`);
			}
		}
	}

	function checkNode(node: Node): void {
		const position = positions.get(node);
		if (position === undefined) {
			if (!hasDtd) {
				throw new Error(`${node.nodeName} has no position`);
			}
			// Content from the replacement text of an entity, check its descendants anyway
			for (const child of node.childNodes) {
				checkNode(child);
			}
			return;
		}

		const what = node.nodeName;
		switch (node.nodeType) {
			case Node.ELEMENT_NODE: {
				const element = node as Element;
				if (position.type !== 'element') {
					throw new Error(`${what} has a position of type ${position.type}`);
				}
				advance(position.startTag, `start tag of ${what}`);
				expectMatch(
					slice(position.startTag),
					new RegExp(
						`^<${escape(element.nodeName)}([\\x20\\t\\r\\n][^]*)?${
							position.endTag === null ? '/>' : '(?<!/)>'
						}$`
					),
					`start tag of ${what}`
				);
				for (const attr of element.attributes) {
					checkAttribute(attr, position.startTag);
				}
				for (const child of element.childNodes) {
					checkNode(child);
				}
				if (position.endTag === null) {
					if (element.firstChild !== null) {
						throw new Error(`${what} has an empty-element tag but children`);
					}
				} else {
					advance(position.endTag, `end tag of ${what}`);
					expectMatch(
						slice(position.endTag),
						new RegExp(`^</${escape(element.nodeName)}[\\x20\\t\\r\\n]*>$`),
						`end tag of ${what}`
					);
				}
				return;
			}

			case Node.ATTRIBUTE_NODE:
				throw new Error('attributes are checked with their element');
		}

		if (position.type !== 'node') {
			throw new Error(`${what} has a position of type ${position.type}`);
		}
		advance(position.span, what);
		const text = slice(position.span);
		switch (node.nodeType) {
			case Node.TEXT_NODE: {
				// With treatCDataAsText, text may contain CDATA sections (odd pieces of the split)
				const pieces = normalize(text).split(/<!\[CDATA\[([^]*?)\]\]>/);
				let resolved: string | null = '';
				for (let i = 0; i < pieces.length; ++i) {
					if (i % 2 === 1) {
						resolved = resolved === null ? null : resolved + pieces[i];
						continue;
					}
					expectMatch(pieces[i], /^[^<]*$/, what);
					const piece = resolveReferences(pieces[i]);
					resolved = resolved === null || piece === null ? null : resolved + piece;
				}
				if (resolved !== null) {
					expectText(resolved, (node as Text).data, what);
				}
				return;
			}

			case Node.CDATA_SECTION_NODE:
				expectText(normalize(text), `<![CDATA[${(node as CDATASection).data}]]>`, what);
				return;

			case Node.COMMENT_NODE:
				expectText(normalize(text), `<!--${(node as Comment).data}-->`, what);
				return;

			case Node.PROCESSING_INSTRUCTION_NODE: {
				const pi = node as ProcessingInstruction;
				expectMatch(
					normalize(text),
					new RegExp(
						`^<\\?${escape(pi.target)}(${
							pi.data === '' ? '[\\x20\\t\\n]*' : `[\\x20\\t\\n]+${escape(pi.data)}`
						})\\?>$`
					),
					what
				);
				return;
			}

			case Node.DOCUMENT_TYPE_NODE:
				expectMatch(
					text,
					new RegExp(
						`^<!DOCTYPE[\\x20\\t\\r\\n]+${escape((node as DocumentType).name)}[^]*>$`
					),
					what
				);
				return;
		}
		throw new Error(`unexpected node type ${node.nodeType}`);
	}

	const declaration = positions.get(root);
	const hasDeclaration = /^\uFEFF?<\?xml[\x20\t\r\n]/.test(input);
	if (declaration === undefined) {
		if (hasDeclaration) {
			throw new Error('declaration has no position');
		}
	} else {
		const expectedType =
			root.nodeType === Node.DOCUMENT_NODE ? 'xmlDeclaration' : 'textDeclaration';
		if (declaration.type !== expectedType) {
			throw new Error(`declaration has a position of type ${declaration.type}`);
		}
		if (!hasDeclaration) {
			throw new Error('input has no declaration, but it has a position');
		}
		advance(declaration.span, 'declaration');
		expectMatch(slice(declaration.span), /^<\?xml[\x20\t\r\n][^]*\?>$/, 'declaration');
	}

	for (const child of root.childNodes) {
		checkNode(child);
	}
}
