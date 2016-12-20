import Node from '../Node';

export type MutationRecordType = 'attributes' | 'characterData' | 'childList' | 'userData';

/**
 * A helper class which describes a specific mutation as it is observed by a MutationObserver.
 */
 export default class MutationRecord {
	/**
	 * The type of MutationRecord
	 */
	public type: MutationRecordType;

	/**
	 * The node on or under which the mutation took place.
	 */
	public target: Node;

	/**
	 * Children of target added in this mutation.
	 */
	public addedNodes: Node[] = [];

	/**
	 * Children of target removed in this mutation.
	 */
	public removedNodes: Node[] = [];

	/**
	 * The previous sibling Node of the added or removed nodes if there were any.
	 */
	public previousSibling: Node | null = null;

	/**
	 * The next sibling Node of the added or removed nodes if there were any.
	 */
	public nextSibling: Node | null = null;

	/**
	 * The name of the changed attribute if there was any.
	 */
	public attributeName: string | null = null;

	/**
	 * Depending on the type: for "attributes", it is the value of the changed attribute before the change;
	 * for "characterData", it is the data of the changed node before the change; for "childList", it is null.
	 */
	public oldValue: any | null = null;

	constructor (type: MutationRecordType, target: Node) {
		this.type = type;
		this.target = target;
	}
}
