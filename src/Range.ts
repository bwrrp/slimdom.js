import Document from './Document';
import Node from './Node';
import { getContext } from './context/Context';
import {
	expectArity,
	throwIndexSizeError,
	throwInvalidNodeTypeError,
	throwNotSupportedError,
	throwWrongDocumentError
} from './util/errorHelpers';
import { NodeType, isNodeOfType } from './util/NodeType';
import {
	determineLengthOfNode,
	getInclusiveAncestors,
	getNodeDocument,
	getNodeIndex,
	getRootOfNode
} from './util/treeHelpers';
import { asObject, asUnsignedLong } from './util/typeHelpers';

export const ranges: Range[] = [];

/**
 * 4.2. Interface Range
 */
export default class Range {
	public startContainer: Node;
	public startOffset: number;
	public endContainer: Node;
	public endOffset: number;

	public get collapsed(): boolean {
		return this.startContainer === this.endContainer && this.startOffset === this.endOffset;
	}

	/**
	 * Get the common ancestor of the range's boundary position nodes.
	 *
	 * Note: for efficiency reasons, this implementation deviates from the algorithm given in 4.2.
	 */
	public get commonAncestorContainer(): Node {
		const ancestors1 = getInclusiveAncestors(this.startContainer);
		const ancestors2 = getInclusiveAncestors(this.endContainer);
		let commonAncestorContainer = ancestors1[0];
		let i = 0;
		while (i < ancestors1.length && i < ancestors2.length) {
			if (ancestors1[i] !== ancestors2[i]) {
				break;
			}

			commonAncestorContainer = ancestors1[i];
			++i;
		}

		return commonAncestorContainer;
	}

	/**
	 * The Range() constructor, when invoked, must return a new range with (current global object’s associated Document,
	 * 0) as its start and end.
	 */
	constructor() {
		const context = getContext(this);
		this.startContainer = context.document;
		this.startOffset = 0;
		this.endContainer = context.document;
		this.endOffset = 0;
		ranges.push(this);
	}

	/**
	 * Sets the start boundary point of the range.
	 *
	 * @param node   The new start container
	 * @param offset The new start offset
	 */
	setStart(node: Node, offset: number): void {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		offset = asUnsignedLong(offset);

		// 1. If node is a doctype, then throw an InvalidNodeTypeError.
		if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			throwInvalidNodeTypeError('Can not set a range under a doctype node');
		}

		// 2. If offset is greater than node’s length, then throw an IndexSizeError.
		if (offset > determineLengthOfNode(node)) {
			throwIndexSizeError('Can not set a range past the end of the node');
		}

		// 3. Let bp be the boundary point (node, offset).
		// 4.a. If these steps were invoked as "set the start"
		// 4.a.1. If bp is after the range’s end, or if range’s root is not equal to node’s root, set range’s end to bp.
		const rootOfNode = getRootOfNode(node);
		const rootOfRange = getRootOfRange(this);
		if (
			rootOfNode !== rootOfRange ||
			compareBoundaryPointPositions(node, offset, this.endContainer, this.endOffset) === POSITION_AFTER
		) {
			this.endContainer = node;
			this.endOffset = offset;
		}
		// 4.a.2. Set range’s start to bp.
		this.startContainer = node;
		this.startOffset = offset;

		// 4.b. If these steps were invoked as "set the end"
		// 4.b.1. If bp is before the range’s start, or if range’s root is not equal to node’s root, set range’s start
		// to bp.
		// 4.b.2. Set range’s end to bp.
		// (see Range#setEnd for this branch)
	}

	/**
	 * Sets the end boundary point of the range.
	 *
	 * @param node   The new end container
	 * @param offset The new end offset
	 */
	setEnd(node: Node, offset: number): void {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		offset = asUnsignedLong(offset);

		// 1. If node is a doctype, then throw an InvalidNodeTypeError.
		if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			throwInvalidNodeTypeError('Can not set a range under a doctype node');
		}

		// 2. If offset is greater than node’s length, then throw an IndexSizeError.
		if (offset > determineLengthOfNode(node)) {
			throwIndexSizeError('Can not set a range past the end of the node');
		}

		// 3. Let bp be the boundary point (node, offset).
		// 4.a. If these steps were invoked as "set the start"
		// 4.a.1. If bp is after the range’s end, or if range’s root is not equal to node’s root, set range’s end to bp.
		// 4.a.2. Set range’s start to bp.
		// (see Range#setStart for this branch)

		// 4.b. If these steps were invoked as "set the end"
		// 4.b.1. If bp is before the range’s start, or if range’s root is not equal to node’s root, set range’s start
		// to bp.
		const rootOfNode = getRootOfNode(node);
		const rootOfRange = getRootOfRange(this);
		if (
			rootOfNode !== rootOfRange ||
			compareBoundaryPointPositions(node, offset, this.endContainer, this.endOffset) === POSITION_BEFORE
		) {
			this.startContainer = node;
			this.startOffset = offset;
		}
		// 4.b.2. Set range’s end to bp.
		this.endContainer = node;
		this.endOffset = offset;
	}

	/**
	 * Sets the start boundary point of the range to the position just before the given node.
	 *
	 * @param node The node to set the range's start before
	 */
	setStartBefore(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. Let parent be node’s parent.
		const parent = node.parentNode;

		// 2. If parent is null, then throw an InvalidNodeTypeError.
		if (parent === null) {
			return throwInvalidNodeTypeError('Can not set range before node without a parent');
		}

		// 3. Set the start of the context object to boundary point (parent, node’s index).
		this.setStart(parent, getNodeIndex(node));
	}

	/**
	 * Sets the start boundary point of the range to the position just after the given node.
	 *
	 * @param node The node to set the range's start before
	 */
	setStartAfter(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. Let parent be node’s parent.
		const parent = node.parentNode;

		// 2. If parent is null, then throw an InvalidNodeTypeError.
		if (parent === null) {
			return throwInvalidNodeTypeError('Can not set range before node without a parent');
		}

		// 3. Set the start of the context object to boundary point (parent, node’s index plus one).
		this.setStart(parent, getNodeIndex(node) + 1);
	}

	/**
	 * Sets the end boundary point of the range to the position just before the given node.
	 *
	 * @param node The node to set the range's end before
	 */
	setEndBefore(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. Let parent be node’s parent.
		const parent = node.parentNode;

		// 2. If parent is null, then throw an InvalidNodeTypeError.
		if (parent === null) {
			return throwInvalidNodeTypeError('Can not set range before node without a parent');
		}

		// 3. Set the end of the context object to boundary point (parent, node’s index).
		this.setEnd(parent, getNodeIndex(node));
	}

	/**
	 * Sets the end boundary point of the range to the position just after the given node.
	 *
	 * @param node The node to set the range's end before
	 */
	setEndAfter(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. Let parent be node’s parent.
		const parent = node.parentNode;

		// 2. If parent is null, then throw an InvalidNodeTypeError.
		if (parent === null) {
			return throwInvalidNodeTypeError('Can not set range before node without a parent');
		}

		// 3. Set the end of the context object to boundary point (parent, node’s index plus one).
		this.setEnd(parent, getNodeIndex(node) + 1);
	}

	/**
	 * Sets the range's boundary points to the same position.
	 *
	 * @param toStart If true, set both points to the start of the range, otherwise set them to the end
	 */
	collapse(toStart: boolean = false): void {
		if (toStart) {
			this.endContainer = this.startContainer;
			this.endOffset = this.startOffset;
		} else {
			this.startContainer = this.endContainer;
			this.startOffset = this.endOffset;
		}
	}

	selectNode(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. Let parent be node’s parent.
		let parent = node.parentNode;

		// 2. If parent is null, throw an InvalidNodeTypeError.
		if (parent === null) {
			return throwInvalidNodeTypeError('Can not select node with null parent');
		}

		// 3. Let index be node’s index.
		const index = getNodeIndex(node);

		// 4. Set range’s start to boundary point (parent, index).
		this.startContainer = parent;
		this.startOffset = index;

		// 5. Set range’s end to boundary point (parent, index plus one).
		this.endContainer = parent;
		this.endOffset = index + 1;
	}

	selectNodeContents(node: Node): void {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. If node is a doctype, throw an InvalidNodeTypeError.
		if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			throwInvalidNodeTypeError('Can not place range inside a doctype node');
		}

		// 2. Let length be the length of node.
		const length = determineLengthOfNode(node);

		// 3. Set start to the boundary point (node, 0).
		this.startContainer = node;
		this.startOffset = 0;

		// 4. Set end to the boundary point (node, length).
		this.endContainer = node;
		this.endOffset = length;
	}

	static START_TO_START = 0;
	static START_TO_END = 1;
	static END_TO_END = 2;
	static END_TO_START = 3;

	compareBoundaryPoints(how: number, sourceRange: Range): number {
		expectArity(arguments, 2);
		sourceRange = asObject(sourceRange, Range);

		// 1. If how is not one of START_TO_START, START_TO_END, END_TO_END, and END_TO_START, then throw a
		// NotSupportedError.
		if (
			how !== Range.START_TO_START &&
			how !== Range.START_TO_END &&
			how !== Range.END_TO_END &&
			how !== Range.END_TO_START
		) {
			throwNotSupportedError('Unsupported comparison type');
		}

		// 2. If context object’s root is not the same as sourceRange’s root, then throw a WrongDocumentError.
		if (getRootOfRange(this) !== getRootOfRange(sourceRange)) {
			throwWrongDocumentError('Can not compare positions of ranges in different trees');
		}

		// 3. If how is:
		switch (how) {
			// START_TO_START:
			case Range.START_TO_START:
				// Let this point be the context object’s start. Let other point be sourceRange’s start.
				return compareBoundaryPointPositions(
					// this point
					this.startContainer,
					this.startOffset,
					// other point
					sourceRange.startContainer,
					sourceRange.startOffset
				);

			// START_TO_END:
			case Range.START_TO_END:
				// Let this point be the context object’s end. Let other point be sourceRange’s start.
				return compareBoundaryPointPositions(
					// this point
					this.endContainer,
					this.endOffset,
					// other point
					sourceRange.startContainer,
					sourceRange.startOffset
				);

			// END_TO_END:
			case Range.END_TO_END:
				// Let this point be the context object’s end. Let other point be sourceRange’s end.
				return compareBoundaryPointPositions(
					// this point
					this.endContainer,
					this.endOffset,
					// other point
					sourceRange.endContainer,
					sourceRange.endOffset
				);

			// END_TO_START:
			default:
				// Let this point be the context object’s start. Let other point be sourceRange’s end.
				return compareBoundaryPointPositions(
					// this point
					this.startContainer,
					this.startOffset,
					// other point,
					sourceRange.endContainer,
					sourceRange.endOffset
				);
		}

		// 4. If the position of this point relative to other point is
		// before: Return −1.
		// equal: Return 0.
		// after: Return 1.
		// (handled in switch above)
	}

	/**
	 * Returns a range with the same start and end as the context object.
	 *
	 * @return A copy of the context object
	 */
	cloneRange(): Range {
		const context = getContext(this);
		const range = new context.Range();
		range.startContainer = this.startContainer;
		range.startOffset = this.startOffset;
		range.endContainer = this.endContainer;
		range.endOffset = this.endOffset;
		return range;
	}

	/**
	 * Stops tracking the range.
	 *
	 * (non-standard) According to the spec, this method must do nothing. However, as it is not possible to rely on
	 * garbage collection to determine when to stop updating a range for node mutations, this implementation requires
	 * calling detach to stop such updates from affecting the range.
	 */
	detach(): void {
		const index = ranges.indexOf(this);
		if (index >= 0) {
			ranges.splice(index, 1);
		}
	}

	/**
	 * Returns true if the given point is after or equal to the start point and before or equal to the end point of the
	 * context object.
	 *
	 * @param node   Node of point to check
	 * @param offset Offset of point to check
	 *
	 * @return Whether the point is in the range
	 */
	isPointInRange(node: Node, offset: number): boolean {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		offset = asUnsignedLong(offset);

		// 1. If node’s root is different from the context object’s root, return false.
		if (getRootOfNode(node) !== getRootOfRange(this)) {
			return false;
		}

		// 2. If node is a doctype, then throw an InvalidNodeTypeError.
		if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			throwInvalidNodeTypeError('Point can not be under a doctype');
		}

		// 3. If offset is greater than node’s length, then throw an IndexSizeError.
		if (offset > determineLengthOfNode(node)) {
			throwIndexSizeError('Offset should not be past the end of node');
		}

		// 4. If (node, offset) is before start or after end, return false.
		if (
			compareBoundaryPointPositions(node, offset, this.startContainer, this.startOffset) === POSITION_BEFORE ||
			compareBoundaryPointPositions(node, offset, this.endContainer, this.endOffset) === POSITION_AFTER
		) {
			return false;
		}

		// 5. Return true.
		return true;
	}

	/**
	 * Compares the given point to the range's boundary points.
	 *
	 * @param node   Node of point to check
	 * @param offset Offset of point to check
	 *
	 * @return -1, 0 or 1 depending on whether the point is before, inside or after the range, respectively
	 */
	comparePoint(node: Node, offset: number): number {
		expectArity(arguments, 2);
		node = asObject(node, Node);
		offset = asUnsignedLong(offset);

		// 1. If node’s root is different from the context object’s root, then throw a WrongDocumentError.
		if (getRootOfNode(node) !== getRootOfRange(this)) {
			throwWrongDocumentError('Can not compare point to range in different trees');
		}

		// 2. If node is a doctype, then throw an InvalidNodeTypeError.
		if (isNodeOfType(node, NodeType.DOCUMENT_TYPE_NODE)) {
			throwInvalidNodeTypeError('Point can not be under a doctype');
		}

		// 3. If offset is greater than node’s length, then throw an IndexSizeError.
		if (offset > determineLengthOfNode(node)) {
			throwIndexSizeError('Offset should not be past the end of node');
		}

		// 4. If (node, offset) is before start, return −1.
		if (compareBoundaryPointPositions(node, offset, this.startContainer, this.startOffset) === POSITION_BEFORE) {
			return -1;
		}

		// 5. If (node, offset) is after end, return 1.
		if (compareBoundaryPointPositions(node, offset, this.endContainer, this.endOffset) === POSITION_AFTER) {
			return 1;
		}

		// 6. Return 0.
		return 0;
	}

	/**
	 * Returns true if range overlaps the range from before node to after node.
	 *
	 * @param node The node to check
	 *
	 * @return Whether the range intersects node
	 */
	intersectsNode(node: Node): boolean {
		expectArity(arguments, 1);
		node = asObject(node, Node);

		// 1. If node’s root is different from the context object’s root, return false.
		if (getRootOfNode(node) !== getRootOfRange(this)) {
			return false;
		}

		// 2. Let parent be node’s parent.
		const parent = node.parentNode;

		// 3. If parent is null, return true.
		if (parent === null) {
			return true;
		}

		// 4. Let offset be node’s index.
		const offset = getNodeIndex(node);

		// 5. If (parent, offset) is before end and (parent, offset + 1) is after start, return true.
		// 6. Return false.
		return (
			compareBoundaryPointPositions(parent, offset, this.endContainer, this.endOffset) === POSITION_BEFORE &&
			compareBoundaryPointPositions(parent, offset + 1, this.startContainer, this.startOffset) === POSITION_AFTER
		);
	}
}

const POSITION_BEFORE = -1;
const POSITION_EQUAL = 0;
const POSITION_AFTER = 1;

/**
 * If the two nodes of boundary points (node A, offset A) and (node B, offset B) have the same root, the position of the
 * first relative to the second is either before, equal, or after.
 *
 * Note: for efficiency reasons, this implementation deviates from the algorithm given in 4.2.
 *
 * This implementation assumes it is called on nodes under the same root.
 *
 * @param nodeA   First boundary point's node
 * @param offsetA First boundary point's offset
 * @param nodeB   Second boundary point's node
 * @param offsetB Second boundary point's offset
 *
 * @return -1, 0 or 1, depending on the boundary points' relative positions
 */
function compareBoundaryPointPositions(nodeA: Node, offsetA: number, nodeB: Node, offsetB: number): number {
	if (nodeA !== nodeB) {
		const ancestors1 = getInclusiveAncestors(nodeA);
		const ancestors2 = getInclusiveAncestors(nodeB);

		// Skip common parents
		while (ancestors1[0] && ancestors2[0] && ancestors1[0] === ancestors2[0]) {
			ancestors1.shift();
			ancestors2.shift();
		}

		// Compute offsets at the level under the last common parent. Add 0.5 to bias positions inside the parent vs.
		// those before or after.
		if (ancestors1.length) {
			offsetA = getNodeIndex(ancestors1[0]) + 0.5;
		}
		if (ancestors2.length) {
			offsetB = getNodeIndex(ancestors2[0]) + 0.5;
		}
	}

	// Compare positions at this level
	if (offsetA === offsetB) {
		return POSITION_EQUAL;
	}
	return offsetA < offsetB ? POSITION_BEFORE : POSITION_AFTER;
}

/**
 * The root of a range is the root of its start node.
 *
 * @param range The range to get the root of
 *
 * @return The root of range
 */
function getRootOfRange(range: Range): Node {
	return getRootOfNode(range.startContainer);
}
