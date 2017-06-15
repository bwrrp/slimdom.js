import Element from './Element';
import Document from './Document';
import Text from './Text';
import { ranges } from './Range';
import RegisteredObservers from './mutation-observer/RegisteredObservers';
import cloneNode from './util/cloneNode';
import { expectArity } from './util/errorHelpers';
import { preInsertNode, appendNode, replaceChildWithNode, preRemoveChild, removeNode } from './util/mutationAlgorithms';
import { NodeType, isNodeOfType } from './util/NodeType';
import { getNodeDocument } from './util/treeHelpers';
import { asNullableObject, asNullableString, asObject } from './util/typeHelpers';

/**
 * 3.4. Interface Node
 */
export default abstract class Node {
	static ELEMENT_NODE: number = NodeType.ELEMENT_NODE;
	static ATTRIBUTE_NODE: number = NodeType.ATTRIBUTE_NODE;
	static TEXT_NODE: number = NodeType.TEXT_NODE;
	static CDATA_SECTION_NODE: number = NodeType.CDATA_SECTION_NODE;
	static ENTITY_REFERENCE_NODE: number = NodeType.ENTITY_REFERENCE_NODE; // historical
	static ENTITY_NODE: number = NodeType.ENTITY_NODE; // historical
	static PROCESSING_INSTRUCTION_NODE: number = NodeType.PROCESSING_INSTRUCTION_NODE;
	static COMMENT_NODE: number = NodeType.COMMENT_NODE;
	static DOCUMENT_NODE: number = NodeType.DOCUMENT_NODE;
	static DOCUMENT_TYPE_NODE: number = NodeType.DOCUMENT_TYPE_NODE;
	static DOCUMENT_FRAGMENT_NODE: number = NodeType.DOCUMENT_FRAGMENT_NODE;
	static NOTATION_NODE: number = NodeType.NOTATION_NODE; // historical

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
		return this.parentNode && isNodeOfType(this.parentNode, NodeType.ELEMENT_NODE) ? this.parentNode as Element : null;
	}

	/**
	 * Returns true if the context object has children, and false otherwise.
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
	 * (non-standard) Each node has an associated list of registered observers.
	 */
	public _registeredObservers: RegisteredObservers = new RegisteredObservers(this);

	/**
	 * Puts the specified node and all of its subtree into a "normalized" form. In a normalized subtree, no text nodes
	 * in the subtree are empty and there are no adjacent text nodes.
	 */
	public normalize(): void {
		// for each descendant exclusive Text node node of context object:
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

			// 2. If length is zero, then remove node and continue with the next exclusive Text node, if any.
			if (length === 0) {
				removeNode(node, this);
				--index;
				node = nextNode;
				continue;
			}

			// 3. Let data be the concatenation of the data of node’s contiguous exclusive Text nodes (excluding
			// itself), in tree order.
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
			for (let i = 0, l = siblingsToRemove.length; i < l; ++i) {
				const currentNode = siblingsToRemove[i];
				const currentNodeIndex = index + i + 1;

				ranges.forEach(range => {
					// 6.1. For each range whose start node is currentNode, add length to its start offset and set its
					// start node to node.
					if (range.startContainer === currentNode) {
						range.startOffset += length;
						range.startContainer = textNode;
					}

					// 6.2. For each range whose end node is currentNode, add length to its end offset and set its end
					// node to node.
					if (range.endContainer === currentNode) {
						range.endOffset += length;
						range.endContainer = textNode;
					}

					// 6.3. For each range whose start node is currentNode’s parent and start offset is currentNode’s
					// index, set its start node to node and its start offset to length.
					if (range.startContainer === this && range.startOffset === currentNodeIndex) {
						range.startContainer = textNode;
						range.startOffset = length;
					}

					// 6.4. For each range whose end node is currentNode’s parent and end offset is currentNode’s index,
					// set its end node to node and its end offset to length.
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
				removeNode(siblingsToRemove.shift() as Node, this);
			}

			// Move to next node
			node = node.nextSibling;
			++index;
		}
	}

	/**
	 * Returns a copy of the current node.
	 *
	 * @param deep Whether to also clone the node's descendants
	 *
	 * @return A copy of the current node
	 */
	public cloneNode(deep: boolean = false): Node {
		return cloneNode(this, deep);
	}

	/**
	 * Returns true if other is an inclusive descendant of context object, and false otherwise (including when other is
	 * null).
	 *
	 * @param childNode Node to check
	 *
	 * @return Whether childNode is an inclusive descendant of the current node
	 */
	public contains(other: Node | null): boolean {
		while (other && other != this) {
			other = other.parentNode;
		}
		return other === this;
	}

	/**
	 *
	 *
	 * @param namespace The namespace to look up
	 *
	 * @return The prefix for the given namespace, or null if none was found
	 */
	public abstract lookupPrefix(namespace: string | null): string | null;

	/**
	 * Returns the namespace for the given prefix.
	 *
	 * @param prefix The prefix to look up
	 *
	 * @return The namespace for the given prefix, or null if the prefix is not defined
	 */
	public abstract lookupNamespaceURI(prefix: string | null): string | null;

	/**
	 * Return true if defaultNamespace is the same as namespace, and false otherwise.
	 *
	 * @param namespace The namespace to check
	 *
	 * @return Whether namespace is the default namespace
	 */
	public isDefaultNamespace(namespace: string | null): boolean {
		namespace = asNullableString(namespace);

		// 1. If namespace is the empty string, then set it to null.
		if (namespace === '') {
			namespace = null;
		}

		// 2. Let defaultNamespace be the result of running locate a namespace for context object using null.
		const defaultNamespace = this.lookupNamespaceURI(null);

		// 3. Return true if defaultNamespace is the same as namespace, and false otherwise.
		return defaultNamespace === namespace;
	}

	/**
	 * Inserts the specified node before child within context object.
	 *
	 * If child is null, the new node is appended after the last child node of the current node.
	 *
	 * @param node  Node to insert
	 * @param child Childnode of the current node before which to insert, or null to append newNode at the end
	 *
	 * @return The node that was inserted
	 */
	public insertBefore(node: Node, child: Node | null): Node {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		child = asNullableObject(child, Node);

		return preInsertNode(node, this, child);
	}

	/**
	 * Adds node to the end of the list of children of the context object.
	 *
	 * If the node already exists it is removed from its current parent node, then added.
	 *
	 * @param node Node to append
	 *
	 * @return The node that was inserted
	 */
	public appendChild(node: Node): Node {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		return appendNode(node, this);
	}

	/**
	 * Replaces child with node within context object and returns child.
	 *
	 * @param node  Node to insert
	 * @param child Node to remove
	 *
	 * @return The node that was removed
	 */
	public replaceChild(node: Node, child: Node): Node {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		child = asObject(child, Node);

		return replaceChildWithNode(child, node, this);
	}

	/**
	 * Removes child from context object and returns the removed node.
	 *
	 * @param child Child of the current node to remove
	 *
	 * @return The node that was removed
	 */
	public removeChild(child: Node): Node {
		expectArity(arguments, 1);
		child = asObject(child, Node);

		return preRemoveChild(child, this);
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public abstract _copy(document: Document): Node;
}

(Node.prototype as any).ELEMENT_NODE = NodeType.ELEMENT_NODE;
(Node.prototype as any).ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
(Node.prototype as any).TEXT_NODE = NodeType.TEXT_NODE;
(Node.prototype as any).CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
(Node.prototype as any).ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE; // historical
(Node.prototype as any).ENTITY_NODE = NodeType.ENTITY_NODE; // historical
(Node.prototype as any).PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
(Node.prototype as any).COMMENT_NODE = NodeType.COMMENT_NODE;
(Node.prototype as any).DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
(Node.prototype as any).DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
(Node.prototype as any).DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
(Node.prototype as any).NOTATION_NODE = NodeType.NOTATION_NODE; // historical
