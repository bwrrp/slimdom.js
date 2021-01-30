import { throwHierarchyRequestError, throwNotFoundError } from './errorHelpers';
import { NodeType, isNodeOfType } from './NodeType';
import {
	determineLengthOfNode,
	getNodeDocument,
	getNodeIndex,
	forEachInclusiveDescendant,
} from './treeHelpers';
import { insertIntoChildren, removeFromChildren } from './treeMutations';
import Document from '../Document';
import DocumentFragment from '../DocumentFragment';
import Element from '../Element';
import { ParentNode, ChildNode } from '../mixins';
import Node from '../Node';
import { getContext } from '../context/Context';
import queueMutationRecord from '../mutation-observer/queueMutationRecord';
import Text from '../Text';

// 3.2.3. Mutation algorithms

/**
 * To ensure pre-insertion validity of a node into a parent before a child, run these steps:
 */
function ensurePreInsertionValidity(node: Node, parent: Node, child: Node | null): void {
	// 1. If parent is not a Document, DocumentFragment, or Element node, throw a
	// HierarchyRequestError.
	if (
		!isNodeOfType(
			parent,
			NodeType.DOCUMENT_NODE,
			NodeType.DOCUMENT_FRAGMENT_NODE,
			NodeType.ELEMENT_NODE
		)
	) {
		throwHierarchyRequestError('parent must be a Document, DocumentFragment or Element node');
	}

	// 2. If node is a host-including inclusive ancestor of parent, throw a HierarchyRequestError.
	if (node.contains(parent)) {
		throwHierarchyRequestError('node must not be an inclusive ancestor of parent');
	}

	// 3. If child is not null and its parent is not parent, then throw a NotFoundError.
	if (child && child.parentNode !== parent) {
		throwNotFoundError('child is not a child of parent');
	}

	// 4. If node is not a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction, or
	// Comment node, throw a HierarchyRequestError.
	if (
		!isNodeOfType(
			node,
			NodeType.DOCUMENT_FRAGMENT_NODE,
			NodeType.DOCUMENT_TYPE_NODE,
			NodeType.ELEMENT_NODE,
			NodeType.TEXT_NODE,
			NodeType.CDATA_SECTION_NODE,
			NodeType.PROCESSING_INSTRUCTION_NODE,
			NodeType.COMMENT_NODE
		)
	) {
		throwHierarchyRequestError(
			'node must be a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction ' +
				'or Comment node'
		);
	}

	// 5. If either node is a Text node and parent is a document, or node is a doctype and parent is
	// not a document, throw a HierarchyRequestError.
	if (isNodeOfType(node, NodeType.TEXT_NODE) && isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can not insert a Text node under a Document');
	}
	if (
		isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE) &&
		!isNodeOfType(parent, NodeType.DOCUMENT_NODE)
	) {
		throwHierarchyRequestError('can only insert a DocumentType node under a Document');
	}

	// 6. If parent is a document, and any of the statements below, switched on node, are true,
	// throw a HierarchyRequestError.
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		switch (node.nodeType) {
			// DocumentFragment node
			case NodeType.DOCUMENT_FRAGMENT_NODE:
				// If node has more than one element child or has a Text node child.
				const fragment = node as DocumentFragment;
				if (fragment.firstElementChild !== fragment.lastElementChild) {
					throwHierarchyRequestError(
						'can not insert more than one element under a Document'
					);
				}
				if (
					Array.from(fragment.childNodes).some((child) =>
						isNodeOfType(child, NodeType.TEXT_NODE)
					)
				) {
					throwHierarchyRequestError('can not insert a Text node under a Document');
				}
				// Otherwise, if node has one element child and either parent has an element child,
				// child is a doctype, or child is not null and a doctype is following child.
				if (
					fragment.firstElementChild &&
					(parentDocument.documentElement ||
						(child && isNodeOfType(child, NodeType.DOCUMENT_TYPE_NODE)) ||
						(child &&
							parentDocument.doctype &&
							getNodeIndex(child) < getNodeIndex(parentDocument.doctype)))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;

			// element
			case NodeType.ELEMENT_NODE:
				// parent has an element child, child is a doctype, or child is not null and a
				// doctype is following child.
				if (
					parentDocument.documentElement ||
					(child && isNodeOfType(child, NodeType.DOCUMENT_TYPE_NODE)) ||
					(child &&
						parentDocument.doctype &&
						getNodeIndex(child) < getNodeIndex(parentDocument.doctype))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;

			// doctype
			case NodeType.DOCUMENT_TYPE_NODE:
				// parent has a doctype child, child is non-null and an element is preceding child,
				// or child is null and parent has an element child.
				if (
					parentDocument.doctype ||
					(child &&
						parentDocument.documentElement &&
						getNodeIndex(parentDocument.documentElement) < getNodeIndex(child)) ||
					(!child && parentDocument.documentElement)
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;
		}
	}
}

/**
 * To pre-insert a node into a parent before a child, run these steps:
 *
 * @param node   - Node to pre-insert
 * @param parent - Parent to insert under
 * @param child  - Child to insert before, or null to insert at the end of parent
 *
 * @returns The inserted node
 */
export function preInsertNode<TNode extends Node>(
	node: TNode,
	parent: Node,
	child: Node | null
): TNode {
	// 1. Ensure pre-insertion validity of node into parent before child.
	ensurePreInsertionValidity(node, parent, child);

	// 2. Let reference child be child.
	let referenceChild = child;

	// 3. If reference child is node, set it to node’s next sibling.
	if (referenceChild === node) {
		referenceChild = node.nextSibling;
	}

	// 4. Adopt node into parent’s node document.
	adoptNode(node, getNodeDocument(parent));

	// 5. Insert node into parent before reference child.
	insertNode(node, parent, referenceChild);

	// 6. Return node.
	return node;
}

/**
 * To insert a node into a parent before a child, with an optional suppress observers flag, run
 * these steps:
 *
 * @param node              - Node to insert
 * @param parent            - Parent to insert under
 * @param child             - Child to insert before, or null to insert at end of parent
 * @param suppressObservers - Whether to skip enqueueing a mutation record for this mutation
 */
export function insertNode(
	node: Node,
	parent: Node,
	child: Node | null,
	suppressObservers: boolean = false
): void {
	// 1. Let count be the number of children of node if it is a DocumentFragment node, and one
	// otherwise.
	const isDocumentFragment = isNodeOfType(node, NodeType.DOCUMENT_FRAGMENT_NODE);
	const count = isDocumentFragment ? determineLengthOfNode(node) : 1;

	// 2. If child is non-null, then:
	if (child !== null) {
		const childIndex = getNodeIndex(child);
		const context = getContext(node);
		context.forEachRange((range) => {
			// 2.1. For each live range whose start node is parent and start offset is greater than
			// child’s index, increase its start offset by count.
			if (range.startContainer === parent && range.startOffset > childIndex) {
				range.startOffset += count;
			}

			// 2.2. For each live range whose end node is parent and end offset is greater than
			// child’s index, increase its end offset by count.
			if (range.endContainer === parent && range.endOffset > childIndex) {
				range.endOffset += count;
			}
		});
	}

	// 3. Let nodes be node’s children if node is a DocumentFragment node, and a list containing
	// solely node otherwise.
	const nodes = isDocumentFragment ? Array.from(node.childNodes) : [node];

	// 4. If node is a DocumentFragment node, remove its children with the suppress observers flag
	// set.
	if (isDocumentFragment) {
		nodes.forEach((n) => removeNode(n, node, true));
	}

	// 5. If node is a DocumentFragment node, then queue a tree mutation record for node with « »,
	// nodes, null and null. This step intentionally does not pay attention to the suppress
	// observers flag.
	if (isDocumentFragment) {
		queueMutationRecord('childList', node, {
			removedNodes: nodes,
		});
	}

	// 6. Let previousSibling be child’s previous sibling or parent’s last child if child is null.
	const previousSibling = child === null ? parent.lastChild : child.previousSibling;

	// 7. For each node in nodes, in tree order:
	nodes.forEach((node) => {
		// 7.1. If child is null, then append node to parent’s children.
		// 7.2. Otherwise, insert node into parent’s children before child’s index.
		insertIntoChildren(node, parent, child);

		// 7.3. If parent is a shadow host and node is a slotable, then assign a slot for node.
		// (shadow dom not implemented)

		// 7.4. If node is a Text node, run the child text content change steps for parent.
		// (child text content change steps not implemented)

		// 7.5. If parent's root is a shadow root, and parent is a slot whose assigned nodes is the
		// empty list, then run signal a slot change for parent.
		// 7.6. Run assign slotables for a tree with node’s tree.
		// (shadow dom not implemented)

		// 7.7. For each shadow-including inclusive descendant inclusiveDescendant of node, in
		// shadow-including tree order:
		// 7.7.1. Run the insertion steps with inclusiveDescendant.
		// (insertion steps not implemented)

		// 7.7.2. If inclusiveDescendant is connected, then:
		// 7.7.2.1. If inclusiveDescendant is custom, then enqueue a custom element callback
		// reaction with inclusiveDescendant, callback name "connectedCallback", and an empty
		// argument list.
		// 7.7.2.2. Otherwise, try to upgrade inclusiveDescendant. If this successfully upgrades
		// inclusiveDescendant, its connectedCallback will be enqueued automatically during the
		// upgrade an element algorithm.
		// (custom elements not implemented)
	});

	// 8. If suppress observers flag is unset, queue a tree mutation record for parent with nodes,
	// « », previousSibling and child.
	if (!suppressObservers) {
		queueMutationRecord('childList', parent, {
			addedNodes: nodes,
			nextSibling: child,
			previousSibling: previousSibling,
		});
	}
}

/**
 * To append a node to a parent
 *
 * @param node   - Node to append
 * @param parent - Parent to append to
 *
 * @returns The appended node
 */
export function appendNode<TNode extends Node>(node: TNode, parent: Node): TNode {
	// pre-insert node into parent before null.
	return preInsertNode(node, parent, null);
}

/**
 * To replace a child with node within a parent, run these steps:
 *
 * @param child  - The child node to replace
 * @param node   - The node to replace child with
 * @param parent - The parent to replace under
 *
 * @returns The old child node
 */
export function replaceChildWithNode<TChild extends Node>(
	child: TChild,
	node: Node,
	parent: Node
): TChild {
	// 1. If parent is not a Document, DocumentFragment, or Element node, throw a
	// HierarchyRequestError.
	if (
		!isNodeOfType(
			parent,
			NodeType.DOCUMENT_NODE,
			NodeType.DOCUMENT_FRAGMENT_NODE,
			NodeType.ELEMENT_NODE
		)
	) {
		throwHierarchyRequestError('Can not replace under a non-parent node');
	}

	// 2. If node is a host-including inclusive ancestor of parent, throw a HierarchyRequestError.
	if (node.contains(parent)) {
		throwHierarchyRequestError('Can not insert a node under its own descendant');
	}

	// 3. If child’s parent is not parent, then throw a NotFoundError.
	if (child.parentNode !== parent) {
		throwNotFoundError('child is not a child of parent');
	}

	// 4. If node is not a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction, or
	// Comment node, throw a HierarchyRequestError.
	if (
		!isNodeOfType(
			node,
			NodeType.DOCUMENT_FRAGMENT_NODE,
			NodeType.DOCUMENT_TYPE_NODE,
			NodeType.ELEMENT_NODE,
			NodeType.TEXT_NODE,
			NodeType.CDATA_SECTION_NODE,
			NodeType.PROCESSING_INSTRUCTION_NODE,
			NodeType.COMMENT_NODE
		)
	) {
		throwHierarchyRequestError(
			"Can not insert a node that isn't a DocumentFragment, DocumentType, Element, Text, " +
				'ProcessingInstruction or Comment'
		);
	}

	// 5. If either node is a Text node and parent is a document, or node is a doctype and parent is
	// not a document, throw a HierarchyRequestError.
	if (isNodeOfType(node, NodeType.TEXT_NODE) && isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can not insert a Text node under a Document');
	}
	if (
		isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE) &&
		!isNodeOfType(parent, NodeType.DOCUMENT_NODE)
	) {
		throwHierarchyRequestError('can only insert a DocumentType node under a Document');
	}

	// 6. If parent is a document, and any of the statements below, switched on node, are true,
	// throw a HierarchyRequestError.
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		switch (node.nodeType) {
			// DocumentFragment node
			case NodeType.DOCUMENT_FRAGMENT_NODE:
				// If node has more than one element child or has a Text node child.
				const fragment = node as DocumentFragment;
				if (fragment.firstElementChild !== fragment.lastElementChild) {
					throwHierarchyRequestError(
						'can not insert more than one element under a Document'
					);
				}
				if (
					Array.from(fragment.childNodes).some((child) =>
						isNodeOfType(child, NodeType.TEXT_NODE)
					)
				) {
					throwHierarchyRequestError('can not insert a Text node under a Document');
				}
				// Otherwise, if node has one element child and either parent has an element child
				// that is not child or a doctype is following child.
				if (
					fragment.firstElementChild &&
					((parentDocument.documentElement &&
						parentDocument.documentElement !== (child as Node)) ||
						(child &&
							parentDocument.doctype &&
							getNodeIndex(child) < getNodeIndex(parentDocument.doctype)))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;

			// element
			case NodeType.ELEMENT_NODE:
				// parent has an element child that is not child or a doctype is following child.
				if (
					(parentDocument.documentElement &&
						parentDocument.documentElement !== (child as Node)) ||
					(parentDocument.doctype &&
						getNodeIndex(child) < getNodeIndex(parentDocument.doctype))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;

			// doctype
			case NodeType.DOCUMENT_TYPE_NODE:
				// parent has a doctype child that is not child, or an element is preceding child.
				if (
					(parentDocument.doctype && parentDocument.doctype !== (child as Node)) ||
					(parentDocument.documentElement &&
						getNodeIndex(parentDocument.documentElement) < getNodeIndex(child))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one ' +
							'element'
					);
				}
				break;
		}
		// The above statements differ from the pre-insert algorithm.
	}

	// 7. Let reference child be child’s next sibling.
	let referenceChild = child.nextSibling;

	// 8. If reference child is node, set it to node’s next sibling.
	if (referenceChild === node) {
		referenceChild = node.nextSibling;
	}

	// 9. Let previousSibling be child’s previous sibling.
	const previousSibling = child.previousSibling;

	// 10. Adopt node into parent’s node document.
	adoptNode(node, getNodeDocument(parent));

	// 11. Let removedNodes be the empty list.
	let removedNodes: Node[] = [];

	// 12. If child’s parent is not null, then:
	if (child.parentNode !== null) {
		// 12.1. Set removedNodes to a list solely containing child.
		removedNodes.push(child);

		// 12.2. Remove child from its parent with the suppress observers flag set.
		removeNode(child, child.parentNode, true);
	}
	// The above can only be false if child is node.

	// 13. Let nodes be node’s children if node is a DocumentFragment node, and a list containing
	// solely node otherwise.
	const nodes = isNodeOfType(node, NodeType.DOCUMENT_FRAGMENT_NODE)
		? Array.from(node.childNodes)
		: [node];

	// 14. Insert node into parent before reference child with the suppress observers flag set.
	insertNode(node, parent, referenceChild, true);

	// 15. Queue a tree mutation record for parent with nodes, removedNodes, previousSibling and
	// reference child.
	queueMutationRecord('childList', parent, {
		addedNodes: nodes,
		removedNodes: removedNodes,
		nextSibling: referenceChild,
		previousSibling: previousSibling,
	});

	// 16. Return child.
	return child;
}

/**
 * To replace all with a node within a parent, run these steps:
 *
 * @param node   New node to insert, or null to remove all nodes under parent
 * @param parent Parent to replace under
 */
function replaceAllWithNode(node: Node | null, parent: Node): void {
	// 1. If node is not null, adopt node into parent’s node document.
	if (node !== null) {
		adoptNode(node, getNodeDocument(parent));
	}

	// 2. Let removedNodes be parent’s children.
	const removedNodes = Array.from(parent.childNodes);

	// 3. Let addedNodes be the empty list if node is null, node’s children if node is a
	// DocumentFragment node, and a list containing node otherwise.
	let addedNodes: Node[];
	if (node === null) {
		addedNodes = [];
	} else {
		/* istanbul ignore if */
		if (isNodeOfType(node, NodeType.DOCUMENT_FRAGMENT_NODE)) {
			// This case is never actually reachable from any usage of "replace all" in the spec, as the
			// algorithm is currently only used with node being either null or a Text instance.
			addedNodes = Array.from(node.childNodes);
		} else {
			addedNodes = [];
		}
	}

	// 4. Remove all parent’s children, in tree order, with the suppress observers flag set.
	removedNodes.forEach((child) => {
		removeNode(child, parent, true);
	});

	// 5. If node is not null, then insert node into parent before null with the suppress observers
	// flag set.
	if (node !== null) {
		insertNode(node, parent, null, true);
	}

	// 6. Queue a tree mutation record for parent with addedNodes, removedNodes, null, and null.
	queueMutationRecord('childList', parent, {
		addedNodes,
		removedNodes,
	});

	// This algorithm does not make any checks with regards to the node tree constraints.
	// Specification authors need to use it wisely.
}

/**
 * To pre-remove a child from a parent, run these steps:
 *
 * @param child  - Child node to remove
 * @param parent - Parent under which to remove child
 *
 * @returns The removed child
 */
export function preRemoveChild<TChild extends Node>(child: TChild, parent: Node): TChild {
	// 1. If child’s parent is not parent, then throw a NotFoundError.
	if (child.parentNode !== parent) {
		throwNotFoundError('child is not a child of parent');
	}

	// 2. Remove child from parent.
	removeNode(child, parent);

	// 3. Return child.
	return child;
}

/**
 * To remove a node from a parent, with an optional suppress observers flag, run these steps:
 *
 * @param node              - Child to remove
 * @param parent            - Parent to remove child from
 * @param suppressObservers - Whether to skip enqueueing a mutation record for this mutation
 */
export function removeNode(node: Node, parent: Node, suppressObservers: boolean = false): void {
	// 1. Let index be node’s index.
	const index = getNodeIndex(node);

	const context = getContext(node);
	context.forEachRange((range) => {
		// 2. For each live range whose start node is an inclusive descendant of node, set its start
		// to (parent, index).
		if (node.contains(range.startContainer)) {
			range.startContainer = parent;
			range.startOffset = index;
		}

		// 3. For each live range whose end node is an inclusive descendant of node, set its end to
		// (parent, index).
		if (node.contains(range.endContainer)) {
			range.endContainer = parent;
			range.endOffset = index;
		}

		// 4. For each live range whose start node is parent and start offset is greater than index,
		// decrease its start offset by one.
		if (range.startContainer === parent && range.startOffset > index) {
			range.startOffset -= 1;
		}

		// 5. For each live range whose end node is parent and end offset is greater than index,
		// decrease its end offset by one.
		if (range.endContainer === parent && range.endOffset > index) {
			range.endOffset -= 1;
		}
	});

	// 6. For each NodeIterator object iterator whose root’s node document is node’s node document,
	// run the NodeIterator pre-removing steps given node and iterator.
	// (NodeIterator not implemented)

	// 7. Let oldPreviousSibling be node’s previous sibling.
	const oldPreviousSibling = node.previousSibling;

	// 8. Let oldNextSibling be node’s next sibling.
	const oldNextSibling = node.nextSibling;

	// 9. Remove node from its parent’s children.
	removeFromChildren(node, parent);

	// 10. If node is assigned, then run assign slotables for node’s assigned slot.
	// (shadow dom not implemented)

	// 11. If parent's root is a shadow root, and parent is a slot whose assigned nodes is the empty
	// list, then run signal a slot change for parent.
	// (shadow dom not implemented)

	// 12. If node has an inclusive descendant that is a slot, then:
	// 12.1. Run assign slotables for a tree with parent’s tree.
	// 12.2. Run assign slotables for a tree with node’s tree.
	// (shadow dom not implemented)

	// 13. Run the removing steps with node and parent.
	// (removing steps not implemented)

	// 14. If node is custom, then enqueue a custom element callback reaction with node, callback
	// name "disconnectedCallback", and an empty argument list.
	// It is intentional for now that custom elements do not get parent passed. This might change in
	// the future if there is a need.
	// (custom elements not implemented)

	// 15. For each shadow-including descendant descendant of node, in shadow-including tree order,
	// then:
	// 15.1. Run the removing steps with descendant.
	// (shadow dom not implemented)

	// 15.2. If descendant is custom, then enqueue a custom element callback reaction with
	// descendant, callback name "disconnectedCallback", and an empty argument list.
	// (custom elements not implemented)

	// 16. For each inclusive ancestor inclusiveAncestor of parent, and then for each registered of
	// inclusiveAncestor's registered observer list, if registered's options's subtree is true, then
	// append a new transient registered observer whose observer is registered's observer, options
	// is registered's options, and source is registered to node's registered observer list.
	for (
		let inclusiveAncestor: Node | null = parent;
		inclusiveAncestor;
		inclusiveAncestor = inclusiveAncestor.parentNode
	) {
		inclusiveAncestor._registeredObservers.appendTransientRegisteredObservers(node);
	}

	// 17. If suppress observers flag is unset, queue a tree mutation record for parent with « »,
	// « node », oldPreviousSibling, and oldNextSibling
	if (!suppressObservers) {
		queueMutationRecord('childList', parent, {
			removedNodes: [node],
			nextSibling: oldNextSibling,
			previousSibling: oldPreviousSibling,
		});
	}

	// 18. If node is a Text node, then run the child text content change steps for parent.
	// (child text content change steps not implemented)
}

/**
 * 3.5. Interface Document
 *
 * To adopt a node into a document, run these steps:
 *
 * @param node     - Node to adopt
 * @param document - Document to adopt node into
 */
export function adoptNode(node: Node, document: Document): void {
	// 1. Let oldDocument be node’s node document.
	const oldDocument = getNodeDocument(node);

	// 2. If node’s parent is not null, remove node from its parent.
	if (node.parentNode) {
		removeNode(node, node.parentNode);
	}

	// 3. If document is not oldDocument, then:
	if (document === oldDocument) {
		return;
	}

	// 3.1. For each inclusiveDescendant in node’s shadow-including inclusive descendants:
	forEachInclusiveDescendant(node, (node) => {
		// 3.1.1. Set inclusiveDescendant’s node document to document.
		// (calling code ensures that node is never a Document)
		node.ownerDocument = document;

		// 3.1.2. If inclusiveDescendant is an element, then set the node document of each attribute
		// in inclusiveDescendant’s attribute list to document.
		if (isNodeOfType(node, NodeType.ELEMENT_NODE)) {
			for (const attr of (node as Element).attributes) {
				attr.ownerDocument = document;
			}
		}
	});

	// 3.2. For each inclusiveDescendant in node’s shadow-including inclusive descendants that is
	// custom, enqueue a custom element callback reaction with inclusiveDescendant, callback name
	// "adoptedCallback", and an argument list containing oldDocument and document.
	// (custom element support has not been implemented)

	// 3.3. For each inclusiveDescendant in node’s shadow-including inclusive descendants, in
	// shadow-including tree order, run the adopting steps with inclusiveDescendant and oldDocument.
	// (adopting steps not implemented)
}

/**
 * Implementation of the textContent getter for DocumentFragment and Element.
 *
 * @param node Root node
 *
 * @returns  The concatenation of data of all the Text node descendants of the given node, in tree
 *           order
 */
export function getConcatenatedTextNodesData(node: Node): string {
	const data: string[] = [];
	forEachInclusiveDescendant(node, (descendant) => {
		// CDATASection is a subtype of Text
		if (!isNodeOfType(descendant, NodeType.TEXT_NODE, NodeType.CDATA_SECTION_NODE)) {
			return;
		}

		data.push((descendant as Text).data);
	});
	return data.join('');
}

/**
 * Implementation of the textContent setter for DocumentFragment and Element
 *
 * @param contextObject Node for which to set textContent
 * @param newValue      New textContent value
 */
export function setTextContentByReplacing(contextObject: Node, newValue: string): void {
	// 1. Let node be null.
	let node = null;

	// 2. If the given value is not the empty string, set node to a new Text node whose data is the
	// given value and node document is context object’s node document.
	if (newValue !== '') {
		const context = getContext(contextObject);
		node = new context.Text(newValue);
	}

	// 3. Replace all with node within the context object.
	replaceAllWithNode(node, contextObject);
}

/**
 * To convert nodes into a node, given nodes and document, run these steps:
 *
 * @param nodes    Nodes and/or strings to convert
 * @param document Document used to create new nodes
 *
 * @returns A single node representing nodes
 */
function convertNodesIntoNode(nodes: (Node | string)[], document: Document): Node {
	// 1. Let node be null.
	// (created as needed in branches below)

	// 2. Replace each string in nodes with a new Text node whose data is the string and node
	// document is document.
	const actualNodes: Node[] = nodes.map((nodeOrString) => {
		if (typeof nodeOrString === 'string') {
			return document.createTextNode(nodeOrString);
		}
		return nodeOrString;
	});

	// 3. If nodes contains one node, set node to that node.
	if (actualNodes.length === 1) {
		return actualNodes[0];
	} else {
		// 4. Otherwise, set node to a new DocumentFragment whose node document is document, and then
		// append each node in nodes, if any, to it.
		const node = document.createDocumentFragment();
		actualNodes.forEach((child) => {
			node.appendChild(child);
		});
		return node;
	}

	// 5. Return node.
	// (done in branches above)
}

/**
 * The prepend(nodes) method, when invoked, must run these steps:
 *
 * @param contextObject The ParentNode on which the method is invoked
 * @param nodes         The nodes (and/or strings) to prepend
 */
export function prependNodes(contextObject: Node & ParentNode, nodes: (Node | string)[]): void {
	// 1. Let node be the result of converting nodes into a node given nodes and context object’s
	// node document.
	const node = convertNodesIntoNode(nodes, getNodeDocument(contextObject));

	// 2. Pre-insert node into context object before the context object’s first child.
	preInsertNode(node, contextObject, contextObject.firstChild);
}

/**
 * The append(nodes) method, when invoked, must run these steps:
 *
 * @param contextObject The ParentNode on which the method is invoked
 * @param nodes         The nodes (and/or strings) to append
 */
export function appendNodes(contextObject: Node & ParentNode, nodes: (Node | string)[]): void {
	// 1. Let node be the result of converting nodes into a node given nodes and context object’s
	// node document.
	const node = convertNodesIntoNode(nodes, getNodeDocument(contextObject));

	// 2. Append node to context object
	appendNode(node, contextObject);
}

/**
 * The before(nodes) method, when invoked, must run these steps:
 *
 * @param contextObject The ChildNode on which the method is invoked
 * @param nodes         The nodes (and/or strings) to insert
 */
export function insertNodesBefore(contextObject: Node & ChildNode, nodes: (Node | string)[]): void {
	// 1. Let parent be context object’s parent.
	const parent = contextObject.parentNode;

	// 2. If parent is null, then return.
	if (parent === null) {
		return;
	}

	// 3. Let viablePreviousSibling be context object’s first preceding sibling not in nodes, and
	// null otherwise.
	let viablePreviousSibling = contextObject.previousSibling;
	while (viablePreviousSibling !== null && nodes.indexOf(viablePreviousSibling) >= 0) {
		viablePreviousSibling = viablePreviousSibling.previousSibling;
	}

	// 4. Let node be the result of converting nodes into a node, given nodes and context object’s
	// node document.
	const node = convertNodesIntoNode(nodes, getNodeDocument(contextObject));

	// 5. If viablePreviousSibling is null, set it to parent’s first child, and to
	// viablePreviousSibling’s next sibling otherwise.
	// (it makes more sense to rename this as it will no longer be a previous sibling to the
	// inserted nodes)
	const referenceNode =
		viablePreviousSibling === null ? parent.firstChild : viablePreviousSibling.nextSibling;

	// 6. Pre-insert node into parent before viablePreviousSibling.
	preInsertNode(node, parent, referenceNode);
}

/**
 * The after(nodes) method, when invoked, must run these steps:
 *
 * @param contextObject The ChildNode on which the method is invoked
 * @param nodes         The nodes (and/or strings) to insert
 */
export function insertNodesAfter(contextObject: Node & ChildNode, nodes: (Node | string)[]): void {
	// 1. Let parent be context object’s parent.
	const parent = contextObject.parentNode;

	// 2. If parent is null, then return.
	if (parent === null) {
		return;
	}

	// 3. Let viableNextSibling be context object’s first following sibling not in nodes, and null
	// otherwise.
	let viableNextSibling = contextObject.nextSibling;
	while (viableNextSibling !== null && nodes.indexOf(viableNextSibling) >= 0) {
		viableNextSibling = viableNextSibling.nextSibling;
	}

	// 4. Let node be the result of converting nodes into a node, given nodes and context object’s
	// node document.
	const node = convertNodesIntoNode(nodes, getNodeDocument(contextObject));

	// 5. Pre-insert node into parent before viableNextSibling.
	preInsertNode(node, parent, viableNextSibling);
}

/**
 * The replaceWith(nodes) method, when invoked, must run these steps:
 *
 * @param contextObject The ChildNode on which the method is invoked
 * @param nodes         The nodes (and/or strings) to insert
 */
export function replaceWithNodes(contextObject: Node & ChildNode, nodes: (Node | string)[]): void {
	// 1. Let parent be context object’s parent.
	const parent = contextObject.parentNode;

	// 2. If parent is null, then return.
	if (parent === null) {
		return;
	}

	// 3. Let viableNextSibling be context object’s first following sibling not in nodes, and null
	// otherwise.
	let viableNextSibling = contextObject.nextSibling;
	while (viableNextSibling !== null && nodes.indexOf(viableNextSibling) >= 0) {
		viableNextSibling = viableNextSibling.nextSibling;
	}

	// 4. Let node be the result of converting nodes into a node, given nodes and context object’s
	// node document.
	const node = convertNodesIntoNode(nodes, getNodeDocument(contextObject));

	// 5. If context object’s parent is parent, replace the context object with node within parent.
	// Note: Context object could have been inserted into node.
	if (contextObject.parentNode === parent) {
		replaceChildWithNode(contextObject, node, parent);
	} else {
		// 6. Otherwise, pre-insert node into parent before viableNextSibling.
		preInsertNode(node, parent, viableNextSibling);
	}
}

/**
 * The remove() method, when invoked, must run these steps:
 *
 * @param contextObject The ChildNode on which the method is invoked
 */
export function removeFromParent(contextObject: Node & ChildNode): void {
	// 1. If context object’s parent is null, then return.
	if (contextObject.parentNode === null) {
		return;
	}

	// 2. Remove the context object from context object’s parent.
	removeNode(contextObject, contextObject.parentNode);
}
