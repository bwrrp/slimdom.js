import Node from '../Node';

export interface MutationRecordInit {
	name?: string;
	namespace?: string | null;
	oldValue?: string | null;
	addedNodes?: Node[];
	removedNodes?: Node[];
	previousSibling?: Node | null;
	nextSibling?: Node | null;
}

/**
 * 3.3.3. Interface MutationRecord
 *
 * A helper class which describes a specific mutation as it is observed by a MutationObserver.
 *
 * @public
 */
export default class MutationRecord {
	/**
	 * Returns "attributes" if it was an attribute mutation. "characterData" if it was a mutation to
	 * a CharacterData node. And "childList" if it was a mutation to the tree of nodes.
	 */
	public type: string;

	/**
	 * Returns the node the mutation affected, depending on the type. For "attributes", it is the
	 * element whose attribute changed. For "characterData", it is the CharacterData node. For
	 * "childList", it is the node whose children changed.
	 */
	public target: Node;

	/**
	 * Children of target added in this mutation.
	 *
	 * (non-standard) According to the spec this should be a NodeList. This implementation uses an
	 * array.
	 */
	public addedNodes: Node[] = [];

	/**
	 * Children of target removed in this mutation.
	 *
	 * (non-standard) According to the spec this should be a NodeList. This implementation uses an
	 * array.
	 */
	public removedNodes: Node[] = [];

	/**
	 * The previous sibling of the added or removed nodes, or null otherwise.
	 */
	public previousSibling: Node | null = null;

	/**
	 * The next sibling Node of the added or removed nodes, or null otherwise.
	 */
	public nextSibling: Node | null = null;

	/**
	 * The local name of the changed attribute, or null otherwise.
	 */
	public attributeName: string | null = null;

	/**
	 * The namespace of the changed attribute, or null otherwise.
	 */
	public attributeNamespace: string | null = null;

	/**
	 * The return value depends on type. For "attributes", it is the value of the changed attribute
	 * before the change. For "characterData", it is the data of the changed node before the change.
	 * For "childList", it is null.
	 */
	public oldValue: string | null = null;

	/**
	 * (non-standard) Constructs a MutationRecord
	 *
	 * @param type   - The value for the type property
	 * @param target - The value for the target property
	 */
	constructor(type: string, target: Node) {
		this.type = type;
		this.target = target;
	}
}
