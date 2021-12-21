import CharacterData from './CharacterData';
import Document from './Document';
import DocumentFragment from './DocumentFragment';
import Element from './Element';
import Node from './Node';

import { NodeType, isNodeOfType } from './util/NodeType';

/**
 * 3.2.4. Mixin NonElementParentNode
 */
export interface NonElementParentNode {}
// Document implements NonElementParentNode;
// DocumentFragment implements NonElementParentNode;

/**
 * 3.2.6. Mixin ParentNode
 */
export interface ParentNode {
	readonly children: Element[];

	firstElementChild: Element | null;
	lastElementChild: Element | null;
	childElementCount: number;

	prepend(...nodes: (Node | string)[]): void;
	append(...nodes: (Node | string)[]): void;
	replaceChildren(...nodes: (Node | string)[]): void;
}
// Document implements ParentNode;
// DocumentFragment implements ParentNode;
// Element implements ParentNode;

export function asParentNode(node: Node): ParentNode | null {
	// This is only called from treeMutations.js, where node can never be anything other than these
	/* istanbul ignore else */
	if (
		isNodeOfType(
			node,
			NodeType.ELEMENT_NODE,
			NodeType.DOCUMENT_NODE,
			NodeType.DOCUMENT_FRAGMENT_NODE
		)
	) {
		return node as Element | Document | DocumentFragment;
	}

	/* istanbul ignore next */
	return null;
}

/**
 * Returns the element children of node.
 *
 * (Non-standard) According to the spec, the children getter should return a live HTMLCollection.
 * This implementation returns a static array instead.
 *
 * @param node - The node to get element children of
 *
 * @returns The
 */
export function getChildren(node: ParentNode): Element[] {
	const elements: Element[] = [];
	for (let child = node.firstElementChild; child; child = child.nextElementSibling) {
		elements.push(child);
	}
	return elements;
}

/**
 * 3.2.7. Mixin NonDocumentTypeChildNode
 */
export interface NonDocumentTypeChildNode {
	readonly previousElementSibling: Element | null;
	readonly nextElementSibling: Element | null;
}
// Element implements NonDocumentTypeChildNode;
// CharacterData implements NonDocumentTypeChildNode;

export function asNonDocumentTypeChildNode(node: Node): NonDocumentTypeChildNode | null {
	if (
		isNodeOfType(
			node,
			NodeType.ELEMENT_NODE,
			NodeType.COMMENT_NODE,
			NodeType.PROCESSING_INSTRUCTION_NODE,
			NodeType.TEXT_NODE,
			NodeType.CDATA_SECTION_NODE
		)
	) {
		return node as Element | CharacterData;
	}

	return null;
}

export function getPreviousElementSibling(node: Node): Element | null {
	for (let sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
		if (isNodeOfType(sibling, NodeType.ELEMENT_NODE)) {
			return sibling as Element;
		}
	}

	return null;
}

export function getNextElementSibling(node: Node): Element | null {
	for (let sibling = node.nextSibling; sibling; sibling = sibling.nextSibling) {
		if (isNodeOfType(sibling, NodeType.ELEMENT_NODE)) {
			return sibling as Element;
		}
	}

	return null;
}

/**
 * 3.2.8. Mixin ChildNode
 */
export interface ChildNode {
	before(...nodes: (Node | string)[]): void;
	after(...nodes: (Node | string)[]): void;
	replaceWith(...nodes: (Node | string)[]): void;
	remove(): void;
}
// DocumentType implements ChildNode;
// Element implements ChildNode;
// CharacterData implements ChildNode;
