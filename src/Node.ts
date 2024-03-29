import Attr from './Attr';
import Element from './Element';
import Document from './Document';
import Text from './Text';
import { getContext } from './context/Context';
import RegisteredObservers from './mutation-observer/RegisteredObservers';
import cloneNode from './util/cloneNode';
import { expectArity } from './util/errorHelpers';
import {
	preInsertNode,
	appendNode,
	replaceChildWithNode,
	preRemoveChild,
	removeNode,
} from './util/mutationAlgorithms';
import { NodeType, isNodeOfType, isAttrNode } from './util/NodeType';
import {
	getInclusiveAncestors,
	getNodeDocument,
	getNodeIndex,
	getRootOfNode,
} from './util/treeHelpers';
import { asNullableObject, asNullableString, asObject } from './util/typeHelpers';

const orderKeyByNode = new WeakMap<Node, number>();

/**
 * Get an implementation-dependent integer value that can be used to consistently determine an
 * ordering between unrelated nodes.
 *
 * @param node - The node to compare ordering for
 */
function getOrderKey(node: Node): number {
	let orderKey = orderKeyByNode.get(node);
	if (orderKey === undefined) {
		orderKey = Math.random();
		orderKeyByNode.set(node, orderKey);
	}
	return orderKey;
}

/**
 * 3.4. Interface Node
 *
 * @public
 */
export default abstract class Node {
	// Node types are exposed as properties of the constructor
	static ELEMENT_NODE: number = NodeType.ELEMENT_NODE;
	static ATTRIBUTE_NODE: number = NodeType.ATTRIBUTE_NODE;
	static TEXT_NODE: number = NodeType.TEXT_NODE;
	static CDATA_SECTION_NODE: number = NodeType.CDATA_SECTION_NODE;
	static ENTITY_REFERENCE_NODE: number = NodeType.ENTITY_REFERENCE_NODE; // legacy
	static ENTITY_NODE: number = NodeType.ENTITY_NODE; // legacy
	static PROCESSING_INSTRUCTION_NODE: number = NodeType.PROCESSING_INSTRUCTION_NODE;
	static COMMENT_NODE: number = NodeType.COMMENT_NODE;
	static DOCUMENT_NODE: number = NodeType.DOCUMENT_NODE;
	static DOCUMENT_TYPE_NODE: number = NodeType.DOCUMENT_TYPE_NODE;
	static DOCUMENT_FRAGMENT_NODE: number = NodeType.DOCUMENT_FRAGMENT_NODE;
	static NOTATION_NODE: number = NodeType.NOTATION_NODE; // legacy

	// Node types also exist as instance properties, assigned to the prototype below
	public ELEMENT_NODE!: number;
	public ATTRIBUTE_NODE!: number;
	public TEXT_NODE!: number;
	public CDATA_SECTION_NODE!: number;
	public ENTITY_REFERENCE_NODE!: number; // legacy
	public ENTITY_NODE!: number; // legacy
	public PROCESSING_INSTRUCTION_NODE!: number;
	public COMMENT_NODE!: number;
	public DOCUMENT_NODE!: number;
	public DOCUMENT_TYPE_NODE!: number;
	public DOCUMENT_FRAGMENT_NODE!: number;
	public NOTATION_NODE!: number; // legacy

	/**
	 * Returns the type of node, represented by a number.
	 */
	public abstract get nodeType(): number;

	/**
	 * Returns a string appropriate for the type of node.
	 */
	public abstract get nodeName(): string;

	/**
	 * A reference to the Document node in which the current node resides.
	 */
	public ownerDocument: Document | null = null;

	/**
	 * The parent node of the current node.
	 */
	public parentNode: Node | null = null;

	/**
	 * The parent if it is an element, or null otherwise.
	 */
	public get parentElement(): Element | null {
		return this.parentNode && isNodeOfType(this.parentNode, NodeType.ELEMENT_NODE)
			? (this.parentNode as Element)
			: null;
	}

	/**
	 * Returns true if this has children, and false otherwise.
	 */
	public hasChildNodes(): boolean {
		return !!this.childNodes.length;
	}

	/**
	 * The node's children.
	 *
	 * Non-standard: implemented as an array rather than a NodeList.
	 */
	public childNodes: Node[] = [];

	/**
	 * The first child node of the current node, or null if it has no children.
	 */
	public firstChild: Node | null = null;

	/**
	 * The last child node of the current node, or null if it has no children.
	 */
	public lastChild: Node | null = null;

	/**
	 * The first preceding sibling of the current node, or null if it has none.
	 */
	public previousSibling: Node | null = null;

	/**
	 * The first following sibling of the current node, or null if it has none.
	 */
	public nextSibling: Node | null = null;

	/**
	 * The value of the node.
	 */
	public abstract get nodeValue(): string | null;
	public abstract set nodeValue(value: string | null);

	/**
	 * The textContent of the node.
	 */
	public abstract get textContent(): string | null;
	public abstract set textContent(value: string | null);

	/**
	 * (non-standard)
	 * Each node has a registered observer list of zero or more registered observers, which is
	 * initially empty.
	 */
	public _registeredObservers: RegisteredObservers = new RegisteredObservers(this);

	/**
	 * Puts the specified node and all of its subtree into a "normalized" form. In a normalized
	 * subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
	 */
	public normalize(): void {
		// for each descendant exclusive Text node node of this:
		let node = this.firstChild;
		let index = 0;
		const document = getNodeDocument(this);
		while (node) {
			let nextNode = node.nextSibling;
			if (!isNodeOfType(node, NodeType.TEXT_NODE)) {
				// Process descendants
				node.normalize();
				node = nextNode;
				continue;
			}

			const textNode = node as Text;
			// 1. Let length be node’s length.
			let length = textNode.length;

			// 2. If length is zero, then remove node and continue with the next exclusive Text
			// node, if any.
			if (length === 0) {
				removeNode(node);
				--index;
				node = nextNode;
				continue;
			}

			// 3. Let data be the concatenation of the data of node’s contiguous exclusive Text
			// nodes (excluding itself), in tree order.
			let data = '';
			const siblingsToRemove = [];
			for (
				let sibling = textNode.nextSibling;
				sibling && isNodeOfType(sibling, NodeType.TEXT_NODE);
				sibling = sibling.nextSibling
			) {
				data += (sibling as Text).data;
				siblingsToRemove.push(sibling);
			}

			// 4. Replace data with node node, offset length, count 0, and data data.
			if (data) {
				textNode.replaceData(length, 0, data);
			}

			// 5. Let currentNode be node’s next sibling.
			// 6. While currentNode is an exclusive Text node:
			const context = getContext(this);
			for (let i = 0, l = siblingsToRemove.length; i < l; ++i) {
				const currentNode = siblingsToRemove[i];
				const currentNodeIndex = index + i + 1;

				context.forEachRange((range) => {
					// 6.1. For each live range whose start node is currentNode, add length to its
					// start offset and set its start node to node.
					if (range.startContainer === currentNode) {
						range.startOffset += length;
						range.startContainer = textNode;
					}

					// 6.2. For each live range whose end node is currentNode, add length to its end
					// offset and set its end node to node.
					if (range.endContainer === currentNode) {
						range.endOffset += length;
						range.endContainer = textNode;
					}

					// 6.3. For each live range whose start node is currentNode’s parent and start
					// offset is currentNode’s index, set its start node to node and its start
					// offset to length.
					if (range.startContainer === this && range.startOffset === currentNodeIndex) {
						range.startContainer = textNode;
						range.startOffset = length;
					}

					// 6.4. For each live range whose end node is currentNode’s parent and end
					// offset is currentNode’s index, set its end node to node and its end offset to
					// length.
					if (range.endContainer === this && range.endOffset === currentNodeIndex) {
						range.endContainer = textNode;
						range.endOffset = length;
					}
				});

				// 6.5. Add currentNode’s length to length.
				length += (currentNode as Text).length;

				// 6.6. Set currentNode to its next sibling.
				// (see for-loop increment)
			}

			// 7. Remove node’s contiguous exclusive Text nodes (excluding itself), in tree order.
			while (siblingsToRemove.length) {
				removeNode(siblingsToRemove.shift() as Node);
			}

			// Move to next node
			node = node.nextSibling;
			++index;
		}
	}

	/**
	 * Returns a copy of the current node.
	 *
	 * @param deep - Whether to also clone the node's descendants
	 *
	 * @returns A copy of the current node
	 */
	public cloneNode(deep: boolean = false): this {
		return cloneNode(this, deep);
	}

	static DOCUMENT_POSITION_DISCONNECTED = 0x1;
	static DOCUMENT_POSITION_PRECEDING = 0x2;
	static DOCUMENT_POSITION_FOLLOWING = 0x4;
	static DOCUMENT_POSITION_CONTAINS = 0x8;
	static DOCUMENT_POSITION_CONTAINED_BY = 0x10;
	static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;

	/**
	 * Compare the position of this node with the given one.
	 *
	 * @param other - Node to compare with
	 *
	 * @returns a combination of the DOCUMENT_POSITION_* flags
	 */
	public compareDocumentPosition(other: Node): number {
		expectArity(arguments, 1);
		other = asObject(other, Node);

		// 1. If this is other, then return zero.
		if (this === other) {
			return 0;
		}

		// 2. Let node1 be other and node2 be this.
		let node1: Node | null = other;
		let node2: Node | null = this;

		// 3. Let attr1 and attr2 be null.
		let attr1: Attr | null = null;
		let attr2: Attr | null = null;

		// 4. If node1 is an attribute, then set attr1 to node1 and node1 to attr1's element.
		if (isAttrNode(node1)) {
			attr1 = node1;
			node1 = attr1.ownerElement;
		}

		// 5. If node2 is an attribute, then:
		if (isAttrNode(node2)) {
			// 5.1. Set attr2 to node2 and node2 to attr2's element.
			attr2 = node2;
			node2 = attr2.ownerElement;

			// 5.2. If attr1 and node1 are non-null, and node2 is node1, then:
			if (attr1 !== null && node1 !== null && node2 === node1) {
				// 5.2.1. For each attr in node2’s attribute list:
				for (const attr of (node2 as Element).attributes) {
					// 5.2.1.1. If attr equals attr1, then return the result of adding
					// DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC and DOCUMENT_POSITION_PRECEDING.
					if (attr === attr1) {
						return (
							Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
							Node.DOCUMENT_POSITION_PRECEDING
						);
					}

					// 5.2.1.2. If attr equals attr2, then return the result of adding
					// DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC and DOCUMENT_POSITION_FOLLOWING.
					if (attr === attr2) {
						return (
							Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
							Node.DOCUMENT_POSITION_FOLLOWING
						);
					}
				}
			}
		}

		// 6. If node1 or node2 is null, or node1's root is not node2's root, then return the result
		// of adding DOCUMENT_POSITION_DISCONNECTED, DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC, and
		// either DOCUMENT_POSITION_PRECEDING or DOCUMENT_POSITION_FOLLOWING, with the constraint
		// that this is to be consistent, together.
		// Note: Whether to return DOCUMENT_POSITION_PRECEDING or DOCUMENT_POSITION_FOLLOWING is
		// typically implemented via pointer comparison. In JavaScript implementations a cached
		// Math.random() value can be used.
		if (node1 === null || node2 === null) {
			return (
				Node.DOCUMENT_POSITION_DISCONNECTED |
				Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
				(getOrderKey(node1 || attr1!) > getOrderKey(node2 || attr2!)
					? Node.DOCUMENT_POSITION_FOLLOWING
					: Node.DOCUMENT_POSITION_PRECEDING)
			);
		}
		const ancestors1 = getInclusiveAncestors(node1);
		const ancestors2 = getInclusiveAncestors(node2);
		if (ancestors1[0] !== ancestors2[0]) {
			return (
				Node.DOCUMENT_POSITION_DISCONNECTED |
				Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
				(getOrderKey(ancestors1[0]) > getOrderKey(ancestors2[0])
					? Node.DOCUMENT_POSITION_FOLLOWING
					: Node.DOCUMENT_POSITION_PRECEDING)
			);
		}

		// 7. If node1 is an ancestor of node2 and attr1 is null, or node1 is node2 and attr2 is
		// non-null, then return the result of adding DOCUMENT_POSITION_CONTAINS to
		// DOCUMENT_POSITION_PRECEDING.
		let firstDistinctAncestorIndex = 0;
		while (
			firstDistinctAncestorIndex < ancestors1.length &&
			firstDistinctAncestorIndex < ancestors2.length
		) {
			if (ancestors1[firstDistinctAncestorIndex] !== ancestors2[firstDistinctAncestorIndex]) {
				break;
			}
			++firstDistinctAncestorIndex;
		}
		const node1ContainsNode2 =
			node1 !== node2 && firstDistinctAncestorIndex === ancestors1.length;
		const node2ContainsNode1 =
			node1 !== node2 && firstDistinctAncestorIndex === ancestors2.length;
		if ((node1ContainsNode2 && attr1 === null) || (node1 === node2 && attr2 !== null)) {
			return Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;
		}

		// 8. If node1 is a descendant of node2 and attr2 is null, or node1 is node2 and attr1 is
		// non-null, then return the result of adding DOCUMENT_POSITION_CONTAINED_BY to
		// DOCUMENT_POSITION_FOLLOWING.
		if ((node2ContainsNode1 && attr2 === null) || (node1 === node2 && attr1 !== null)) {
			return Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING;
		}

		// 9. If node1 is preceding node2, then return DOCUMENT_POSITION_PRECEDING.
		// Note: Due to the way attributes are handled in this algorithm this results in a node's
		// attributes counting as preceding that node's children, despite attributes not
		// participating in the same tree.
		if (
			node1ContainsNode2 ||
			getNodeIndex(ancestors1[firstDistinctAncestorIndex]) <
				getNodeIndex(ancestors2[firstDistinctAncestorIndex])
		) {
			return Node.DOCUMENT_POSITION_PRECEDING;
		}

		// 10. Return DOCUMENT_POSITION_FOLLOWING.
		return Node.DOCUMENT_POSITION_FOLLOWING;
	}

	/**
	 * Returns true if other is an inclusive descendant of this, and false otherwise
	 * (including when other is null).
	 *
	 * @param childNode - Node to check
	 *
	 * @returns Whether childNode is an inclusive descendant of the current node
	 */
	public contains(other: Node | null): boolean {
		expectArity(arguments, 1);
		other = asNullableObject(other, Node);

		while (other && other != this) {
			other = other.parentNode;
		}
		return other === this;
	}

	/**
	 *
	 *
	 * @param namespace - The namespace to look up
	 *
	 * @returns The prefix for the given namespace, or null if none was found
	 */
	public abstract lookupPrefix(namespace: string | null): string | null;

	/**
	 * Returns the namespace for the given prefix.
	 *
	 * @param prefix - The prefix to look up
	 *
	 * @returns The namespace for the given prefix, or null if the prefix is not defined
	 */
	public abstract lookupNamespaceURI(prefix: string | null): string | null;

	/**
	 * Return true if defaultNamespace is the same as namespace, and false otherwise.
	 *
	 * @param namespace - The namespace to check
	 *
	 * @returns Whether namespace is the default namespace
	 */
	public isDefaultNamespace(namespace: string | null): boolean {
		expectArity(arguments, 1);
		namespace = asNullableString(namespace);

		// 1. If namespace is the empty string, then set it to null.
		if (namespace === '') {
			namespace = null;
		}

		// 2. Let defaultNamespace be the result of running locate a namespace for this
		// using null.
		const defaultNamespace = this.lookupNamespaceURI(null);

		// 3. Return true if defaultNamespace is the same as namespace, and false otherwise.
		return defaultNamespace === namespace;
	}

	/**
	 * Inserts the specified node before child within this.
	 *
	 * If child is null, the new node is appended after the last child node of the current node.
	 *
	 * @param node  - Node to insert
	 * @param child - Childnode of the current node before which to insert, or null to append
	 *                newNode at the end
	 *
	 * @returns The node that was inserted
	 */
	public insertBefore<TNode extends Node>(node: TNode, child: Node | null): TNode {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		child = asNullableObject(child, Node);

		return preInsertNode(node, this, child);
	}

	/**
	 * Adds node to the end of the list of children of this.
	 *
	 * If the node already exists it is removed from its current parent node, then added.
	 *
	 * @param node - Node to append
	 *
	 * @returns The node that was inserted
	 */
	public appendChild<TNode extends Node>(node: TNode): TNode {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		return appendNode(node, this);
	}

	/**
	 * Replaces child with node within this and returns child.
	 *
	 * @param node  - Node to insert
	 * @param child - Node to remove
	 *
	 * @returns The node that was removed
	 */
	public replaceChild<TChild extends Node>(node: Node, child: TChild): TChild {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		child = asObject(child, Node);

		return replaceChildWithNode(child, node, this);
	}

	/**
	 * Removes child from this and returns the removed node.
	 *
	 * @param child - Child of the current node to remove
	 *
	 * @returns The node that was removed
	 */
	public removeChild<TChild extends Node>(child: TChild): TChild {
		expectArity(arguments, 1);
		child = asObject(child, Node);

		return preRemoveChild(child, this);
	}

	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public abstract _copy(document: Document): Node;
}

Node.prototype.ELEMENT_NODE = NodeType.ELEMENT_NODE;
Node.prototype.ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
Node.prototype.TEXT_NODE = NodeType.TEXT_NODE;
Node.prototype.CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
Node.prototype.ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE; // legacy
Node.prototype.ENTITY_NODE = NodeType.ENTITY_NODE; // legacy
Node.prototype.PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
Node.prototype.COMMENT_NODE = NodeType.COMMENT_NODE;
Node.prototype.DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
Node.prototype.DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
Node.prototype.DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
Node.prototype.NOTATION_NODE = NodeType.NOTATION_NODE; // legacy
