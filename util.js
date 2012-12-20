define(function() {
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
		if (node1 !== node2) {
			var parents1 = parents(node1),
				parents2 = parents(node2);
			// This should not be called on nodes from different trees
			if (parents1[0] != parents2[0]) return undefined;
			// Skip common parents
			var commonParent = parents1[0];
			while (parents1[0] && parents2[0] && parents1[0] == parents2[0]) {
				commonParent = parents1.shift();
				parents2.shift();
			}
			// Compute offsets at the level under the last common parent
			if (parents1.length) offset1 = _.indexOf(commonParent.childNodes, parents1[0]);
			if (parents2.length) offset2 = _.indexOf(commonParent.childNodes, parents2[0]);
		}
		// Compare positions at this level
		return offset1 - offset2;
	}

	return {
		commonAncestor: commonAncestor,
		comparePoints: comparePoints,
		parents: parents
	};
});
