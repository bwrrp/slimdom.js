if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

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
			var commonParent = parents1[0];
			while (parents1[0] && parents2[0] && parents1[0] == parents2[0]) {
				commonParent = parents1.shift();
				parents2.shift();
			}
			return commonParent;
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
				// Compute offsets at the level under the last common parent,
				// we add 0.5 to indicate a position inside the parent rather than before or after
				if (parents1.length) offset1 = _.indexOf(commonParent.childNodes, parents1[0]) + 0.5;
				if (parents2.length) offset2 = _.indexOf(commonParent.childNodes, parents2[0]) + 0.5;
			}
			// Compare positions at this level
			return offset1 - offset2;
		}

		function queueMutationRecord(mutationRecord) {
			// Check all inclusive ancestors of the target for registered observers
			for (var node = mutationRecord.target; node; node = node.parentNode) {
				node.registeredObservers.queueRecord(mutationRecord);
			}
		}

		return {
			commonAncestor: commonAncestor,
			comparePoints: comparePoints,
			parents: parents,
			queueMutationRecord: queueMutationRecord
		};
	}
);
