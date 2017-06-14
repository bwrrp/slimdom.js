import { NonElementParentNode, ParentNode, getChildren } from './mixins';
import Document from './Document';
import Element from './Element';
import Node from './Node';
import { getContext } from './context/Context';
import { NodeType } from './util/NodeType';

export default class DocumentFragment extends Node implements NonElementParentNode, ParentNode {
	// Node

	public get nodeType(): number {
		return NodeType.DOCUMENT_FRAGMENT_NODE;
	}

	public get nodeName(): string {
		return '#document-fragment';
	}

	public get nodeValue(): string | null {
		return null;
	}

	public set nodeValue(newValue: string | null) {
		// Do nothing.
	}

	// ParentNode

	public get children(): Element[] {
		return getChildren(this);
	}

	public firstElementChild: Element | null = null;
	public lastElementChild: Element | null = null;
	public childElementCount: number = 0;

	/**
	 * Return a new DocumentFragment node whose node document is current global object’s associated Document.
	 */
	constructor() {
		super();

		const context = getContext(this);
		this.ownerDocument = context.document;
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): DocumentFragment {
		const context = getContext(document);
		const copy = new context.DocumentFragment();
		copy.ownerDocument = document;
		return copy;
	}
}
