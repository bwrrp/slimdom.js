import { NonElementParentNode, ParentNode, getChildren } from './mixins';
import Attr from './Attr';
import CDATASection from './CDATASection';
import Comment from './Comment';
import DocumentFragment from './DocumentFragment';
import DocumentType from './DocumentType';
import DOMImplementation from './DOMImplementation';
import { createElement, default as Element } from './Element';
import Node from './Node';
import ProcessingInstruction from './ProcessingInstruction';
import Text from './Text';
import Range from './Range';
import { getContext } from './context/Context';
import cloneNode from './util/cloneNode';
import createElementNS from './util/createElementNS';
import { expectArity, throwInvalidCharacterError, throwNotSupportedError } from './util/errorHelpers';
import { adoptNode } from './util/mutationAlgorithms';
import { NodeType, isNodeOfType } from './util/NodeType';
import { matchesNameProduction, validateAndExtract } from './util/namespaceHelpers';
import { asNullableString, asObject } from './util/typeHelpers';

/**
 * 3.5. Interface Document
 */
export default class Document extends Node implements NonElementParentNode, ParentNode {
	// Node

	public get nodeType(): number {
		return NodeType.DOCUMENT_NODE;
	}

	public get nodeName(): string {
		return '#document';
	}

	public get nodeValue(): string | null {
		return null;
	}

	public set nodeValue(newValue: string | null) {
		// Do nothing.
	}

	public lookupPrefix(namespace: string | null): string | null {
		// 1. If namespace is null or the empty string, then return null.
		// (not necessary due to recursion)

		// 2. Switch on the context object:
		// Document - Return the result of locating a namespace prefix for its document element, if its document element
		// is non-null, and null otherwise.
		if (this.documentElement !== null) {
			return this.documentElement.lookupPrefix(namespace);
		}

		return null;
	}

	public lookupNamespaceURI(prefix: string | null): string | null {
		// 1. If prefix is the empty string, then set it to null.
		// (not necessary due to recursion)

		// 2. Return the result of running locate a namespace for the context object using prefix.

		// To locate a namespace for a node using prefix, switch on node: Document
		// 1. If its document element is null, then return null.
		if (this.documentElement === null) {
			return null;
		}

		// 2. Return the result of running locate a namespace on its document element using prefix.
		return this.documentElement.lookupNamespaceURI(prefix);
	}

	// ParentNode

	public get children(): Element[] {
		return getChildren(this);
	}

	public firstElementChild: Element | null = null;
	public lastElementChild: Element | null = null;
	public childElementCount: number = 0;

	// Document

	/**
	 * Returns a reference to the DOMImplementation object associated with the document.
	 */
	public readonly implementation: DOMImplementation = new DOMImplementation(this);

	/**
	 * The doctype, or null if there is none.
	 */
	public doctype: DocumentType | null = null;

	/**
	 * The document element, or null if there is none.
	 */
	public documentElement: Element | null = null;

	/**
	 * Creates a new Document.
	 *
	 * Note: Unlike DOMImplementation#createDocument(), this constructor does not return an XMLDocument object, but a
	 * document (Document object).
	 */
	constructor() {
		super();
	}

	/**
	 * Creates a new element in the null namespace.
	 *
	 * @param localName Local name of the element
	 *
	 * @return The new element
	 */
	public createElement(localName: string): Element {
		expectArity(arguments, 1);
		localName = String(localName);

		// 1. If localName does not match the Name production, then throw an InvalidCharacterError.
		if (!matchesNameProduction(localName)) {
			throwInvalidCharacterError('The local name is not a valid Name');
		}

		// 2. If the context object is an HTML document, then set localName to localName in ASCII lowercase.
		// (html documents not implemented)

		// 3. Let is be the value of is member of options, or null if no such member exists.
		// (custom elements not implemented)

		// 4. Let namespace be the HTML namespace, if the context object is an HTML document or context object’s content
		// type is "application/xhtml+xml", and null otherwise.
		// (html documents not implemented)
		const namespace: string | null = null;

		// 5. Let element be the result of creating an element given the context object, localName, namespace, null, is,
		// and with the synchronous custom elements flag set.
		const element = createElement(this, localName, namespace, null);

		// 6. If is is non-null, then set an attribute value for element using "is" and is.
		// (custom elements not implemented)

		// 7. Return element.
		return element;
	}

	/**
	 * Creates a new element in the given namespace.
	 *
	 * @param namespace     Namespace URI for the new element
	 * @param qualifiedName Qualified name for the new element
	 *
	 * @return The new element
	 */
	public createElementNS(namespace: string | null, qualifiedName: string): Element {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		qualifiedName = String(qualifiedName);

		// return the result of running the internal createElementNS steps, given context object, namespace,
		// qualifiedName, and options.
		return createElementNS(this, namespace, qualifiedName);
	}

	/**
	 * Returns a new DocumentFragment node with its node document set to the context object.
	 *
	 * @return The new document fragment
	 */
	public createDocumentFragment(): DocumentFragment {
		const context = getContext(this);
		const documentFragment = new context.DocumentFragment();
		documentFragment.ownerDocument = this;
		return documentFragment;
	}

	/**
	 * Returns a new Text node with its data set to data and node document set to the context object.
	 *
	 * @param data Data for the new text node
	 *
	 * @return The new text node
	 */
	public createTextNode(data: string): Text {
		expectArity(arguments, 1);
		data = String(data);

		const context = getContext(this);
		const text = new context.Text(data);
		text.ownerDocument = this;
		return text;
	}

	/**
	 * Returns a new CDATA section with the given data and node document set to the context object.
	 *
	 * @param data Data for the new CDATA section
	 *
	 * @return The new CDATA section
	 */
	public createCDATASection(data: string): CDATASection {
		expectArity(arguments, 1);
		data = String(data);

		// 1. If context object is an HTML document, then throw a NotSupportedError.
		// (html documents not implemented)

		// 2. If data contains the string "]]>", then throw an InvalidCharacterError.
		if (data.indexOf(']]>') >= 0) {
			throwInvalidCharacterError('Data must not contain the string "]]>"');
		}

		// 3. Return a new CDATASection node with its data set to data and node document set to the context object.
		const context = getContext(this);
		const cdataSection = new context.CDATASection(data);
		cdataSection.ownerDocument = this;
		return cdataSection;
	}

	/**
	 * Returns a new Comment node with its data set to data and node document set to the context object.
	 *
	 * @param data Data for the new comment
	 *
	 * @return The new comment node
	 */
	public createComment(data: string): Comment {
		expectArity(arguments, 1);
		data = String(data);

		const context = getContext(this);
		const comment = new context.Comment(data);
		comment.ownerDocument = this;
		return comment;
	}

	/**
	 * Creates a new processing instruction node, with target set to target, data set to data, and node document set to
	 * the context object.
	 *
	 * @param target Target for the new processing instruction
	 * @param data   Data for the new processing instruction
	 *
	 * @return The new processing instruction
	 */
	public createProcessingInstruction(target: string, data: string): ProcessingInstruction {
		expectArity(arguments, 2);
		target = String(target);
		data = String(data);

		// 1. If target does not match the Name production, then throw an InvalidCharacterError.
		if (!matchesNameProduction(target)) {
			throwInvalidCharacterError('The target is not a valid Name');
		}

		// 2. If data contains the string "?>", then throw an InvalidCharacterError.
		if (data.indexOf('?>') >= 0) {
			throwInvalidCharacterError('Data must not contain the string "?>"');
		}

		// 3. Return a new ProcessingInstruction node, with target set to target, data set to data, and node document
		// set to the context object.
		const context = getContext(this);
		const pi = new context.ProcessingInstruction(target, data);
		pi.ownerDocument = this;
		return pi;

		// Note: No check is performed that target contains "xml" or ":", or that data contains characters that match
		// the Char production.
	}

	/**
	 * Creates a copy of a node from an external document that can be inserted into the current document.
	 *
	 * @param node The node to import
	 * @param deep Whether to also import node's children
	 */
	public importNode(node: Node, deep: boolean = false): Node {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. If node is a document or shadow root, then throw a NotSupportedError.
		if (isNodeOfType(node, NodeType.DOCUMENT_NODE)) {
			throwNotSupportedError('importing a Document node is not supported');
		}

		// 2. Return a clone of node, with context object and the clone children flag set if deep is true.
		return cloneNode(node, deep, this);
	}

	/**
	 * Adopts a node. The node and its subtree is removed from the document it's in (if any), and its ownerDocument is
	 * changed to the current document. The node can then be inserted into the current document.
	 *
	 * @param node The node to adopt
	 */
	public adoptNode(node: Node): Node {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. If node is a document, then throw a NotSupportedError.
		if (isNodeOfType(node, NodeType.DOCUMENT_NODE)) {
			throwNotSupportedError('adopting a Document node is not supported');
		}

		// 2. If node is a shadow root, then throw a HierarchyRequestError.
		// (shadow dom not implemented)

		// 3. Adopt node into the context object.
		adoptNode(node, this);

		// 4. Return node.
		return node;
	}

	/**
	 * Creates a new attribute node with the null namespace and given local name.
	 *
	 * @param localName The local name of the attribute
	 *
	 * @return The new attribute node
	 */
	public createAttribute(localName: string): Attr {
		expectArity(arguments, 1);
		localName = String(localName);

		// 1. If localName does not match the Name production in XML, then throw an InvalidCharacterError.
		if (!matchesNameProduction(localName)) {
			throwInvalidCharacterError('The local name is not a valid Name');
		}

		// 2. If the context object is an HTML document, then set localName to localName in ASCII lowercase.
		// (html documents not implemented)

		// 3. Return a new attribute whose local name is localName and node document is context object.
		const context = getContext(this);
		const attr = new context.Attr(null, null, localName, '', null);
		attr.ownerDocument = this;
		return attr;
	}

	/**
	 * Creates a new attribute node with the given namespace and qualified name.
	 *
	 * @param namespace     Namespace URI for the new attribute, or null for the null namespace
	 * @param qualifiedName Qualified name for the new attribute
	 *
	 * @return The new attribute node
	 */
	public createAttributeNS(namespace: string | null, qualifiedName: string): Attr {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		qualifiedName = String(qualifiedName);

		// 1. Let namespace, prefix, and localName be the result of passing namespace and qualifiedName to validate and
		// extract.
		const { namespace: validatedNamespace, prefix, localName } = validateAndExtract(namespace, qualifiedName);

		// 2. Return a new attribute whose namespace is namespace, namespace prefix is prefix, local name is localName,
		// and node document is context object.
		const context = getContext(this);
		const attr = new context.Attr(validatedNamespace, prefix, localName, '', null);
		attr.ownerDocument = this;
		return attr;
	}

	/**
	 * Creates a new Range, initially positioned at the root of this document.
	 *
	 * Note: although the spec encourages use of the Range() constructor, this implementation does not associate any
	 * Document with the global object, preventing implementation of that constructor.
	 *
	 * @return The new Range
	 */
	public createRange(): Range {
		const context = getContext(this);
		const range = new context.Range();
		range.startContainer = this;
		range.startOffset = 0;
		range.endContainer = this;
		range.endOffset = 0;
		return range;
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): Document {
		// Set copy’s encoding, content type, URL, origin, type, and mode, to those of node.
		// (properties not implemented)

		const context = getContext(document);
		return new context.Document();
	}
}
