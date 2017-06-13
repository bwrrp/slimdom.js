import CharacterData from './CharacterData';
import Document from './Document';
import { NodeType } from './util/NodeType';

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
	 * Returns a new Comment node whose data is data.
	 *
	 * Non-standard: as this implementation does not have a document associated with the global object, it is required
	 * to pass a document to this constructor.
	 *
	 * @param document (non-standard) The node document to associate with the new comment
	 * @param data     The data for the new comment
	 */
	constructor(document: Document, data: string = '') {
		super(document, data);
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): Comment {
		// Set copy’s data, to that of node.
		return new Comment(document, this.data);
	}
}
