import CharacterData from './CharacterData';
import Document from './Document';
import { getContext } from './context/Context';
import { NodeType } from './util/NodeType';

/**
 * @public
 */
export default class Comment extends CharacterData {
	// Node

	public get nodeType(): number {
		return NodeType.COMMENT_NODE;
	}

	public get nodeName(): string {
		return '#comment';
	}

	// Comment

	/**
	 * Returns a new Comment node whose data is data and node document is current global object’s
	 * associated Document.
	 *
	 * @param data - The data for the new comment
	 */
	constructor(data: string = '') {
		super(data);

		const context = getContext(this);
		this.ownerDocument = context.document;
	}

	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public _copy(document: Document): Comment {
		// Set copy’s data, to that of node.
		const context = getContext(document);
		const copy = new context.Comment(this.data);
		copy.ownerDocument = document;
		return copy;
	}
}
