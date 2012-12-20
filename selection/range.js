define(['../util'], function(util) {
	function Range(document) {
		// Uninitialized ranges point at the document in which they were created
		this.commonAncestorContainer = this.startContainer = this.endContainer = document;
		this.startOffset = this.endOffset = 0;
		this.collapsed = true;
	}

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

	return Range;
});
