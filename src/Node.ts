import Document from './Document';
import Text from './Text';

import MutationRecord from './mutations/MutationRecord';
import RegisteredObservers from './mutations/RegisteredObservers';
import queueMutationRecord from './mutations/queueMutationRecord';

import { getNodeIndex } from './util';

/**
 * Internal helper used to adopt a given node into a given document.
 */
function adopt (node: Node, document: Document) {
	node.ownerDocument = document;
	node.childNodes.forEach(child => adopt(child, document));
}

/**
 * A Node is a class from which a number of DOM types inherit, and allows these various types to be treated
 * (or tested) similarly.
 */
export default class Node {
	static ELEMENT_NODE = 1;
	static TEXT_NODE = 3;
	static PROCESSING_INSTRUCTION_NODE = 7;
	static COMMENT_NODE = 8;
	static DOCUMENT_NODE = 9;
	static DOCUMENT_TYPE_NODE = 10;

	/**
	 * An integer representing the type of the node.
	 */
	public nodeType: number;

	/**
	 * The parent node of the current node.
	 */
	public parentNode: Node | null = null;

	/**
	 * The next sibling node of the current node (on the right, could be a Text node).
	 */
	public nextSibling: Node | null = null;

	/**
	 * The next sibling node of the current node (on the left, could be a Text node).
	 */
	public previousSibling: Node | null = null;

	/**
	 * A list of childNodes (including Text nodes) of this node.
	 */
	public childNodes: Node[] = [];

	/**
	 * The first child node of the current node.
	 */
	public firstChild: Node | null = null;

	/**
	 * The last child node of the current node.
	 */
	public lastChild: Node | null = null;

	/**
	 * A reference to the Document node in which the current node resides.
	 */
	public ownerDocument: Document | null = null;

	// User data, use get/setUserData to access
	private _userData = [];
	private _userDataByKey = {};

	// (internal) Registered mutation observers, use MutationObserver interface to manipulate
	public _registeredObservers: RegisteredObservers;

	constructor (type: number) {
		this.nodeType = type;
		this._registeredObservers = new RegisteredObservers(this);
	}

	/**
	 * Internal helper used to update the firstChild and lastChild references.
	 */
	private _updateFirstLast () {
		this.firstChild = this.childNodes[0] || null;
		this.lastChild = this.childNodes[this.childNodes.length - 1] || null;
	}

	/**
	 * Internal helper used to update the nextSibling and previousSibling references.
	 */
	private _updateSiblings (index: number) {
		if (!this.parentNode) {
			// Node has been removed
			if (this.nextSibling) {
				this.nextSibling.previousSibling = this.previousSibling;
			}
			if (this.previousSibling) {
				this.previousSibling.nextSibling = this.nextSibling;
			}
			this.nextSibling = null;
			this.previousSibling = null;
			return;
		}

		this.nextSibling = this.parentNode.childNodes[index + 1] || null;
		this.previousSibling = this.parentNode.childNodes[index - 1] || null;

		if (this.nextSibling) {
			this.nextSibling.previousSibling = this;
		}
		if (this.previousSibling) {
			this.previousSibling.nextSibling = this;
		}
	}

	/**
	 * Adds a node to the end of the list of children of a specified parent node.
	 * If the node already exists it is removed from current parent node, then added to new parent node.
	 */
	public appendChild (childNode: Node): Node | null {
		return this.insertBefore(childNode, null);
	}

	/**
	 * Indicates whether the given node is a descendant of the current node.
	 */
	public contains (childNode: Node): boolean {
		while (childNode && childNode != this) {
			childNode = childNode.parentNode;
		}
		return childNode === this;
	}

	/**
	 * Inserts the specified node before a reference node as a child of the current node.
	 * If referenceNode is null, the new node is appended after the last child node of the current node.
	 */
	public insertBefore (newNode: Node, referenceNode: Node | null, suppressObservers: boolean = false): Node | null {
		// Check if referenceNode is a child
		if (referenceNode && referenceNode.parentNode !== this) {
			return null;
		}

		// Fix using the new node as a reference
		if (referenceNode === newNode) {
			referenceNode = newNode.nextSibling;
		}

		// Already there?
		if (newNode.parentNode === this && newNode.nextSibling === referenceNode) {
			return newNode;
		}

		// Detach from old parent
		if (newNode.parentNode) {
			// This removal is never suppressed
			newNode.parentNode.removeChild(newNode, false);
		}

		// Adopt nodes into document
		if (newNode.ownerDocument !== this.ownerDocument) {
			adopt(newNode, this.ownerDocument);
		}

		// Check index of reference node
		const index = referenceNode ? getNodeIndex(referenceNode) : this.childNodes.length;
		if (index < 0) {
			return null;
		}

		// Update ranges
		const document = this instanceof Document ? this : this.ownerDocument;
		document._ranges.forEach(range => {
			if (range.startContainer === this && range.startOffset > index) {
				range.startOffset += 1;
			}
			if (range.endContainer === this && range.endOffset > index) {
				range.endOffset += 1;
			}
		});

		// Queue mutation record
		if (!suppressObservers) {
			const record = new MutationRecord('childList', this);
			record.addedNodes.push(newNode);
			record.nextSibling = referenceNode;
			record.previousSibling = referenceNode ? referenceNode.previousSibling : this.lastChild;
			queueMutationRecord(record);
		}

		// Insert the node
		newNode.parentNode = this;
		this.childNodes.splice(index, 0, newNode);
		this._updateFirstLast();
		newNode._updateSiblings(index);

		return newNode;
	}

	/**
	 * Puts the specified node and all of its subtree into a "normalized" form.
	 * In a normalized subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
	 */
	public normalize (recurse: boolean = true) {
		let childNode = this.firstChild;
		let index = 0;
		const document = this instanceof Document ? this : this.ownerDocument;
		while (childNode) {
			let nextNode = childNode.nextSibling;
			if (childNode.nodeType === Node.TEXT_NODE) {
				const textChildNode = <Text>childNode;

				// Delete empty text nodes
				let length = textChildNode.length;
				if (!length) {
					childNode.parentNode.removeChild(childNode);
					--index;
				}
				else {
					// Concatenate and collect childNode's contiguous text nodes (excluding current)
					let data = '';
					const siblingsToRemove = [];
					let siblingIndex, sibling;
					for (sibling = childNode.nextSibling, siblingIndex = index;
						sibling && sibling.nodeType == Node.TEXT_NODE;
						sibling = sibling.nextSibling, ++siblingIndex
					) {
						data += sibling.data;
						siblingsToRemove.push(sibling);
					}

					// Append concatenated data, if any
					if (data) {
						textChildNode.appendData(data);
					}

					// Fix ranges
					for (sibling = childNode.nextSibling, siblingIndex = index + 1;
						sibling && sibling.nodeType == Node.TEXT_NODE;
						sibling = sibling.nextSibling, ++siblingIndex) {

						document._ranges.forEach(range => {
							if (range.startContainer === sibling) {
								range.setStart(childNode, length + range.startOffset);
							}
							if (range.startContainer === this && range.startOffset == siblingIndex) {
								range.setStart(childNode, length);
							}
							if (range.endContainer === sibling) {
								range.setEnd(childNode, length + range.endOffset);
							}
							if (range.endContainer === this && range.endOffset == siblingIndex) {
								range.setEnd(childNode, length);
							}
						});

						length += sibling.length;
					};

					// Remove contiguous text nodes (excluding current) in tree order
					while (siblingsToRemove.length) {
						this.removeChild(siblingsToRemove.shift());
					}

					// Update next node to process
					nextNode = childNode.nextSibling;
				}
			}
			else if (recurse) {
				// Recurse
				childNode.normalize();
			}

			// Move to next node
			childNode = nextNode;
			++index;
		}
	}

	/**
	 * Removes a child node from the DOM and returns the removed node.
	 */
	public removeChild (childNode: Node, suppressObservers: boolean = false): Node | null {
		// Check if childNode is a child
		if (childNode.parentNode !== this) {
			return null;
		}

		// Check index of node
		const index = getNodeIndex(childNode);
		if (index < 0) {
			return null;
		}

		// Update ranges
		const document = this instanceof Document ? this : this.ownerDocument;
		document._ranges.forEach(range => {
			if (childNode.contains(range.startContainer)) {
				range.setStart(this, index);
			}
			if (childNode.contains(range.endContainer)) {
				range.setEnd(this, index);
			}
			if (range.startContainer === this && range.startOffset > index) {
				range.startOffset -= 1;
			}
			if (range.endContainer === this && range.endOffset > index) {
				range.endOffset -= 1;
			}
		});

		// Queue mutation record
		if (!suppressObservers) {
			const record = new MutationRecord('childList', this);
			record.removedNodes.push(childNode);
			record.nextSibling = childNode.nextSibling;
			record.previousSibling = childNode.previousSibling;
			queueMutationRecord(record);
		}

		// Add transient registered observers to detect changes in the removed subtree
		for (let ancestor: Node = this; ancestor; ancestor = ancestor.parentNode) {
			childNode._registeredObservers.appendTransientsForAncestor(ancestor._registeredObservers);
		}

		// Remove the node
		childNode.parentNode = null;
		this.childNodes.splice(index, 1);
		this._updateFirstLast();
		childNode._updateSiblings(index);

		return childNode;
	}

	/**
	 * Replaces the given oldChild node with the given newChild node and returns the node that was replaced
	 * (i.e. oldChild).
	 */
	public replaceChild (newChild: Node, oldChild: Node): Node | null {
		// Check if oldChild is a child
		if (oldChild.parentNode !== this) {
			return null;
		}

		// Already there?
		if (newChild === oldChild) {
			return oldChild;
		}

		// Get reference node for insert
		let referenceNode = oldChild.nextSibling;
		if (referenceNode === newChild) {
			referenceNode = newChild.nextSibling;
		}

		// Detach from old parent
		if (newChild.parentNode) {
			// This removal is never suppressed
			newChild.parentNode.removeChild(newChild, false);
		}

		// Adopt nodes into document
		if (newChild.ownerDocument !== this.ownerDocument) {
			adopt(newChild, this.ownerDocument);
		}

		// Create mutation record
		const record = new MutationRecord('childList', this);
		record.addedNodes.push(newChild);
		record.removedNodes.push(oldChild);
		record.nextSibling = referenceNode;
		record.previousSibling = oldChild.previousSibling;

		// Remove old child
		this.removeChild(oldChild, true);

		// Insert new child
		this.insertBefore(newChild, referenceNode, true);

		// Queue mutation record
		queueMutationRecord(record);

		return oldChild;
	}

	/**
	 * Retrieves the object associated to a key on this node.
	 */
	public getUserData (key: string): any | null {
		const data = this._userDataByKey[key];
		if (data === undefined) {
			return null;
		}

		return data.value;
	}

	/**
	 * Retrieves the object associated to a key on this node. User data allows a user to attach (or remove) data to
	 * an element, without needing to modify the DOM. Note that such data will not be preserved when imported via
	 * Node.importNode, as with Node.cloneNode() and Node.renameNode() operations (though Node.adoptNode does
	 * preserve the information), and equality tests in Node.isEqualNode() do not consider user data in making the
	 * assessment.
	 *
	 * This method offers the convenience of associating data with specific nodes without needing to alter the
	 * structure of a document and in a standard fashion, but it also means that extra steps may need to be taken
	 * if one wishes to serialize the information or include the information upon clone, import, or rename
	 * operations.
	 */
	public setUserData (key: string, data: any = undefined) {
		const oldData = this._userDataByKey[key];
		const newData = {
			name: key,
			value: data
		};
		let oldValue = null;

		// No need to trigger observers if the value doesn't actually change
		if (oldData) {
			oldValue = oldData.value;
			if (oldValue === data) {
				return oldValue;
			}

			if (data === undefined || data === null) {
				// Remove user data
				delete this._userDataByKey[key];
				const oldDataIndex = this._userData.indexOf(oldData);
				this._userData.splice(oldDataIndex, 1);
			}
			else {
				// Overwrite data
				oldData.value = data;
			}
		}
		else {
			this._userDataByKey[key] = newData;
			this._userData.push(newData);
		}

		// Queue a mutation record (non-standard, but useful)
		const record = new MutationRecord('userData', this);
		record.attributeName = key;
		record.oldValue = oldValue;
		queueMutationRecord(record);

		return oldValue;
	}

	/**
	 * Returns a copy of the current node.
	 * Override on subclasses and pass a shallow copy of the node in the 'copy' parameter (I.e. they create a new
	 * instance of their class with their specific constructor parameters.)
	 */
	public cloneNode (deep: boolean = true, _copy: Node = null) {
		if (!_copy) {
			return null;
		}

		// Set owner document
		if (_copy.nodeType !== Node.DOCUMENT_NODE) {
			_copy.ownerDocument = this.ownerDocument;
		}

		// User data is not copied, it is assumed to apply only to the original instance

		// Recurse if required
		if (deep) {
			for (let child = this.firstChild; child; child = child.nextSibling) {
				_copy.appendChild(child.cloneNode(true));
			}
		}

		return _copy;
	}
}

(Node.prototype as any).ELEMENT_NODE = 1;
(Node.prototype as any).TEXT_NODE = 3;
(Node.prototype as any).PROCESSING_INSTRUCTION_NODE = 7;
(Node.prototype as any).COMMENT_NODE = 8;
(Node.prototype as any).DOCUMENT_NODE = 9;
(Node.prototype as any).DOCUMENT_TYPE_NODE = 10;
