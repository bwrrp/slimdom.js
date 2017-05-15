import CharacterData from './CharacterData';
import Document from './Document';
import Node from './Node';

import { getNodeIndex } from './util';

/**
 * The Text interface represents the textual content of an Element node. If an element has no markup within its
 * content, it has a single child implementing Text that contains the element's text.  However, if the element
 * contains markup, it is parsed into information items and Text nodes that form its children.
 *
 * New documents have a single Text node for each block of text. Over time, more Text nodes may be created as
 * the document's content changes.  The Node.normalize() method merges adjacent Text objects back into a single
 * node for each block of text.
 */
export default class Text extends CharacterData {
    /**
	 * @param content Content for the text node
	 */
	constructor (content: string) {
		super(Node.TEXT_NODE, content);
	}

	/**
	 * Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
	 *
	 * After the split, the current node contains all the content up to the specified offset point, and a newly
	 * created node of the same type contains the remaining text.  The newly created node is returned to the caller.
	 * If the original node had a parent, the new node is inserted as the next sibling of the original node.
	 * If the offset is equal to the length of the original node, the newly created node has no data.
	 *
	 * Separated text nodes can be concatenated using the Node.normalize() method.
	 *
	 * @param offset Offset at which to split
	 *
	 * @return The new text node created to hold the second half of the split content
	 */
	public splitText (offset: number): Text {
		// Check offset
		const length = this.length;
		if (offset < 0) {
			offset = 0;
		}
		if (offset > length) {
			offset = length;
		}

		const count = length - offset;
		const newData = this.substringData(offset, count);
		const document = this.ownerDocument as Document;
		const newNode = document.createTextNode(newData);

		// If the current node is part of a tree, insert the new node
		if (this.parentNode) {
			this.parentNode.insertBefore(newNode, this.nextSibling);

			// Update ranges
			var nodeIndex = getNodeIndex(this);
			document._ranges.forEach(range => {
				if (range.startContainer === this.parentNode && range.startOffset === nodeIndex + 1) {
					range.setStart(range.startContainer as Node, range.startOffset + 1);
				}
				if (range.endContainer === this.parentNode && range.endOffset === nodeIndex + 1) {
					range.setEnd(range.endContainer as Node, range.endOffset + 1);
				}
				if (range.startContainer === this && range.startOffset > offset) {
					range.setStart(newNode, range.startOffset - offset);
				}
				if (range.endContainer === this && range.endOffset > offset) {
					range.setEnd(newNode, range.endOffset - offset);
				}
			});
		}

		// Truncate our own data
		this.deleteData(offset, count);

		if (!this.parentNode) {
			// Update ranges
			document._ranges.forEach(range => {
				if (range.startContainer === this && range.startOffset > offset) {
					range.setStart(range.startContainer, offset);
				}
				if (range.endContainer === this && range.endOffset > offset) {
					range.setEnd(range.endContainer, offset);
				}
			});
		}

		// Return the new node
		return newNode;
	}

	public cloneNode (deep: boolean = true, _copy?: Text): Text {
		_copy = _copy || new Text(this.data);
		return super.cloneNode(deep, _copy) as Text;
	}
}
