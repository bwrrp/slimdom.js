import { replaceData, substringData, default as CharacterData } from './CharacterData';
import Document from './Document';
import { ranges } from './Range';
import { getContext } from './context/Context';
import { throwIndexSizeError } from './util/errorHelpers';
import { insertNode } from './util/mutationAlgorithms';
import { NodeType } from './util/NodeType';
import { getNodeIndex } from './util/treeHelpers';

/**
 * 3.11. Interface Text
 */
export default class Text extends CharacterData {
	// Node

	public get nodeType(): number {
		return NodeType.TEXT_NODE;
	}

	public get nodeName(): string {
		return '#text';
	}

	// Text

	/**
	 * Returns a new Text node whose data is data and node document is current global object’s associated Document.
	 *
	 * @param data     The data for the new text node
	 */
	constructor(data: string = '') {
		super(data);

		const context = getContext(this);
		this.ownerDocument = context.document;
	}

	/**
	 * Splits data at the given offset and returns the remainder as Text node.
	 *
	 * @param offset The offset at which to split
	 *
	 * @return a text node containing the second half of the split node's data
	 */
	public splitText(offset: number): Text {
		return splitText(this, offset);
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): Text {
		// Set copy’s data, to that of node.
		const context = getContext(document);
		const copy = new context.Text(this.data);
		copy.ownerDocument = document;
		return copy;
	}
}

/**
 * To split a Text node node with offset offset, run these steps:
 *
 * @param node   The text node to split
 * @param offset The offset to split at
 *
 * @return a text node containing the second half of the split node's data
 */
function splitText(node: Text, offset: number): Text {
	// 1. Let length be node’s length.
	const length = node.length;

	// 2. If offset is greater than length, then throw an IndexSizeError.
	if (offset > length) {
		throwIndexSizeError("can not split past the node's length");
	}

	// 3. Let count be length minus offset.
	const count = length - offset;

	// 4. Let new data be the result of substringing data with node node, offset offset, and count count.
	const newData = substringData(node, offset, count);

	// 5. Let new node be a new Text node, with the same node document as node. Set new node’s data to new data.
	const context = getContext(node);
	const newNode = new context.Text(newData);
	newNode.ownerDocument = node.ownerDocument;

	// 6. Let parent be node’s parent.
	const parent = node.parentNode;

	// 7. If parent is not null, then:
	if (parent !== null) {
		// 7.1. Insert new node into parent before node’s next sibling.
		insertNode(newNode, parent, node.nextSibling);

		const indexOfNodePlusOne = getNodeIndex(node) + 1;
		ranges.forEach(range => {
			// 7.2. For each range whose start node is node and start offset is greater than offset, set its start node
			// to new node and decrease its start offset by offset.
			if (range.startContainer === node && range.startOffset > offset) {
				range.startContainer = newNode;
				range.startOffset -= offset;
			}

			// 7.3. For each range whose end node is node and end offset is greater than offset, set its end node to new
			// node and decrease its end offset by offset.
			if (range.endContainer === node && range.endOffset > offset) {
				range.endContainer = newNode;
				range.endOffset -= offset;
			}

			// 7.4. For each range whose start node is parent and start offset is equal to the index of node + 1,
			// increase its start offset by one.
			if (range.startContainer === parent && range.startOffset === indexOfNodePlusOne) {
				range.startOffset += 1;
			}

			// 7.5. For each range whose end node is parent and end offset is equal to the index of node + 1, increase
			// its end offset by one.
			if (range.endContainer === parent && range.endOffset === indexOfNodePlusOne) {
				range.endOffset += 1;
			}
		});
	}

	// 8. Replace data with node node, offset offset, count count, and data the empty string.
	replaceData(node, offset, count, '');

	// 9. Return new node.
	return newNode;
}
