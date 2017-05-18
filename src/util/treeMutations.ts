import { asParentNode, asNonDocumentTypeChildNode } from '../mixins';
import Document from '../Document';
import DocumentType from '../DocumentType';
import Element from '../Element';
import Node from '../Node';

import { NodeType, isNodeOfType } from './NodeType';

/**
 * Insert node into parent's children before referenceNode.
 *
 * Updates the pointers that model the tree, as well as precomputing derived properties.
 *
 * @param node           Node to insert
 * @param parent         Parent to insert under
 * @param referenceChild Child to insert before
 */
export function insertIntoChildren (node: Node, parent: Node, referenceChild: Node | null): void {
	// Node
	node.parentNode = parent;
	const previousSibling: Node | null = referenceChild === null ? parent.lastChild : referenceChild.previousSibling;
	const nextSibling: Node | null = referenceChild === null ? null : referenceChild;
	node.previousSibling = previousSibling;
	node.nextSibling = nextSibling;
	if (previousSibling) {
		previousSibling.nextSibling = node;
	}
	else {
		parent.firstChild = node;
	}
	if (nextSibling) {
		nextSibling.previousSibling = node;
		parent.childNodes.splice(parent.childNodes.indexOf(nextSibling), 0, node);
	}
	else {
		parent.lastChild = node;
		parent.childNodes.push(node);
	}

	// ParentNode
	if (isNodeOfType(node, NodeType.ELEMENT_NODE)) {
		const element = node as Element;
		const parentNode = asParentNode(parent);
		if (parentNode) {
			let previousElementSibling: Element | null = null;
			for (let sibling = previousSibling; sibling; sibling = sibling.previousSibling) {
				if (isNodeOfType(sibling, NodeType.ELEMENT_NODE)) {
					previousElementSibling = sibling as Element;
					break;
				}
				const siblingNonDocumentTypeChildNode = asNonDocumentTypeChildNode(sibling);
				if (siblingNonDocumentTypeChildNode) {
					previousElementSibling = siblingNonDocumentTypeChildNode.previousElementSibling;
					break;
				}
			}

			let nextElementSibling: Element | null = null;
			for (let sibling = nextSibling; sibling; sibling = sibling.nextSibling) {
				if (isNodeOfType(sibling, NodeType.ELEMENT_NODE)) {
					nextElementSibling = sibling as Element;
					break;
				}
				const siblingNonDocumentTypeChildNode = asNonDocumentTypeChildNode(sibling);
				if (siblingNonDocumentTypeChildNode) {
					nextElementSibling = siblingNonDocumentTypeChildNode.nextElementSibling;
					break;
				}
			}

			if (!previousElementSibling) {
				parentNode.firstElementChild = element;
			}
			if (!nextElementSibling) {
				parentNode.lastElementChild = element;
			}
			parentNode.childElementCount += 1;
		}
	}

	// Document
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		if (isNodeOfType(node, NodeType.ELEMENT_NODE)) {
			parentDocument.documentElement = node as Element;
		}
		else if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			parentDocument.doctype = node as DocumentType;
		}
	}
}

/**
 * Remove node from parent's children.
 *
 * Updates the pointers that model the tree, as well as precomputing derived properties.
 *
 * @param node   Node to remove
 * @param parent Parent to remove from
 */
export function removeFromChildren (node: Node, parent: Node) {
	const previousSibling = node.previousSibling;
	const nextSibling = node.nextSibling;
	const isElement = isNodeOfType(node, NodeType.ELEMENT_NODE);
	const previousElementSibling = isElement ? (node as Element).previousElementSibling : null;
	const nextElementSibling = isElement ? (node as Element).nextElementSibling : null;

	// Node
	node.parentNode = null;
	node.previousSibling = null;
	node.nextSibling = null;
	if (previousSibling) {
		previousSibling.nextSibling = nextSibling;
	}
	else {
		parent.firstChild = nextSibling;
	}
	if (nextSibling) {
		nextSibling.previousSibling = previousSibling;
	}
	else {
		parent.lastChild = previousSibling;
	}
	parent.childNodes.splice(parent.childNodes.indexOf(node), 1);

	// ParentNode
	if (isElement) {
		const parentNode = asParentNode(parent);
		if (parentNode) {
			if (parentNode.firstElementChild === node) {
				parentNode.firstElementChild = nextElementSibling;
			}
			if (parentNode.lastElementChild === node) {
				parentNode.lastElementChild = previousElementSibling;
			}
			parentNode.childElementCount -= 1;
		}
	}

	// Document
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		if (isNodeOfType(node, NodeType.ELEMENT_NODE)) {
			parentDocument.documentElement = null;
		}
		else if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			parentDocument.doctype = null;
		}
	}
}
