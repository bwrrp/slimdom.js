import {
	NonDocumentTypeChildNode,
	ChildNode,
	getNextElementSibling,
	getPreviousElementSibling,
} from './mixins';
import Element from './Element';
import Node from './Node';
import { getContext } from './context/Context';
import queueMutationRecord from './mutation-observer/queueMutationRecord';
import { expectArity, throwIndexSizeError } from './util/errorHelpers';
import { asUnsignedLong, treatNullAsEmptyString } from './util/typeHelpers';
import {
	insertNodesBefore,
	insertNodesAfter,
	replaceWithNodes,
	removeFromParent,
} from './util/mutationAlgorithms';

/**
 * 3.10. Interface CharacterData
 *
 * @public
 */
export default abstract class CharacterData
	extends Node
	implements NonDocumentTypeChildNode, ChildNode {
	// Node

	public get nodeValue(): string | null {
		return this._data;
	}

	public set nodeValue(newValue: string | null) {
		newValue = treatNullAsEmptyString(newValue);

		// Set an existing attribute value with this and new value.
		replaceData(this, 0, this.length, newValue);
	}

	public get textContent(): string | null {
		return this._data;
	}

	public set textContent(newValue: string | null) {
		newValue = treatNullAsEmptyString(newValue);

		// Set an existing attribute value with this and new value.
		replaceData(this, 0, this.length, newValue);
	}

	public lookupPrefix(namespace: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If namespace is null or the empty string, then return null.
		// (not necessary due to recursion)

		// 2. Switch on this:
		// Any other node - Return the result of locating a namespace prefix for its parent element,
		// if its parent element is non-null, and null otherwise.
		const parentElement = this.parentElement;
		if (parentElement !== null) {
			return parentElement.lookupPrefix(namespace);
		}

		return null;
	}

	public lookupNamespaceURI(prefix: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If prefix is the empty string, then set it to null.
		// (not necessary due to recursion)

		// 2. Return the result of running locate a namespace for this using prefix.

		// To locate a namespace for a node using prefix, switch on node: Any other node
		// 1. If its parent element is null, then return null.
		const parentElement = this.parentElement;
		if (parentElement === null) {
			return null;
		}

		// 2. Return the result of running locate a namespace on its parent element using prefix.
		return parentElement.lookupNamespaceURI(prefix);
	}

	// ChildNode

	public before(...nodes: (Node | string)[]): void {
		insertNodesBefore(this, nodes);
	}

	public after(...nodes: (Node | string)[]): void {
		insertNodesAfter(this, nodes);
	}

	public replaceWith(...nodes: (Node | string)[]): void {
		replaceWithNodes(this, nodes);
	}

	public remove(): void {
		removeFromParent(this);
	}

	// NonDocumentTypeChildNode

	public get previousElementSibling(): Element | null {
		return getPreviousElementSibling(this);
	}

	public get nextElementSibling(): Element | null {
		return getNextElementSibling(this);
	}

	// CharacterData

	/**
	 * Each node inheriting from the CharacterData interface has an associated mutable string called
	 * data.
	 */
	protected _data: string;

	public get data(): string {
		return this._data;
	}

	public set data(newValue: string) {
		// [TreatNullAs=EmptyString]
		newValue = treatNullAsEmptyString(newValue);

		// replace data with node this, offset 0, count this’s length, and data
		// new value.
		replaceData(this, 0, this.length, newValue);
	}

	public get length(): number {
		return this.data.length;
	}

	/**
	 * (non-standard) CharacterData should never be instantiated directly.
	 *
	 * @param data - The data to associate with the node
	 */
	protected constructor(data: string) {
		super();
		this._data = String(data);
	}

	/**
	 * Returns a substring of the node's data.
	 *
	 * @param offset - Offset at which to start the substring
	 * @param count  - The number of code units to return
	 *
	 * @returns The specified substring
	 */
	public substringData(offset: number, count: number): string {
		expectArity(arguments, 2);
		return substringData(this, offset, count);
	}

	/**
	 * Appends data to the node's data.
	 *
	 * @param data - Data to append
	 */
	public appendData(data: string): void {
		expectArity(arguments, 1);
		replaceData(this, this.length, 0, data);
	}

	/**
	 * Inserts data at the specified position in the node's data.
	 *
	 * @param offset - Offset at which to insert
	 * @param data   - Data to insert
	 */
	public insertData(offset: number, data: string): void {
		expectArity(arguments, 1);
		replaceData(this, offset, 0, data);
	}

	/**
	 * Deletes data from the specified position.
	 *
	 * @param offset - Offset at which to delete
	 * @param count  - Number of code units to delete
	 */
	public deleteData(offset: number, count: number): void {
		expectArity(arguments, 2);
		replaceData(this, offset, count, '');
	}

	/**
	 * Replaces data at the specified position.
	 *
	 * @param offset - Offset at which to replace
	 * @param count  - Number of code units to remove
	 * @param data   - Data to insert
	 */
	public replaceData(offset: number, count: number, data: string): void {
		expectArity(arguments, 3);
		replaceData(this, offset, count, data);
	}
}

/**
 * To replace data of node node with offset offset, count count, and data data, run these steps:
 *
 * @param node   - The node to replace data on
 * @param offset - The offset at which to start replacing
 * @param count  - The number of code units to replace
 * @param data   - The data to insert in place of the removed data
 */
export function replaceData(
	node: CharacterData,
	offset: number,
	count: number,
	data: string
): void {
	// Match spec data types
	offset = asUnsignedLong(offset);
	count = asUnsignedLong(count);

	// 1. Let length be node’s length.
	const length = node.length;

	// 2. If offset is greater than length, then throw an IndexSizeError.
	if (offset > length) {
		throwIndexSizeError("can not replace data past the node's length");
	}

	// 3. If offset plus count is greater than length, then set count to length minus offset.
	if (offset + count > length) {
		count = length - offset;
	}

	// 4. Queue a mutation record of "characterData" for node with null, null, node's data, « »,
	// « », null, and null.
	queueMutationRecord('characterData', node, {
		oldValue: node.data,
	});

	// 5. Insert data into node’s data after offset code units.
	// 6. Let delete offset be offset + data's length.
	// 7. Starting from delete offset code units, remove count code units from node’s data.
	const nodeData = node.data;
	const newData = nodeData.substring(0, offset) + data + nodeData.substring(offset + count);
	(node as any)._data = newData;

	const context = getContext(node);
	context.forEachRange((range) => {
		// 8. For each live range whose start node is node and start offset is greater than offset
		// but less than or equal to offset plus count, set its start offset to offset.
		if (
			range.startContainer === node &&
			range.startOffset > offset &&
			range.startOffset <= offset + count
		) {
			range.startOffset = offset;
		}

		// 9. For each live range whose end node is node and end offset is greater than offset but
		// less than or equal to offset plus count, set its end offset to offset.
		if (
			range.endContainer === node &&
			range.endOffset > offset &&
			range.endOffset <= offset + count
		) {
			range.endOffset = offset;
		}

		// 10. For each live range whose start node is node and start offset is greater than offset
		// plus count, increase its start offset by data's length and decrease it by count.
		if (range.startContainer === node && range.startOffset > offset + count) {
			range.startOffset = range.startOffset + data.length - count;
		}

		// 11. For each live range whose end node is node and end offset is greater than offset plus
		// count, increase its end offset by data's length and decrease it by count.
		if (range.endContainer === node && range.endOffset > offset + count) {
			range.endOffset = range.endOffset + data.length - count;
		}
	});

	// 12. If node's parent is non-null, then run the children changed steps for node’s parent.
	// (children changed steps not implemented)
}

/**
 * To substring data with node node, offset offset, and count count, run these steps:
 *
 * @param node   - The node to get data from
 * @param offset - The offset at which to start the substring
 * @param count  - The number of code units to include in the substring
 *
 * @returns The requested substring
 */
export function substringData(node: CharacterData, offset: number, count: number): string {
	// Match spec data types
	offset = asUnsignedLong(offset);
	count = asUnsignedLong(count);

	// 1. Let length be node’s length.
	const length = node.length;

	// 2. If offset is greater than length, then throw an IndexSizeError.
	if (offset > length) {
		throwIndexSizeError("can not substring data past the node's length");
	}

	// 3. If offset plus count is greater than length, return a string whose value is the code units
	// from the offsetth code unit to the end of node’s data, and then return.
	if (offset + count > length) {
		return node.data.substring(offset);
	}

	// 4. Return a string whose value is the code units from the offsetth code unit to the
	// offset+countth code unit in node’s data.
	return node.data.substring(offset, offset + count);
}
