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

		function Range(document) {
			// Uninitialized ranges point at the document in which they were created
			this.commonAncestorContainer = this.startContainer = this.endContainer = document;
			this.startOffset = this.endOffset = 0;
			this.collapsed = true;

			this.detached = false;

			// Start tracking the range
			document.ranges.push(this);
		}

		// Constants for compareBoundaryPoints
		Range.prototype.START_TO_START = Range.START_TO_START = 0;
		Range.prototype.START_TO_END   = Range.START_TO_END   = 1;
		Range.prototype.END_TO_END     = Range.END_TO_END     = 2;
		Range.prototype.END_TO_START   = Range.END_TO_START   = 3;

		// Call detach to dispose of a range
		Range.prototype.detach = function() {
			// Stop tracking the range
			var document = this.startContainer.ownerDocument || this.startContainer;
			document.ranges = _.without(document.ranges, this);

			// Clear properties
			this.detached = true;
			this.commonAncestorContainer = this.startContainer = this.endContainer = null;
			this.startOffset = this.endOffset = 0;
			this.collapsed = true;
		};

		// Helper used to update the range when start and/or end has changed
		function pointsChanged() {
			this.commonAncestorContainer = util.commonAncestor(this.startContainer, this.endContainer);
			this.collapsed = (this.startContainer == this.endContainer && this.startOffset == this.endOffset);
		}

		// Sets the start position of a Range.
		Range.prototype.setStart = function(startNode, startOffset) {
			this.startContainer = startNode;
			this.startOffset = startOffset;

			// If start is after end, move end to start
			if (util.comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
				this.setEnd(startNode, startOffset);
			}

			pointsChanged.call(this);
		};

		// Sets the end position of a Range.
		Range.prototype.setEnd = function(endNode, endOffset) {
			this.endContainer = endNode;
			this.endOffset = endOffset;

			// If end is before start, move start to end
			if (util.comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
				this.setStart(endNode, endOffset);
			}

			pointsChanged.call(this);
		};

		// Sets the start position of a Range relative to another Node.
		Range.prototype.setStartBefore = function(referenceNode) {
			this.setStart(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode));
		};

		// Sets the start position of a Range relative to another Node.
		Range.prototype.setStartAfter = function(referenceNode) {
			this.setStart(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode) + 1);
		};

		// Sets the end position of a Range relative to another Node.
		Range.prototype.setEndBefore = function(referenceNode) {
			this.setEnd(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode));
		};

		// Sets the end position of a Range relative to another Node.
		Range.prototype.setEndAfter = function(referenceNode) {
			this.setEnd(referenceNode.parentNode, _.indexOf(referenceNode.parentNode.childNodes, referenceNode) + 1);
		};

		// Sets the Range to contain the Node and its contents.
		Range.prototype.selectNode = function(referenceNode) {
			this.setStartBefore(referenceNode);
			this.setEndAfter(referenceNode);
		};

		// Sets the Range to contain the contents of a Node.
		Range.prototype.selectNodeContents = function(referenceNode) {
			this.setStart(referenceNode, 0);
			this.setEnd(referenceNode, referenceNode.childNodes.length);
		};

		// Collapses the Range to one of its boundary points.
		Range.prototype.collapse = function(toStart) {
			if (toStart) {
				this.setEnd(this.startContainer, this.startOffset);
			} else {
				this.setStart(this.endContainer, this.endOffset);
			}
		};

		// Create a new range with the same boundary points.
		Range.prototype.cloneRange = function() {
			var document = this.startContainer.ownerDocument || this.startContainer,
				newRange = document.createRange();
			newRange.setStart(this.startContainer, this.startOffset);
			newRange.setEnd(this.endContainer, this.endOffset);

			return newRange;
		};

		// Compares a boundary of the current range with a boundary of the specified range.
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
		};

		return Range;
	}
);
