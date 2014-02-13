/**
 * Information about the selections submodule goes here.
 *
 * TODO: add more high level explanation of what, how, why Range (and later Selection?), possibly add examples?
 *
 * TODO: some assorted remarks, need to be put into a coherent "story":
 * - For convenience, start node is start's node, start offset is start's offset, end node is end's node, and end offset is end's offset.
 * - The root of a range is the root of its start node.
 * - A node node is contained in a range range if node's root is the same as range's root, and (node, 0) is after range's start, and (node, length of node) is before range's end.
 * - A node is partially contained in a range if it is an inclusive ancestor of the range's start node but not its end node, or vice versa.
 *
 * Some facts to better understand these definitions:
 * - The content that one would think of as being within the range consists of all contained nodes, plus possibly some of the contents of the start node and end node if those are Text, ProcessingInstruction, or Comment nodes.
 * - The nodes that are contained in a range will generally not be contiguous, because the parent of a contained node will not always be contained.
 *   However, the descendants of a contained node are contained, and if two siblings are contained, so are any siblings that lie between them.
 * - The first contained node (if there are any) will always be after the start node, and the last contained node will always be equal to or before the end node's last descendant.
 * - The start node and end node of a range are never contained within it.
 * - There exists some partially contained node if and only if the start node and end node are different.
 * - The commonAncestorContainer attribute value is never contained or partially contained.
 *   If the start node is an ancestor of the end node, the common inclusive ancestor will be the start node. Exactly one of its children will be partially contained, and a child will be contained if and only if it precedes the partially contained child. If the end node is an ancestor of the start node, the opposite holds.
 *   If the start node is not an inclusive ancestor of the end node, nor vice versa, the common inclusive ancestor will be distinct from both of them. Exactly two of its children will be partially contained, and a child will be contained if and only if it lies between those two.
 *
 * @submodule selections
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'../util',

		'lodash'
	],
	function(
		util,

	 	_) {
		'use strict';

		/**
		 * @class Range
		 *
		 * @constructor
		 *
		 * @param  {Document}  document  The document on which this Range will be created.
		 */
		function Range(document) {
			// Uninitialized ranges point at the document in which they were created
			/**
			 * The first node which is a parent of everything (between the start and end node) inside the current range.
			 *
			 * @property commonAncestorContainer
			 * @type {Node}
			 * @final
			 */
			this.commonAncestorContainer = document;

			/**
			 * The node at which this range starts.
			 *
			 * @property startContainer
			 * @type {Node}
			 * @final
			 */
			this.startContainer = document;

			/**
			 * The offset in the startContainer at which this range starts.
			 *
			 * @property startOffset
			 * @type {Number}
			 * @final
			 */
			this.startOffset = 0;

			/**
			 * The node at which this range ends.
			 *
			 * @property endContainer
			 * @type {Node}
			 * @final
			 */
			this.endContainer = document;

			/**
			 * The offset in the endContainer at which this range ends.
			 *
			 * @property startOffset
			 * @type {Number}
			 * @final
			 */
			this.endOffset = 0;

			/**
			 * When a range is collapsed this means the startContainer and the endContainer are the same and the
			 * startOffset and the endOffset are identical too.
			 *
			 * @property collapsed
			 * @type {boolean}
			 * @final
			 */
			this.collapsed = true;

			/**
			 * When a range is detached this means the range is no longer part of a document (and is therefor unusable).
			 *
			 * @property detached
			 * @type {boolean}
			 * @final
			 */
			this.detached = false;

			// Start tracking the range
			document.ranges.push(this);
		}

		// TODO: add property documentation for these properties (just like Node's "constants")
		// Constants for compareBoundaryPoints
		Range.prototype.START_TO_START = 0;
		Range.START_TO_START = 0;

		Range.prototype.START_TO_END = 1;
		Range.START_TO_END = 1;

		Range.prototype.END_TO_END = 2;
		Range.END_TO_END = 2;

		Range.prototype.END_TO_START = 3;
		Range.END_TO_START = 3;

		/**
		 * Disposes the range and removes it from it's document.
		 *
		 * @method detach
		 */
		Range.prototype.detach = function() {
			// Stop tracking the range
			var document = this.startContainer.ownerDocument || this.startContainer;
			document.ranges = _.without(document.ranges, this);

			// Clear properties
			this.detached = true;
			this.commonAncestorContainer = null;
			this.startContainer = null;
			this.endContainer = null;
			this.startOffset = 0;
			this.endOffset = 0;
			this.collapsed = true;
		};

		// Helper used to update the range when start and/or end has changed
		function pointsChanged() {
			this.commonAncestorContainer = util.commonAncestor(this.startContainer, this.endContainer);
			this.collapsed = (this.startContainer == this.endContainer && this.startOffset == this.endOffset);
		}

		/**
		 * Sets the start position of a range to a given node and a given offset inside that node.
		 * TODO: explain offsets based on the type of node (Element / Text)
		 *
		 * @method setStart
		 *
		 * @param  {Node}    node    TODO: add description
		 * @param  {Number}  offset  TODO: add description
		 */
		Range.prototype.setStart = function(node, offset) {
			this.startContainer = node;
			this.startOffset = offset;

			// If start is after end, move end to start
			if (util.comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
				this.setEnd(node, offset);
			}

			pointsChanged.call(this);
		};

		/**
		 * Sets the start position of a range to a given node and a given offset inside that node.
		 * TODO: explain offsets based on the type of node (Element / Text)
		 *
		 * @method setEnd
		 *
		 * @param  {Node}    node    TODO: add description
		 * @param  {Number}  offset  TODO: add description
		 */
		Range.prototype.setEnd = function(node, offset) {
			this.endContainer = node;
			this.endOffset = offset;

			// If end is before start, move start to end
			if (util.comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
				this.setStart(node, offset);
			}

			pointsChanged.call(this);
		};

		/**
		 * Sets the start position of this Range relative to another Node.
		 *
		 * @method setStartBefore
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.setStartBefore = function(referenceNode) {
			this.setStart(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode));
		};

		/**
		 * Sets the start position of this Range relative to another Node.
		 *
		 * @method setStartAfter
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.setStartAfter = function(referenceNode) {
			this.setStart(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode) + 1);
		};

		/**
		 * Sets the end position of this Range relative to another Node.
		 *
		 * @method setEndBefore
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.setEndBefore = function(referenceNode) {
			this.setEnd(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode));
		};

		/**
		 * Sets the end position of this Range relative to another Node.
		 *
		 * @method setEndAfter
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.setEndAfter = function(referenceNode) {
			this.setEnd(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode) + 1);
		};

		/**
		 * Sets the Range to contain the Node and its contents.
		 *
		 * @method selectNode
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.selectNode = function(referenceNode) {
			this.setStartBefore(referenceNode);
			this.setEndAfter(referenceNode);
		};

		/**
		 * Sets the Range to contain the contents of a Node.
		 *
		 * @method selectNodeContents
		 *
		 * @param  {Node}  referenceNode  TODO: add description
		 */
		Range.prototype.selectNodeContents = function(referenceNode) {
			this.setStart(referenceNode, 0);
			this.setEnd(referenceNode, referenceNode.childNodes.length);
		};

		/**
		 * Collapses the Range to one of its boundary points.
		 *
		 * @method collapse
		 *
		 * @param  {Boolean}  toStart  TODO: add description
		 */
		Range.prototype.collapse = function(toStart) {
			if (toStart) {
				this.setEnd(this.startContainer, this.startOffset);
			} else {
				this.setStart(this.endContainer, this.endOffset);
			}
		};

		/**
		 * Create a new range with the same boundary points.
		 *
		 * @method cloneRange
		 *
		 * @return {Range}  The clone.
		 */
		Range.prototype.cloneRange = function() {
			var document = this.startContainer.ownerDocument || this.startContainer,
				newRange = document.createRange();
			newRange.setStart(this.startContainer, this.startOffset);
			newRange.setEnd(this.endContainer, this.endOffset);

			return newRange;
		};

		/**
		 * Compares a boundary of the current range with a boundary of the specified range.
		 *
		 * @method compareBoundaryPoints
		 *
		 * @param  {Number}       comparisonType  TODO: add description + explain Range constants just like Node
		 * @param  {Range}        range           TODO: add description
		 *
		 * @return {null|Number}  The offset between this range and the given range expressed as a number or null if the
		 * given comparisonType couldn't be parsed.
		 */
		Range.prototype.compareBoundaryPoints = function(comparisonType, range) {
			switch (comparisonType) {
				case Range.START_TO_START:
					return util.comparePoints(this.startContainer, this.startOffset, range.startContainer, range.startOffset);
				case Range.START_TO_END:
					return util.comparePoints(this.startContainer, this.startOffset, range.endContainer, range.endOffset);
				case Range.END_TO_END:
					return util.comparePoints(this.endContainer, this.endOffset, range.endContainer, range.endOffset);
				case Range.END_TO_START:
					return util.comparePoints(this.endContainer, this.endOffset, range.startContainer, range.startOffset);
			}

			return null;
		};

		return Range;
	}
);
