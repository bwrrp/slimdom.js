import { throwHierarchyRequestError, throwNotFoundError } from './errorHelpers';
import { NodeType, isNodeOfType } from './NodeType';
import { determineLengthOfNode, getNodeDocument, getNodeIndex, forEachInclusiveDescendant } from './treeHelpers';
import { insertIntoChildren, removeFromChildren } from './treeMutations';
import Document from '../Document';
import DocumentFragment from '../DocumentFragment';
import Element from '../Element';
import Node from '../Node';
import { ranges } from '../Range';
import queueMutationRecord from '../mutation-observer/queueMutationRecord';

// 3.2.3. Mutation algorithms

/**
 * To ensure pre-insertion validity of a node into a parent before a child, run these steps:
 */
function ensurePreInsertionValidity(node: Node, parent: Node, child: Node | null): void {
	// 1. If parent is not a Document, DocumentFragment, or Element node, throw a HierarchyRequestError.
	if (!isNodeOfType(parent, NodeType.DOCUMENT_NODE, NodeType.DOCUMENT_FRAGMENT_NODE, NodeType.ELEMENT_NODE)) {
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

	// 4. If node is not a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction, or Comment node, throw
	// a HierarchyRequestError.
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
			'node must be a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction or Comment node'
		);
	}

	// 5. If either node is a Text node and parent is a document, or node is a doctype and parent is not a document,
	// throw a HierarchyRequestError.
	if (isNodeOfType(node, NodeType.TEXT_NODE) && isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can not insert a Text node under a Document');
	}
	if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE) && !isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can only insert a DocumentType node under a Document');
	}

	// 6. If parent is a document, and any of the statements below, switched on node, are true, throw a
	// HierarchyRequestError.
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		switch (node.nodeType) {
			// DocumentFragment node
			case NodeType.DOCUMENT_FRAGMENT_NODE:
				// If node has more than one element child or has a Text node child.
				const fragment = node as DocumentFragment;
				if (fragment.firstElementChild !== fragment.lastElementChild) {
					throwHierarchyRequestError('can not insert more than one element under a Document');
				}
				if (Array.from(fragment.childNodes).some(child => isNodeOfType(child, NodeType.TEXT_NODE))) {
					throwHierarchyRequestError('can not insert a Text node under a Document');
				}
				// Otherwise, if node has one element child and either parent has an element child, child is a doctype,
				// or child is not null and a doctype is following child.
				if (
					fragment.firstElementChild &&
					(parentDocument.documentElement ||
						(child && isNodeOfType(child, NodeType.DOCUMENT_TYPE_NODE)) ||
						(child && parentDocument.doctype && getNodeIndex(child) < getNodeIndex(parentDocument.doctype)))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
					);
				}
				break;

			// element
			case NodeType.ELEMENT_NODE:
				// parent has an element child, child is a doctype, or child is not null and a doctype is following
				// child.
				if (
					parentDocument.documentElement ||
					(child && isNodeOfType(child, NodeType.DOCUMENT_TYPE_NODE)) ||
					(child && parentDocument.doctype && getNodeIndex(child) < getNodeIndex(parentDocument.doctype))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
					);
				}
				break;

			// doctype
			case NodeType.DOCUMENT_TYPE_NODE:
				// parent has a doctype child, child is non-null and an element is preceding child, or child is null and
				// parent has an element child.
				if (
					parentDocument.doctype ||
					(child &&
						parentDocument.documentElement &&
						getNodeIndex(parentDocument.documentElement) < getNodeIndex(child)) ||
					(!child && parentDocument.documentElement)
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
					);
				}
				break;
		}
	}
}

/**
 * To pre-insert a node into a parent before a child, run these steps:
 *
 * @param node   Node to pre-insert
 * @param parent Parent to insert under
 * @param child  Child to insert before, or null to insert at the end of parent
 *
 * @return The inserted node
 */
export function preInsertNode(node: Node, parent: Node, child: Node | null): Node {
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
 * To insert a node into a parent before a child, with an optional suppress observers flag, run these steps:
 *
 * @param node              Node to insert
 * @param parent            Parent to insert under
 * @param child             Child to insert before, or null to insert at end of parent
 * @param suppressObservers Whether to skip enqueueing a mutation record for this mutation
 */
export function insertNode(node: Node, parent: Node, child: Node | null, suppressObservers: boolean = false): void {
	// 1. Let count be the number of children of node if it is a DocumentFragment node, and one otherwise.
	const isDocumentFragment = isNodeOfType(node, NodeType.DOCUMENT_FRAGMENT_NODE);
	const count = isDocumentFragment ? determineLengthOfNode(node) : 1;

	// 2. If child is non-null, then:
	if (child !== null) {
		const childIndex = getNodeIndex(child);
		ranges.forEach(range => {
			// 2.1. For each range whose start node is parent and start offset is greater than child’s index, increase
			// its start offset by count.
			if (range.startContainer === parent && range.startOffset > childIndex) {
				range.startOffset += count;
			}

			// 2.2. For each range whose end node is parent and end offset is greater than child’s index, increase its
			// end offset by count.
			if (range.endContainer === parent && range.endOffset > childIndex) {
				range.endOffset += count;
			}
		});
	}

	// 3. Let nodes be node’s children if node is a DocumentFragment node, and a list containing solely node otherwise.
	const nodes = isDocumentFragment ? Array.from(node.childNodes) : [node];

	// 4. If node is a DocumentFragment node, remove its children with the suppress observers flag set.
	if (isDocumentFragment) {
		nodes.forEach(n => removeNode(n, node, true));
	}

	// 5. If node is a DocumentFragment node, queue a mutation record of "childList" for node with removedNodes nodes.
	// This step intentionally does not pay attention to the suppress observers flag.
	if (isDocumentFragment) {
		queueMutationRecord('childList', node, {
			removedNodes: nodes
		});
	}

	// 6. Let previousSibling be child’s previous sibling or parent’s last child if child is null.
	const previousSibling = child === null ? parent.lastChild : child.previousSibling;

	// 7. For each node in nodes, in tree order:
	nodes.forEach(node => {
		// 7.1. If child is null, then append node to parent’s children.
		// 7.2. Otherwise, insert node into parent’s children before child’s index.
		insertIntoChildren(node, parent, child);

		// 7.3. If parent is a shadow host and node is a slotable, then assign a slot for node.
		// (shadow dom not implemented)

		// 7.4. If node is a Text node, run the child text content change steps for parent.
		// (child text content change steps not implemented)

		// 7.5. If parent's root is a shadow root, and parent is a slot whose assigned nodes is the empty list, then run
		// signal a slot change for parent.
		// 7.6. Run assign slotables for a tree with node’s tree.
		// (shadow dom not implemented)

		// 7.7. For each shadow-including inclusive descendant inclusiveDescendant of node, in shadow-including tree
		// order:
		// 7.7.1. Run the insertion steps with inclusiveDescendant.
		// (insertion steps not implemented)

		// 7.7.2. If inclusiveDescendant is connected, then:
		// 7.7.2.1. If inclusiveDescendant is custom, then enqueue a custom element callback reaction with
		// inclusiveDescendant, callback name "connectedCallback", and an empty argument list.
		// 7.7.2.2. Otherwise, try to upgrade inclusiveDescendant.
		// If this successfully upgrades inclusiveDescendant, its connectedCallback will be enqueued automatically
		// during the upgrade an element algorithm.
		// (custom elements not implemented)
	});

	// 8. If suppress observers flag is unset, queue a mutation record of "childList" for parent with addedNodes nodes,
	// nextSibling child, and previousSibling previousSibling.
	if (!suppressObservers) {
		queueMutationRecord('childList', parent, {
			addedNodes: nodes,
			nextSibling: child,
			previousSibling: previousSibling
		});
	}
}

/**
 * To append a node to a parent
 *
 * @param node   Node to append
 * @param parent Parent to append to
 *
 * @return The appended node
 */
export function appendNode(node: Node, parent: Node): Node {
	// pre-insert node into parent before null.
	return preInsertNode(node, parent, null);
}

/**
 * To replace a child with node within a parent, run these steps:
 *
 * @param child  The child node to replace
 * @param node   The node to replace child with
 * @param parent The parent to replace under
 *
 * @return The old child node
 */
export function replaceChildWithNode(child: Node, node: Node, parent: Node): Node {
	// 1. If parent is not a Document, DocumentFragment, or Element node, throw a HierarchyRequestError.
	if (!isNodeOfType(parent, NodeType.DOCUMENT_NODE, NodeType.DOCUMENT_FRAGMENT_NODE, NodeType.ELEMENT_NODE)) {
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

	// 4. If node is not a DocumentFragment, DocumentType, Element, Text, ProcessingInstruction, or Comment node, throw
	// a HierarchyRequestError.
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

	// 5. If either node is a Text node and parent is a document, or node is a doctype and parent is not a document,
	// throw a HierarchyRequestError.
	if (isNodeOfType(node, NodeType.TEXT_NODE) && isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can not insert a Text node under a Document');
	}
	if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE) && !isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		throwHierarchyRequestError('can only insert a DocumentType node under a Document');
	}

	// 6. If parent is a document, and any of the statements below, switched on node, are true, throw a
	// HierarchyRequestError.
	if (isNodeOfType(parent, NodeType.DOCUMENT_NODE)) {
		const parentDocument = parent as Document;
		switch (node.nodeType) {
			// DocumentFragment node
			case NodeType.DOCUMENT_FRAGMENT_NODE:
				// If node has more than one element child or has a Text node child.
				const fragment = node as DocumentFragment;
				if (fragment.firstElementChild !== fragment.lastElementChild) {
					throwHierarchyRequestError('can not insert more than one element under a Document');
				}
				if (Array.from(fragment.childNodes).some(child => isNodeOfType(child, NodeType.TEXT_NODE))) {
					throwHierarchyRequestError('can not insert a Text node under a Document');
				}
				// Otherwise, if node has one element child and either parent has an element child that is not child or
				// a doctype is following child.
				if (
					fragment.firstElementChild &&
					((parentDocument.documentElement && parentDocument.documentElement !== child) ||
						(child && parentDocument.doctype && getNodeIndex(child) < getNodeIndex(parentDocument.doctype)))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
					);
				}
				break;

			// element
			case NodeType.ELEMENT_NODE:
				// parent has an element child that is not child or a doctype is following child.
				if (
					(parentDocument.documentElement && parentDocument.documentElement !== child) ||
					(parentDocument.doctype && getNodeIndex(child) < getNodeIndex(parentDocument.doctype))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
					);
				}
				break;

			// doctype
			case NodeType.DOCUMENT_TYPE_NODE:
				// parent has a doctype child that is not child, or an element is preceding child.
				if (
					(parentDocument.doctype && parentDocument.doctype !== child) ||
					(parentDocument.documentElement &&
						getNodeIndex(parentDocument.documentElement) < getNodeIndex(child))
				) {
					throwHierarchyRequestError(
						'Document should contain at most one doctype, followed by at most one element'
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

	// 13. Let nodes be node’s children if node is a DocumentFragment node, and a list containing solely node otherwise.
	const nodes = isNodeOfType(node, NodeType.DOCUMENT_FRAGMENT_NODE) ? Array.from(node.childNodes) : [node];

	// 14. Insert node into parent before reference child with the suppress observers flag set.
	insertNode(node, parent, referenceChild, true);

	// 15. Queue a mutation record of "childList" for target parent with addedNodes nodes, removedNodes removedNodes,
	// nextSibling reference child, and previousSibling previousSibling.
	queueMutationRecord('childList', parent, {
		addedNodes: nodes,
		removedNodes: removedNodes,
		nextSibling: referenceChild,
		previousSibling: previousSibling
	});

	// 16. Return child.
	return child;
}

/**
 * To pre-remove a child from a parent, run these steps:
 *
 * @param child  Child node to remove
 * @param parent Parent under which to remove child
 *
 * @return The removed child
 */
export function preRemoveChild(child: Node, parent: Node): Node {
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
 * @param node              Child to remove
 * @param parent            Parent to remove child from
 * @param suppressObservers Whether to skip enqueueing a mutation record for this mutation
 */
export function removeNode(node: Node, parent: Node, suppressObservers: boolean = false): void {
	// 1. Let index be node’s index.
	const index = getNodeIndex(node);

	ranges.forEach(range => {
		// 2. For each range whose start node is an inclusive descendant of node, set its start to (parent, index).
		if (node.contains(range.startContainer)) {
			range.startContainer = parent;
			range.startOffset = index;
		}

		// 3. For each range whose end node is an inclusive descendant of node, set its end to (parent, index).
		if (node.contains(range.endContainer)) {
			range.endContainer = parent;
			range.endOffset = index;
		}

		// 4. For each range whose start node is parent and start offset is greater than index, decrease its start
		// offset by one.
		if (range.startContainer === parent && range.startOffset > index) {
			range.startOffset -= 1;
		}

		// 5. For each range whose end node is parent and end offset is greater than index, decrease its end offset by
		// one.
		if (range.endContainer === parent && range.endOffset > index) {
			range.endOffset -= 1;
		}
	});

	// 6. For each NodeIterator object iterator whose root’s node document is node’s node document, run the NodeIterator
	// pre-removing steps given node and iterator.
	// (NodeIterator not implemented)

	// 7. Let oldPreviousSibling be node’s previous sibling.
	const oldPreviousSibling = node.previousSibling;

	// 8. Let oldNextSibling be node’s next sibling.
	const oldNextSibling = node.nextSibling;

	// 9. Remove node from its parent’s children.
	removeFromChildren(node, parent);

	// 10. If node is assigned, then run assign slotables for node’s assigned slot.
	// (shadow dom not implemented)

	// 11. If parent's root is a shadow root, and parent is a slot whose assigned nodes is the empty list, then run
	// signal a slot change for parent.
	// (shadow dom not implemented)

	// 12. If node has an inclusive descendant that is a slot, then:
	// 12.1. Run assign slotables for a tree with parent’s tree.
	// 12.2. Run assign slotables for a tree with node’s tree.
	// (shadow dom not implemented)

	// 13. Run the removing steps with node and parent.
	// (removing steps not implemented)

	// 14. If node is custom, then enqueue a custom element callback reaction with node, callback name
	// "disconnectedCallback", and an empty argument list.
	// It is intentional for now that custom elements do not get parent passed. This might change in the future if there
	// is a need.
	// (custom elements not implemented)

	// 15. For each shadow-including descendant descendant of node, in shadow-including tree order, then:
	// 15.1. Run the removing steps with descendant.
	// (shadow dom not implemented)

	// 15.2. If descendant is custom, then enqueue a custom element callback reaction with descendant, callback name
	// "disconnectedCallback", and an empty argument list.
	// (custom elements not implemented)

	// 16. For each inclusive ancestor inclusiveAncestor of parent, if inclusiveAncestor has any registered observers
	// whose options' subtree is true, then for each such registered observer registered, append a transient registered
	// observer whose observer and options are identical to those of registered and source which is registered to node’s
	// list of registered observers.
	for (
		let inclusiveAncestor: Node | null = parent;
		inclusiveAncestor;
		inclusiveAncestor = inclusiveAncestor.parentNode
	) {
		inclusiveAncestor._registeredObservers.appendTransientRegisteredObservers(node);
	}

	// 17. If suppress observers flag is unset, queue a mutation record of "childList" for parent with removedNodes a
	// list solely containing node, nextSibling oldNextSibling, and previousSibling oldPreviousSibling.
	if (!suppressObservers) {
		queueMutationRecord('childList', parent, {
			removedNodes: [node],
			nextSibling: oldNextSibling,
			previousSibling: oldPreviousSibling
		});
	}

	// 18. If node is a Text node, run the child text content change steps for parent.
	// (child text content change steps not implemented)
}

/**
 * 3.5. Interface Document
 *
 * To adopt a node into a document, run these steps:
 *
 * @param node     Node to adopt
 * @param document Document to adopt node into
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
	forEachInclusiveDescendant(node, node => {
		// 3.1.1. Set inclusiveDescendant’s node document to document.
		// (calling code ensures that node is never a Document)
		node.ownerDocument = document;

		// 3.1.2. If inclusiveDescendant is an element, then set the node document of each attribute in
		// inclusiveDescendant’s attribute list to document.
		if (isNodeOfType(node, NodeType.ELEMENT_NODE)) {
			for (const attr of (node as Element).attributes) {
				attr.ownerDocument = document;
			}
		}
	});

	// 3.2. For each inclusiveDescendant in node’s shadow-including inclusive descendants that is custom, enqueue a
	// custom element callback reaction with inclusiveDescendant, callback name "adoptedCallback", and an argument list
	// containing oldDocument and document.
	// (custom element support has not been implemented)

	// 3.3. For each inclusiveDescendant in node’s shadow-including inclusive descendants, in shadow-including tree
	// order, run the adopting steps with inclusiveDescendant and oldDocument.
	// (adopting steps not implemented)
}
