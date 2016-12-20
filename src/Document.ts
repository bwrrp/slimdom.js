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
	public doctype: DocumentType = null;

	/**
	 * The Element that is a direct child of the current document, or null if there is none.
	 */
	public documentElement: Element = null;

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
			this.documentElement = <Element>result;
		}

		// Update doctype
		if (result && result.nodeType === Node.DOCUMENT_TYPE_NODE) {
			this.doctype = <DocumentType>result;
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
	 */
	public createElement (name): Element {
		const node = new Element(name);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new Text node with the given content.
	 */
	public createTextNode (content: string): Text {
		const node = new Text(content);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new ProcessingInstruction node with a given target and given data.
	 */
	public createProcessingInstruction (target: string, data: string): ProcessingInstruction {
		const node = new ProcessingInstruction(target, data);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a new Comment node with the given data.
	 */
	public createComment (data: string): Comment {
		const node = new Comment(data);
		node.ownerDocument = this;
		return node;
	}

	/**
	 * Creates a selection range within the current document.
	 */
	public createRange (): Range {
		return new Range(this);
	}

	public cloneNode (deep: boolean = true, _copy: Node = null) {
		_copy = _copy || new Document();
		return super.cloneNode(deep, _copy);
	}
}
