import CDATASection from '../CDATASection';
import Comment from '../Comment';
import Document from '../Document';
import DocumentType from '../DocumentType';
import Element from '../Element';
import Node from '../Node';
import ProcessingInstruction from '../ProcessingInstruction';
import Text from '../Text';
import {
	matchesCharProduction,
	matchesNameProduction,
	matchesPubidCharProduction,
} from '../dom-parsing/parsingAlgorithms';
import { throwInvalidStateError } from '../util/errorHelpers';
import { HTML_NAMESPACE, XML_NAMESPACE, XMLNS_NAMESPACE } from '../util/namespaceHelpers';
import { NodeType } from '../util/NodeType';
import { NamespacePrefixMap, PrefixIndex } from './NamespacePrefixMap';

const HTML_VOID_ELEMENTS = [
	'area',
	'base',
	'basefont',
	'bgsound',
	'br',
	'col',
	'embed',
	'frame',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'menuitem',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
];

// 3.2. Serializing

/**
 * The following steps form the fragment serializing algorithm:
 *
 * @param node                - The node to serialize
 * @param requireWellFormed   - Determines whether the result needs to be well-formed
 * @param withFictionalParent - Whether to treat node as a fictional parent with node as its only
 *                              child
 *
 * @returns A string representing the serialization of node
 */
export function serializeFragment(
	node: Node,
	requireWellFormed: boolean,
	withFictionalParent: boolean = false
): string {
	// 1. Let context document be the value of node's node document.
	// 2. If context document is an HTML document, return an HTML serialization of node.
	// (HTML documents not implemented)

	// 3. Otherwise, context document is an XML document; return an XML serialization of node
	// passing the flag require well-formed.
	// Note: if implemented as stated in the spec, this would make innerHTML return the outerHTML
	// and make outerHTML trigger undefined behavior (the spec doesn't state the type of the
	// fictional node that acts as a parent). Instead, serialize the children only
	const childNodes = withFictionalParent ? [node] : node.childNodes;
	const result: string[] = [];
	for (const child of childNodes) {
		produceXmlSerialization(child, requireWellFormed, result);
	}
	return result.join('');

	// NOTE: The XML serialization defined in this document conforms to the requirements of the XML
	// fragment serialization algorithm defined in [HTML5].
}

// 3.2.1. XML Serialization

/**
 * To produce an XML serialization of a Node node given a flag require well-formed, run the
 * following steps:
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
export function produceXmlSerialization(
	node: Node,
	requireWellFormed: boolean,
	result: string[]
): void {
	// 2. Let prefix map be a new namespace prefix map.
	const prefixMap = NamespacePrefixMap.new();

	// 3. Add the XML namespace with prefix value "xml" to prefix map.
	// (handled above)

	// 4. Let prefix index be a generated namespace prefix index with value 1. The generated
	// namespace prefix index is used to generate a new unique prefix value when no suitable
	// existing namespace prefix is available to serialize a node's namespaceURI (or the
	// namespaceURI of one of node's attributes). See the generate a prefix algorithm.
	const prefixIndex: PrefixIndex = { value: 1 };

	// 5. Return the result of running the XML serialization algorithm on node passing the context
	// namespace namespace, namespace prefix map prefix map, generated namespace prefix index
	// reference to prefix index, and the flag require well-formed. If an exception occurs during
	// the execution of the algorithm, then catch that exception and throw an "InvalidStateError"
	// DOMException.
	try {
		runXmlSerializationAlgorithm(node, prefixMap, prefixIndex, requireWellFormed, result);
	} catch (error) {
		return throwInvalidStateError((error as Error).message);
	}
}

/**
 * The XML serialization algorithm produces an XML serialization of an arbitrary DOM node node based
 * on the node's interface type. Each referenced algorithm is to be passed the arguments as they
 * were recieved by the caller and return their result to the caller. Re-throw any exceptions.
 *
 * @param node              - The node to serialize
 * @param prefixMap         - The namespace prefix map
 * @param prefixIndex       - A reference to the generated namespace prefix index
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 *
 * @returns The serialization of node
 */
function runXmlSerializationAlgorithm(
	node: Node,
	prefixMap: NamespacePrefixMap,
	prefixIndex: PrefixIndex,
	requireWellFormed: boolean,
	result: string[]
): void {
	// If node's interface is:
	switch (node.nodeType) {
		// Element: Run the algorithm for XML serializing an Element node node.
		case NodeType.ELEMENT_NODE:
			serializeElementNode(node, prefixMap, prefixIndex, requireWellFormed, result);
			return;

		// Document: Run the algorithm for XML serializing a Document node node.
		case NodeType.DOCUMENT_NODE:
			serializeDocumentNode(node, prefixMap, prefixIndex, requireWellFormed, result);
			return;

		// Comment: Run the algorithm for XML serializing a Comment node node.
		case NodeType.COMMENT_NODE:
			serializeCommentNode(node, requireWellFormed, result);
			return;

		// CDATASection: Run the algorithm for XML serializing a CDATASection node node.
		// Note: this is currently commented out in the DOM parsing spec, as it is based on the DOM4
		// spec which removed the CDATASection interface. It seems the interface has been restored
		// in the DOM living standard, so we'll implement its serialization as specced previously.
		case NodeType.CDATA_SECTION_NODE:
			serializeCDATASectionNode(node, requireWellFormed, result);
			return;

		// Text: Run the algorithm for XML serializing a Text node node.
		case NodeType.TEXT_NODE:
			serializeTextNode(node, requireWellFormed, result);
			return;

		// DocumentFragment: Run the algorithm for XML serializing a DocumentFragment node node.
		case NodeType.DOCUMENT_FRAGMENT_NODE:
			serializeDocumentFragmentNode(node, prefixMap, prefixIndex, requireWellFormed, result);
			return;

		// DocumentType: Run the algorithm for XML serializing a DocumentType node node.
		case NodeType.DOCUMENT_TYPE_NODE:
			serializeDocumentTypeNode(node, requireWellFormed, result);
			return;

		// ProcessingInstruction: Run the algorithm for XML serializing a ProcessingInstruction node
		// node.
		case NodeType.PROCESSING_INSTRUCTION_NODE:
			serializeProcessingInstructionNode(node, requireWellFormed, result);
			return;

		// An Attr object: Return an empty string.
		case NodeType.ATTRIBUTE_NODE:
			return;

		// Anything else: Throw a TypeError. Only Nodes and Attr objects can be serialized by this
		// algorithm.
		// (not reachable from public API)
		/* istanbul ignore next */
		default:
			throw new TypeError('Only Nodes and Attr objects can be serialized by this algorithm.');
	}
}

/**
 * 3.2.1.1 XML serializing an Element node
 *
 * @param node              - The node to serialize
 * @param prefixMap         - The namespace prefix map
 * @param prefixIndex       - A reference to the generated namespace prefix index
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeElementNode(
	node: Node,
	prefixMap: NamespacePrefixMap,
	prefixIndex: PrefixIndex,
	requireWellFormed: boolean,
	result: string[]
): void {
	const element = node as Element;
	// If the require well-formed flag is set (its value is true), and this node's localName
	// attribute contains the character ":" (U+003A COLON) or does not match the XML Name
	// production, then throw an exception; the serialization of this node would not be a
	// well-formed element.
	if (
		requireWellFormed &&
		(element.localName.indexOf(':') >= 0 || !matchesNameProduction(element.localName))
	) {
		throw new Error(
			`Can not serialize an element because the localName "${element.localName}" is not allowed.`
		);
	}

	// 2. Let markup be the string "<" (U+003C LESS-THAN SIGN).
	result.push('<');

	// 3. Let qualified name be an empty string.
	let qualifiedName = '';

	// 4. Let skip end tag be a boolean flag with value false.
	let skipEndTag = false;

	// 5. Let ignore namespace definition attribute be a boolean flag with value false.
	// (alternate approach used to determine if declarations should be omitted)

	// 6. Given prefix map, copy a namespace prefix map and let map be the result.
	const map = prefixMap.recordNamespaceInformation(element);

	// 7. Let local prefixes map be an empty map. The map has unique Node prefix strings as its
	// keys, with corresponding namespaceURI Node values as the map's key values (in this map, the
	// null namespace is represented by the empty string).
	// NOTE: This map is local to each element. It is used to ensure there are no conflicting
	// prefixes should a new namespace prefix attribute need to be generated. It is also used to
	// enable skipping of duplicate prefix definitions when writing an element's attributes: the map
	// allows the algorithm to distinguish between a prefix in the namespace prefix map that might
	// be locally-defined (to the current Element) and one that is not.
	// (local prefixes tracked in prefixMap)

	// 8. Let local default namespace be the result of recording the namespace information for node
	// given map and local prefixes map.
	// NOTE: The above step will update map with any found namespace prefix definitions, add the
	// found prefix definitions to the local prefixes map and return a local default namespace value
	// defined by a default namespace attribute if one exists. Otherwise it returns null.
	// (default namespace tracked in prefixMap)

	// 9. Let inherited ns be a copy of namespace.
	// (inherited namespace tracked in prefixMap)

	// 10. Let ns be the value of node's namespaceURI attribute.
	// (unnecessary alias)

	// (various branches omitted as the specification contains bugs)

	// 12.3. If the value of prefix matches "xmlns", then run the following steps:
	// 12.3.1. If the require well-formed flag is set, then throw an error. An Element with
	// prefix "xmlns" will not legally round-trip in a conforming XML parser.
	if (element.prefix === 'xmlns' && requireWellFormed) {
		throw new Error(
			'Can not serialize an element with prefix "xmlns" because it will ' +
				'not legally round-trip in a conforming XML parser.'
		);
	}

	const prefix = map.getPreferredPrefix(element, prefixIndex);

	if (prefix !== null) {
		qualifiedName += `${prefix}:`;
	}
	qualifiedName += element.localName;
	result.push(qualifiedName);

	if (map.prefixToNamespace(prefix) !== element.namespaceURI) {
		// We may have redeclared this prefix or default namespace
		map.add(prefix, element.namespaceURI);

		if (prefix === null) {
			result.push(' xmlns="');
		} else {
			result.push(' xmlns:', prefix, '="');
		}
		result.push(serializeAttributeValue(element.namespaceURI, requireWellFormed), '"');
	}

	// 13. Append to markup the result of the XML serialization of node's attributes given map,
	// prefix index, local prefixes map, ignore namespace definition attribute flag, and require
	// well-formed flag.
	serializeAttributes(element, map, prefixIndex, requireWellFormed, result);

	// 14. If ns is the HTML namespace, and the node's list of children is empty, and the node's
	// localName matches any one of the following void elements: "area", "base", "basefont",
	// "bgsound", "br", "col", "embed", "frame", "hr", "img", "input", "keygen", "link", "menuitem",
	// "meta", "param", "source", "track", "wbr"; then append the following to markup, in the order
	// listed:
	if (
		element.namespaceURI === HTML_NAMESPACE &&
		!element.hasChildNodes() &&
		HTML_VOID_ELEMENTS.indexOf(element.localName) >= 0
	) {
		// 14.1. " " (U+0020 SPACE);
		// 14.2. "/" (U+002F SOLIDUS).
		result.push(' /');

		// and set the skip end tag flag to true.
		skipEndTag = true;
	}

	// 15. If ns is not the HTML namespace, and the node's list of children is empty, then append
	// "/" (U+002F SOLIDUS) to markup and set the skip end tag flag to true.
	if (element.namespaceURI !== HTML_NAMESPACE && !element.hasChildNodes()) {
		result.push('/');
		skipEndTag = true;
	}

	// 16. Append ">" (U+003E GREATER-THAN SIGN) to markup.
	result.push('>');

	// 17. If the value of skip end tag is true, then return the value of markup and skip the
	// remaining steps. The node is a leaf-node.
	if (skipEndTag) {
		return;
	}

	// 18. If ns is the HTML namespace, and the node's localName matches the string "template", then
	// this is a template element. Append to markup the result of XML serializing a DocumentFragment
	// node given the template element's template contents (a DocumentFragment), providing inherited
	// ns, map, prefix index, and the require well-formed flag.
	// NOTE: This allows template content to round-trip , given the rules for parsing XHTML
	// documents.
	// (HTML documents not implemented)

	// 19. Otherwise, append to markup the result of running the XML serialization algorithm on each
	// of node's children, in tree order, providing inherited ns, map, prefix index, and the require
	// well-formed flag.
	for (const child of node.childNodes) {
		runXmlSerializationAlgorithm(child, map, prefixIndex, requireWellFormed, result);
	}

	// 20. Append the following to markup, in the order listed:
	// 20.1. "</" (U+003C LESS-THAN SIGN, U+002F SOLIDUS);
	// 20.2. The value of qualified name;
	// 20.3. ">" (U+003E GREATER-THAN SIGN).
	result.push('</', qualifiedName, '>');

	// 21. Return the value of markup.
}

// 3.2.1.1.3 Serializing an Element's attributes

/**
 * The XML serialization of the attributes of an Element element together with a namespace prefix
 * map map, a generated namespace prefix index prefix index reference, a local prefixes map, a
 * ignore namespace definition attribute flag, and a require well-formed flag, is the result of the
 * following algorithm:
 *
 * @param element                            - The element for which to serialize attributes
 * @param prefixMap                          - The namespace prefix map
 * @param prefixIndex                        - The generated namespace prefix index, by reference
 * @param localPrefixesMap                   - The local prefixes map
 * @param ignoreNamespaceDefinitionAttribute - The ignore namespace definition attribute flag
 * @param requireWellFormed                  - The require well-formed flag
 * @param result                             - Array of strings in which to construct the result
 */
function serializeAttributes(
	element: Element,
	map: NamespacePrefixMap,
	prefixIndex: PrefixIndex,
	requireWellFormed: boolean,
	result: string[]
): void {
	// 1. Let result be the empty string.
	// (result constructed in-place in argument)

	// 2. Let localname set be a new empty namespace localname set. This localname set will contain
	// tuples of unique attribute namespaceURI and localName pairs, and is populated as each attr is
	// processed. This set is used to [optionally] enforce the well-formed constraint that an
	// element cannot have two attributes with the same namespaceURI and localName. This can occur
	// when two otherwise identical attributes on the same element differ only by their prefix
	// values.
	const localNameSet: { namespaceURI: string | null; localName: string }[] = [];

	// 3. Loop: For each attribute attr in element's attributes, in the order they are specified in
	// the element's attribute list:
	for (const attr of element.attributes) {
		// (various branches omitted as the specification contains bugs)
		let prefix = map.getPreferredPrefix(attr, prefixIndex);

		if (attr.namespaceURI === XMLNS_NAMESPACE) {
			// Namespace declaration attribute
			const declaredNamespaceUri = attr.value === '' ? null : attr.value;

			// 3.5.2.2. If the require well-formed flag is set (its value is
			// true), and the value of attr's value attribute matches the XMLNS
			// namespace, then throw an exception; the serialization of this
			// attribute would produce invalid XML because the XMLNS namespace
			// is reserved and cannot be applied as an element's namespace via
			// XML parsing.
			// NOTE: DOM APIs do allow creation of elements in the XMLNS
			// namespace but with strict qualifications.
			if (requireWellFormed && declaredNamespaceUri === XMLNS_NAMESPACE) {
				throw new Error(
					'The serialization of this attribute would produce invalid XML because ' +
						'the XMLNS namespace is reserved and cannot be applied as an ' +
						"element's namespace via XML parsing."
				);
			}

			// Don't declare the XML or XMLNS namespaces
			if (
				declaredNamespaceUri === XML_NAMESPACE ||
				declaredNamespaceUri === XMLNS_NAMESPACE
			) {
				continue;
			}

			const declaredPrefix = attr.prefix === null ? null : attr.localName;
			// 3.5.2.3. If the require well-formed flag is set (its value is
			// true), and the value of attr's value attribute is the empty
			// string, then throw an exception; namespace prefix declarations
			// cannot be used to undeclare a namespace (use a default namespace
			// declaration instead).
			// (we deviate from the spec here by only throwing for prefix
			// declarations, the implementations of this in browsers and the
			// spec text suggest that default namespace declarations should be
			// allowed to reset the default namespace to null)
			if (requireWellFormed && attr.prefix !== null && attr.value === '') {
				throw new Error(
					'Namespace prefix declarations cannot be used to undeclare a namespace. ' +
						'Use a default namespace declaration instead.'
				);
			}

			// The following does not cause an ordering issue as prefixes
			// determined for attributes on the current element will not cause
			// this to change.
			if (!map.shouldSerializeDeclaration(declaredPrefix, declaredNamespaceUri)) {
				continue;
			}
		}

		// 3.1. If the require well-formed flag is set (its value is true), and the localname set
		// contains a tuple whose values match those of a new tuple consisting of attr's
		// namespaceURI attribute and localName attribute, then throw an exception; the
		// serialization of this attr would fail to produce a well-formed element serialization.
		if (
			requireWellFormed &&
			localNameSet.find(
				(tuple) =>
					tuple.localName === attr.localName && tuple.namespaceURI === attr.namespaceURI
			)
		) {
			throw new Error(
				`Can not serialize a duplicate attribute for namespaceURI "${attr.namespaceURI}", localName "${attr.localName}".`
			);
		}

		// 3.2. Create a new tuple consisting of attr's namespaceURI attribute and localName
		// attribute, and add it to the localname set.
		localNameSet.push({ namespaceURI: attr.namespaceURI, localName: attr.localName });

		// 3.8. If the require well-formed flag is set (its value is true), and this attr's
		// localName attribute contains the character ":" (U+003A COLON) or does not match the XML
		// Name production or equals "xmlns" and attribute namespace is null, then throw an
		// exception; the serialization of this attr would not be a well-formed attribute.
		if (
			requireWellFormed &&
			(attr.localName.indexOf(':') >= 0 ||
				!matchesNameProduction(attr.localName) ||
				(attr.localName === 'xmlns' && attr.namespaceURI === null))
		) {
			throw new Error(
				`Can not serialize an attribute because the localName "${attr.localName}" is not allowed.`
			);
		}

		// Do we need a declaration?
		if (prefix !== null && map.prefixToNamespace(prefix) !== attr.namespaceURI) {
			result.push(
				' xmlns:',
				prefix,
				'="',
				serializeAttributeValue(attr.namespaceURI, requireWellFormed),
				'"'
			);
			map.add(prefix, attr.namespaceURI);
		}

		result.push(' ');
		if (prefix !== null) {
			result.push(prefix, ':');
		}
		result.push(
			attr.localName,
			'="',
			serializeAttributeValue(attr.value, requireWellFormed),
			'"'
		);
	}

	// 4. Return the value of result.
}

/**
 * When serializing an attribute value given an attribute value and require well-formed flag, the
 * user agent must run the following steps:
 *
 * @param attributeValue    - The attribute value to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 *
 * @returns The serialized attribute value
 */
function serializeAttributeValue(
	attributeValue: string | null,
	requireWellFormed: boolean
): string {
	// 1. If the require well-formed flag is set (its value is true), and attribute value contains
	// characters that are not matched by the XML Char production, then throw an exception; the
	// serialization of this attribute value would fail to produce a well-formed element
	// serialization.
	if (requireWellFormed && attributeValue !== null && !matchesCharProduction(attributeValue)) {
		throw new Error(
			'Can not serialize an attribute value because it contains invalid characters.'
		);
	}

	// 2. If attribute value is null, then return the empty string.
	if (attributeValue === null) {
		return '';
	}

	// 3. Otherwise, attribute value is a string. Return the value of attribute value, first
	// replacing any occurrences of the following:
	return (
		attributeValue
			// 3.1. "&" with "&amp;"
			.replace(/&/g, '&amp;')
			// 3.2. """ with "&quot;"
			.replace(/"/g, '&quot;')
			// 3.3. "<" with "&lt;"
			.replace(/</g, '&lt;')
			// 3.4. ">" with "&gt;"
			.replace(/>/g, '&gt;')
			// (we deviate from the spec here to also escape whitespace characters, this matches
			// the behavior of Chrome, Firefox and Edge, although the specific encoding varies
			// between those browsers)
			.replace(/\t/g, '&#9;')
			.replace(/\n/g, '&#10;')
			.replace(/\r/g, '&#13;')
	);

	// NOTE: This matches behavior present in browsers, and goes above and beyond the grammar
	// requirement in the XML specification's AttValue production by also replacing ">" characters.
}

/**
 * 3.2.1.2 XML serializing a Document node
 *
 * @param node              - The node to serialize
 * @param prefixMap         - The namespace prefix map
 * @param prefixIndex       - A reference to the generated namespace prefix index
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeDocumentNode(
	node: Node,
	prefixMap: NamespacePrefixMap,
	prefixIndex: PrefixIndex,
	requireWellFormed: boolean,
	result: string[]
): void {
	const document = node as Document;
	// 1. If the require well-formed flag is set (its value is true), and this node has no
	// documentElement (the documentElement attribute's value is null), then throw an exception; the
	// serialization of this node would not be a well-formed document.
	if (requireWellFormed && document.documentElement === null) {
		throw new Error('Can not serialize a document with no documentElement.');
	}

	// 2. Otherwise, run the following steps:

	// 2.1. Let serialized document be an empty string.
	// (constructed in-place in result argument)

	// 2.2. For each child child of node, in tree order, run the XML serialization algorithm on the
	// child passing along the provided arguments, and append the result to serialized document.
	// NOTE: This will serialize any number of ProcessingInstruction and Comment nodes both before
	// and after the Document's documentElement node, including at most one DocumentType node. (Text
	// nodes are not allowed as children of the Document.)
	for (const child of document.childNodes) {
		runXmlSerializationAlgorithm(child, prefixMap, prefixIndex, requireWellFormed, result);
	}

	// 2.3. Return the value of serialized document.
}

/**
 * 3.2.1.3 XML serializing a Comment node
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeCommentNode(node: Node, requireWellFormed: boolean, result: string[]): void {
	const comment = node as Comment;
	// 1. If the require well-formed flag is set (its value is true), and node's data contains
	// characters that are not matched by the XML Char production or contains "--" (two adjacent
	// U+002D HYPHEN-MINUS characters) or that ends with a "-" (U+002D HYPHEN-MINUS) character, then
	// throw an exception; the serialization of this node's data would not be well-formed.
	if (
		requireWellFormed &&
		(!matchesCharProduction(comment.data) ||
			comment.data.indexOf('--') >= 0 ||
			comment.data.endsWith('-'))
	) {
		throw new Error('Can not serialize a comment because it contains invalid characters.');
	}

	// 2. Otherwise, return the concatenation of "<!--", node's data, and "-->".
	result.push('<!--', comment.data, '-->');
}

/**
 * (not currently in spec) XML serializing a CDATASection node
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeCDATASectionNode(node: Node, requireWellFormed: boolean, result: string[]): void {
	const cs = node as CDATASection;

	// 1. Let markup be the concatenation of "<![CDATA[", node's data, and "]]>".
	result.push('<![CDATA[', cs.data, ']]>');

	// 2. Return the value of markup.
}

/**
 * 3.2.1.4 XML serializing a Text node
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeTextNode(node: Node, requireWellFormed: boolean, result: string[]): void {
	const text = node as Text;
	// 1. If the require well-formed flag is set (its value is true), and node's data contains
	// characters that are not matched by the XML Char production, then throw an exception; the
	// serialization of this node's data would not be well-formed.
	if (requireWellFormed && !matchesCharProduction(text.data)) {
		throw new Error('Can not serialize a text node because it contains invalid characters.');
	}

	// 2. Let markup be the value of node's data.
	let markup = text.data;

	// 3. Replace any occurrences of "&" in markup by "&amp;".
	markup = markup.replace(/&/g, '&amp;');

	// 4. Replace any occurrences of "<" in markup by "&lt;".
	markup = markup.replace(/</g, '&lt;');

	// 5. Replace any occurrences of ">" in markup by "&gt;".
	markup = markup.replace(/>/g, '&gt;');

	// 6. Return the value of markup.
	result.push(markup);
}

/**
 * 3.2.1.5 XML serializing a DocumentFragment node
 *
 * @param node              - The node to serialize
 * @param prefixMap         - The namespace prefix map
 * @param prefixIndex       - A reference to the generated namespace prefix index
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeDocumentFragmentNode(
	node: Node,
	prefixMap: NamespacePrefixMap,
	prefixIndex: PrefixIndex,
	requireWellFormed: boolean,
	result: string[]
): void {
	// 1. Let markup the empty string.
	// (constructed in-place in result argument)

	// 2. For each child child of node, in tree order, run the XML serialization algorithm on the
	// child given namespace, prefix map, a reference to prefix index, and flag require well-formed.
	// Concatenate the result to markup.
	for (const child of node.childNodes) {
		runXmlSerializationAlgorithm(child, prefixMap, prefixIndex, requireWellFormed, result);
	}

	// 3. Return the value of markup.
}

/**
 * 3.2.1.6 XML serializing a DocumentType node
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeDocumentTypeNode(node: Node, requireWellFormed: boolean, result: string[]): void {
	const dt = node as DocumentType;
	// 1. If the require well-formed flag is true and the node's publicId attribute contains
	// characters that are not matched by the XML PubidChar production, then throw an exception; the
	// serialization of this node would not be a well-formed document type declaration.
	if (requireWellFormed && !matchesPubidCharProduction(dt.publicId)) {
		throw new Error(
			'Can not serialize a document type because the publicId contains invalid characters.'
		);
	}

	// 2. If the require well-formed flag is true and the node's systemId attribute contains
	// characters that are not matched by the XML Char production or that contains both a """
	// (U+0022 QUOTATION MARK) and a "'" (U+0027 APOSTROPHE), then throw an exception; the
	// serialization of this node would not be a well-formed document type declaration.
	if (
		requireWellFormed &&
		(!matchesCharProduction(dt.systemId) ||
			(dt.systemId.indexOf('"') >= 0 && dt.systemId.indexOf("'") >= 0))
	) {
		throw new Error(
			'Can not serialize a document type because the systemId contains invalid characters.'
		);
	}

	// 3. Let markup be an empty string.
	// (constructed in-place in result argument)

	// 4. Append the string "<!DOCTYPE" to markup.
	result.push('<!DOCTYPE');

	// 5. Append " " (U+0020 SPACE) to markup.
	result.push(' ');

	// 6. Append the value of the node's name attribute to markup. For a node belonging to an HTML
	// document, the value will be all lowercase.
	// (HTML documents not implemented)
	result.push(dt.name);

	// 7. If the node's publicId is not the empty string then append the following, in the order
	// listed, to markup:
	if (dt.publicId !== '') {
		// 7.1. " " (U+0020 SPACE);
		// 7.2. The string "PUBLIC";
		// 7.3. " " (U+0020 SPACE);
		// 7.4. """ (U+0022 QUOTATION MARK);
		// 7.5. The value of the node's publicId attribute;
		// 7.6. """ (U+0022 QUOTATION MARK).
		result.push(' PUBLIC "', dt.publicId, '"');
	}

	// 8. If the node's systemId is not the empty string and the node's publicId is set to the empty
	// string, then append the following, in the order listed, to markup:
	if (dt.systemId !== '' && dt.publicId === '') {
		// 8.1. " " (U+0020 SPACE);
		// 8.2. The string "SYSTEM".
		result.push(' SYSTEM');
	}

	// 9. If the node's systemId is not the empty string then append the following, in the order
	// listed, to markup:
	if (dt.systemId !== '') {
		// 9.1. " " (U+0020 SPACE);
		// 9.2. """ (U+0022 QUOTATION MARK);
		// 9.3. The value of the node's systemId attribute;
		// 9.4. """ (U+0022 QUOTATION MARK).
		result.push(' "', dt.systemId, '"');
	}

	// 10. Append ">" (U+003E GREATER-THAN SIGN) to markup.
	result.push('>');

	// 11. Return the value of markup.
}

/**
 * 3.2.1.7 XML serializing a ProcessingInstruction node
 *
 * @param node              - The node to serialize
 * @param requireWellFormed - Determines whether the result needs to be well-formed
 * @param result            - Array of strings in which to construct the result
 */
function serializeProcessingInstructionNode(
	node: Node,
	requireWellFormed: boolean,
	result: string[]
): void {
	const pi = node as ProcessingInstruction;
	// 1. If the require well-formed flag is set (its value is true), and node's target contains a
	// ":" (U+003A COLON) character or is an ASCII case-insensitive match for the string "xml", then
	// throw an exception; the serialization of this node's target would not be well-formed.
	if (requireWellFormed) {
		if (pi.target.indexOf(':') >= 0) {
			throw new Error(
				`Can not serialize a processing instruction because the target "${pi.target}" may not contain ":".`
			);
		}
		if (pi.target.toLowerCase() === 'xml') {
			throw new Error(
				'Can not serialize a processing instruction because "xml" may not be used as target.'
			);
		}
	}

	// 2. If the require well-formed flag is set (its value is true), and node's data contains
	// characters that are not matched by the XML Char production or contains the string "?>"
	// (U+003F QUESTION MARK, U+003E GREATER-THAN SIGN), then throw an exception; the serialization
	// of this node's data would not be well-formed.
	if (requireWellFormed && (!matchesCharProduction(pi.data) || pi.data.indexOf('?>') >= 0)) {
		throw new Error(
			'Can not serialize a processing instruction because the data contains invalid characters.'
		);
	}

	// 3. Let markup be the concatenation of the following, in the order listed:
	// 3.1. "<?" (U+003C LESS-THAN SIGN, U+003F QUESTION MARK);
	// 3.2. The value of node's target;
	// 3.3. " " (U+0020 SPACE);
	// 3.4. The value of node's data;
	// 3.5. "?>" (U+003F QUESTION MARK, U+003E GREATER-THAN SIGN).
	result.push('<?', pi.target, ' ', pi.data, '?>');

	// 4. Return the value of markup.
}
