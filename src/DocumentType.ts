import { ChildNode } from './mixins';
import Document from './Document';
import Node from './Node';
import { getContext } from './context/Context';
import { expectArity } from './util/errorHelpers';
import { NodeType } from './util/NodeType';

/**
 * @public
 */
export default class DocumentType extends Node implements ChildNode {
	// Node

	public get nodeType(): number {
		return NodeType.DOCUMENT_TYPE_NODE;
	}

	public get nodeName(): string {
		return this.name;
	}

	public get nodeValue(): string | null {
		return null;
	}

	public set nodeValue(newValue: string | null) {
		// Do nothing.
	}

	public lookupPrefix(namespace: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If namespace is null or the empty string, then return null.
		// (not necessary due to return value)

		// 2. Switch on the context object:
		// DocumentType - Return null
		return null;
	}

	public lookupNamespaceURI(prefix: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If prefix is the empty string, then set it to null.
		// (not necessary due to return value)

		// 2. Return the result of running locate a namespace for the context object using prefix.

		// To locate a namespace for a node using prefix, switch on node: DocumentType
		// Return null.
		return null;
	}

	// DocumentType

	/**
	 * The name of the doctype.
	 */
	public name: string;

	/**
	 * The public ID of the doctype.
	 */
	public publicId: string;

	/**
	 * The system ID of the doctype.
	 */
	public systemId: string;

	/**
	 * (non-standard) Use DOMImplementation#createDocumentType instead.
	 *
	 * @param name     - The name of the doctype
	 * @param publicId - The public ID of the doctype
	 * @param systemId - The system ID of the doctype
	 */
	constructor(name: string, publicId: string = '', systemId: string = '') {
		super();

		this.name = name;
		this.publicId = publicId;
		this.systemId = systemId;
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of the context object
	 */
	public _copy(document: Document): DocumentType {
		// Set copy’s name, public ID, and system ID, to those of node.
		const context = getContext(document);
		const copy = new context.DocumentType(this.name, this.publicId, this.systemId);
		copy.ownerDocument = document;
		return copy;
	}
}
