import CharacterData from '../CharacterData';
import Document from '../Document';
import Node from '../Node';
import { NodeType, isNodeOfType } from './NodeType';

/**
 * 3.2. Node Tree: to determine the length of a node, switch on node:
 *
 * @param node - The node to determine the length of
 *
 * @returns The length of the node
 */
export function determineLengthOfNode(node: Node): number {
	switch (node.nodeType) {
		// DocumentType: Zero.
		// (not necessary, as doctypes never have children)

		// Text, ProcessingInstruction, Comment: The number of code units in its data.
		case NodeType.TEXT_NODE:
		case NodeType.PROCESSING_INSTRUCTION_NODE:
		case NodeType.COMMENT_NODE:
			return (node as CharacterData).data.length;

		// Any other node: Its number of children.
		default:
			return node.childNodes.length;
	}
}

/**
 * Get inclusive ancestors of the given node.
 *
 * @param node - Node to get inclusive ancestors of
 *
 * @returns Node's inclusive ancestors, in tree order
 */
export function getInclusiveAncestors(node: Node): Node[] {
	let ancestor: Node | null = node;
	let ancestors: Node[] = [];
	while (ancestor) {
		ancestors.unshift(ancestor);
		ancestor = ancestor.parentNode;
	}

	return ancestors;
}

/**
 * Get the node document associated with the given node.
 *
 * @param node - The node to get the node document for
 *
 * @returns The node document for node
 */
export function getNodeDocument(node: Node): Document {
	if (isNodeOfType(node, NodeType.DOCUMENT_NODE)) {
		return node as Document;
	}

	return node.ownerDocument!;
}

/**
 * Determine the index of the given node among its siblings.
 *
 * @param node - Node to determine the index of
 *
 * @returns The index of node in its parent's children
 */
export function getNodeIndex(node: Node): number {
	return node.parentNode!.childNodes.indexOf(node);
}

/**
 * The root of an object is itself, if its parent is null, or else it is the root of its parent.
 *
 * @param node - Node to get the root of
 *
 * @returns The root of node
 */
export function getRootOfNode(node: Node): Node {
	while (node.parentNode) {
		node = node.parentNode;
	}

	return node;
}

/**
 * Invokes callback on each inclusive descendant of node, in tree order
 *
 * @param node     - Root of the subtree to process
 * @param callback - Callback to invoke for each descendant, should not modify node's position in
 *                   the tree
 */
export function forEachInclusiveDescendant(node: Node, callback: (node: Node) => void): void {
	callback(node);
	for (let child = node.firstChild; child; child = child.nextSibling) {
		forEachInclusiveDescendant(child, callback);
	}
}
