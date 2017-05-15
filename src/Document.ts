import Comment from './Comment';
import DocumentType from './DocumentType';
import Element from './Element';
import Node from './Node';
import ProcessingInstruction from './ProcessingInstruction';
import Text from './Text';

import Range from './selections/Range';

import globals from './globals';

export default class Document extends Node {
	/**
	 * The DocumentType that is a direct child of the current document, or null if there is none.
	 */
	public doctype: DocumentType | null = null;

	/**
	 * The Element that is a direct child of the current document, or null if there is none.
	 */
	public documentElement: Element | null = null;

	/**
	 * Returns a reference to the DOMImplementation object which created the document.
	 */
	public implementation = globals.domImplementation;

	/**
	 * (internal) The ranges that are active on the current document.
	 */
	public _ranges: Range[] = [];

	constructor () {
		super(Node.DOCUMENT_NODE);

		// Non-standard: should be null for Document nodes.
		this.ownerDocument = this;
	}

	// Override insertBefore to update the documentElement reference.
	public insertBefore (newNode: Node, referenceNode: Node | null, _suppressObservers: boolean = false): Node | null {
		// Document can not have more than one child element node
		if (newNode.nodeType === Node.ELEMENT_NODE && this.documentElement) {
			return this.documentElement === newNode ? newNode : null;
		}

		// Document can not have more than one child doctype node
		if (newNode.nodeType === Node.DOCUMENT_TYPE_NODE && this.doctype) {
			return this.doctype === newNode ? newNode : null;
		}

		const result = super.insertBefore(newNode, referenceNode, _suppressObservers);

		// Update document element
		if (result && result.nodeType === Node.ELEMENT_NODE) {
			this.documentElement = result as Element;
		}

		// Update doctype
		if (result && result.nodeType === Node.DOCUMENT_TYPE_NODE) {
			this.doctype = result as DocumentType;
		}

		return result;
	}

	// Override removeChild to keep the documentElement property in sync.
	public removeChild (childNode: Node, _suppressObservers: boolean = false): Node | null {
		var result = Node.prototype.removeChild.call(this, childNode, _suppressObservers);
		if (result === this.documentElement) {
			this.documentElement = null;
		}
		else if (result === this.doctype) {
			this.doctype = null;
		}

		return result;
	}

	/**
	 * Creates a new Element node with the given tag name.
	 *
	 * @param name NodeName of the new Element
	 *
	 * @return The new Element
	 */
	public createElement (name: string): Element {
		const node = new Element(name);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new Text node with the given content.
	 *
	 * @param content Content for the new text node
	 *
	 * @return The new text node
	 */
	public createTextNode (content: string): Text {
		const node = new Text(content);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new ProcessingInstruction node with a given target and given data.
	 *
	 * @param target Target of the processing instruction
	 * @param data   Content of the processing instruction
	 *
	 * @return The new processing instruction
	 */
	public createProcessingInstruction (target: string, data: string): ProcessingInstruction {
		const node = new ProcessingInstruction(target, data);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new Comment node with the given data.
	 *
	 * @param data Content of the comment
	 *
	 * @return The new comment node
	 */
	public createComment (data: string): Comment {
		const node = new Comment(data);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a selection range within the current document.
	 *
	 * @return The new range, positioned just inside the root of the document
	 */
	public createRange (): Range {
		return new Range(this);
	}

	public cloneNode (deep: boolean = true, _copy?: Document): Document {
		_copy = _copy || new Document();
		return super.cloneNode(deep, _copy) as Document;
	}
}
