import Document from '../Document';
import Node from '../Node';
import { commonAncestor, comparePoints, getNodeIndex } from '../util';

export default class Range {
	/**
	 * The node at which this range starts.
	 */
	public startContainer: Node | null;

	/**
	 * The offset in the startContainer at which this range starts.
	 */
	public startOffset: number;

	/**
	 * The node at which this range ends.
	 */
	public endContainer: Node | null;

	/**
	 * The offset in the endContainer at which this range ends.
	 */
	public endOffset: number;

	/**
	 * A range is collapsed if its start and end positions are identical.
	 */
	public collapsed: boolean;

	/**
	 * The closest node that is a parent of both start and end positions.
	 */
	public commonAncestorContainer: Node | null;

	/**
	 * A detached range should no longer be used.
	 */
	private _isDetached: boolean;

	/**
	 * Do not use directly! Use Document#createRange to create an instance.
	 *
	 * @param document Document in which to create the Range
	 */
	constructor (document: Document) {
		this.startContainer = document;
		this.startOffset = 0;
		this.endContainer = document;
		this.endOffset = 0;

		this.collapsed = true;
		this.commonAncestorContainer = document;

		this._isDetached = false;

		// Start tracking the range
		document._ranges.push(this);
	}

	static START_TO_START = 0;
	static START_TO_END = 1;
	static END_TO_END = 2;
	static END_TO_START = 3;

	/**
	 * Disposes the range and removes it from it's document.
	 */
	public detach () {
		// Stop tracking the range
		const startContainer = this.startContainer as Node;
		const document = startContainer instanceof Document ? startContainer : startContainer.ownerDocument as Document;
		const rangeIndex = document._ranges.indexOf(this);
		document._ranges.splice(rangeIndex, 1);

		// Clear properties
		this.startContainer = null;
		this.startOffset = 0;
		this.endContainer = null;
		this.endOffset = 0;
		this.collapsed = true;
		this.commonAncestorContainer = null;
		this._isDetached = true;
	}

	/**
	 * Helper used to update the range when start and/or end has changed
	 */
	private _pointsChanged () {
		this.commonAncestorContainer = commonAncestor(this.startContainer as Node, this.endContainer as Node);
		this.collapsed = (this.startContainer == this.endContainer && this.startOffset == this.endOffset);
	}

	/**
	 * Sets the start position of a range to a given node and a given offset inside that node.
	 *
	 * @param node   Container for the position
	 * @param offset Index of the child or character before which to place the position
	 */
	public setStart (node: Node, offset: number) {
		this.startContainer = node;
		this.startOffset = offset;

		// If start is after end, move end to start
		if (comparePoints(this.startContainer as Node, this.startOffset, this.endContainer as Node, this.endOffset) as number > 0) {
			this.setEnd(node, offset);
		}

		this._pointsChanged();
	}

	/**
	 * Sets the end position of a range to a given node and a given offset inside that node.
	 *
	 * @param node   Container for the position
	 * @param offset Index of the child or character before which to place the position
	 */
	public setEnd (node: Node, offset: number) {
		this.endContainer = node;
		this.endOffset = offset;

		// If end is before start, move start to end
		if (comparePoints(this.startContainer as Node, this.startOffset, this.endContainer as Node, this.endOffset) as number > 0) {
			this.setStart(node, offset);
		}

		this._pointsChanged();
	}

	/**
	 * Sets the start position of this Range relative to another Node.
	 *
	 * @param referenceNode Node before which to place the position
	 */
	public setStartBefore (referenceNode: Node) {
		this.setStart(referenceNode.parentNode as Node, getNodeIndex(referenceNode));
	}

	/**
	 * Sets the start position of this Range relative to another Node.
	 *
	 * @param referenceNode Node after which to place the position
	 */
	public setStartAfter (referenceNode: Node) {
		this.setStart(referenceNode.parentNode as Node, getNodeIndex(referenceNode) + 1);
	}

	/**
	 * Sets the end position of this Range relative to another Node.
	 *
	 * @param referenceNode Node before which to place the position
	 */
	public setEndBefore (referenceNode: Node) {
		this.setEnd(referenceNode.parentNode as Node, getNodeIndex(referenceNode));
	}

	/**
	 * Sets the end position of this Range relative to another Node.
	 *
	 * @param referenceNode Node after which to place the position
	 */
	public setEndAfter (referenceNode: Node) {
		this.setEnd(referenceNode.parentNode as Node, getNodeIndex(referenceNode) + 1);
	}

	/**
	 * Sets the Range to contain the Node and its contents.
	 *
	 * @param referenceNode Node to place the range around
	 */
	public selectNode (referenceNode: Node) {
		this.setStartBefore(referenceNode);
		this.setEndAfter(referenceNode);
	}

	/**
	 * Sets the Range to contain the contents of a Node.
	 *
	 * @param referenceNode Node to place the range within
	 */
	public selectNodeContents (referenceNode: Node) {
		this.setStart(referenceNode, 0);
		this.setEnd(referenceNode, referenceNode.childNodes.length);
	}

	/**
	 * Collapses the Range to one of its boundary points.
	 *
	 * @param toStart Whether to collapse to the start rather than the end position
	 */
	public collapse (toStart: boolean = false) {
		if (toStart) {
			this.setEnd(this.startContainer as Node, this.startOffset);
		}
		else {
			this.setStart(this.endContainer as Node, this.endOffset);
		}
	}

	/**
	 * Create a new range with the same boundary points.
	 *
	 * @return Copy of the current range
	 */
	public cloneRange (): Range {
		const startContainer = this.startContainer as Node;
		const document = startContainer instanceof Document ? startContainer : startContainer.ownerDocument as Document;
		const newRange = document.createRange();
		newRange.setStart(this.startContainer as Node, this.startOffset);
		newRange.setEnd(this.endContainer as Node, this.endOffset);

		return newRange;
	}

	/**
	 * Compares a boundary of the current range with a boundary of the specified range.
	 *
	 * @param comparisonType One of the constants exposed on the Range constructor determining the comparison to make
	 * @param range          Range against which to compare the current instance
	 *
	 * @return Either negative, zero or positive, depending on the relative positions of the points being compared
	 */
	public compareBoundaryPoints (comparisonType: number, range: Range): number | undefined {
		switch (comparisonType) {
			case Range.START_TO_START:
				return comparePoints(this.startContainer as Node, this.startOffset, range.startContainer as Node, range.startOffset);
			case Range.START_TO_END:
				return comparePoints(this.startContainer as Node, this.startOffset, range.endContainer as Node, range.endOffset);
			case Range.END_TO_END:
				return comparePoints(this.endContainer as Node, this.endOffset, range.endContainer as Node, range.endOffset);
			case Range.END_TO_START:
				return comparePoints(this.endContainer as Node, this.endOffset, range.startContainer as Node, range.startOffset);
		}

		return undefined;
	}
}

(Range.prototype as any).START_TO_START = 0;
(Range.prototype as any).START_TO_END = 1;
(Range.prototype as any).END_TO_END = 2;
(Range.prototype as any).END_TO_START = 3;
