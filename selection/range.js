define(function() {
	function Range(document) {
		// Uninitialized ranges point at the document in which they were created
		this.commonAncestorContainer = this.startContainer = this.endContainer = document;
		this.startOffset = this.endOffset = 0;
		this.collapsed = true;
	}

	// Get all parents of the given node
	function parents(node) {
		var nodes = [];
		while (node) {
			nodes.unshift(node);
			node = node.parentNode;
		}
		return nodes;
	}

	// Find the common ancestor of the two nodes
	function commonAncestor(node1, node2) {
		var parents1 = parents(node1),
			parents2 = parents(node2);
		if (parents1[0] != parents2[0]) return null;
		for (var i = 1, l = parents1.length; i < l; ++i) {
			if (parents1[i] != parents2[i]) return parents1[i - 1];
		}
		return parents1[0];
	}

	// Compare two positions within the document
	function comparePoints(node1, offset1, node2, offset2) {
		if (node1 == node2) {
			return offset2 - offset1;
		} else {
			var parents1 = parents(node1),
				parents2 = parents(node2);
			// This should not be called on nodes from different trees
			if (parents1[0] != parents2[0]) return undefined;
			// Skip common parents
			var commonParent = parents1[0];
			while (parents1[0] == parents2[0]) {
				commonParent = parents1.shift();
				parents2.shift();
			}
			return _.indexOf(commonParent.childNodes, parents2[0]) -
				_.indexOf(commonParent.childNodes, parents1[0]);
		}
	}

	// Helper used to update the range when start and/or end has changed
	function pointsChanged() {
		this.commonAncestorContainer = commonAncestor(this.startContainer, this.endContainer);
		this.collapsed = (this.startContainer == this.endContainer && this.startOffset == this.endOffset);
	}

	// Sets the start position of a Range.
	Range.prototype.setStart = function(startNode, startOffset) {
		this.startContainer = startNode;
		this.startOffset = startOffset;

		// If start is after end, move end to start
		if (comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
			this.setEnd(startNode, startOffset);
		}

		pointsChanged.call(this);
	};

	// Sets the end position of a Range.
	Range.prototype.setEnd = function(endNode, endOffset) {
		this.endContainer = endNode;
		this.endOffset = endOffset;

		// If end is before start, move start to end
		if (comparePoints(this.startContainer, this.startOffset, this.endContainer, this.endOffset) > 0) {
			this.setStart(startNode, startOffset);
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
