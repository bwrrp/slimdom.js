import { NonElementParentNode, ParentNode, getChildren } from './mixins';
import Document from './Document';
import Element from './Element';
import Node from './Node';
import { NodeType } from './util/NodeType';

export default class DocumentFragment extends Node implements NonElementParentNode, ParentNode {
	// Node

	public get nodeType (): number {
		return NodeType.DOCUMENT_FRAGMENT_NODE;
	}

	public get nodeName (): string {
		return '#document-fragment';
	}

	public get nodeValue (): string | null {
		return null;
	}

	public set nodeValue (newValue: string | null) {
		// Do nothing.
	}


	// ParentNode

	public get children (): Element[] {
		return getChildren(this);
	}

	public firstElementChild: Element | null = null;
	public lastElementChild: Element | null = null;
	public childElementCount: number = 0;

	/**
	 * Creates a new DocumentFragment.
	 *
	 * Non-standard: as this implementation does not have a document associated with the global object, it is required
	 * to pass a document to this constructor.
	 *
	 * @param document (non-standard) The node document to associate with the new document fragment
	 */
	constructor (document: Document) {
		super(document);
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy (document: Document): DocumentFragment {
		return new DocumentFragment(document);
	}
}
