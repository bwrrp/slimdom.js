/**
 * Slimdom util functions
 * @namespace slimdom
 * @module util
 * @class util
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

		/**
		 * Get all parents of the given node
		 * @memberOf util#
		 * @param  {Node} node - Child node object to get parents from
		 * @return {array}       Array with all parents of node
		 */
		function parents(node) {
			var nodes = [];
			while (node) {
				nodes.unshift(node);
				node = node.parentNode;
			}
			return nodes;
		}

		/**
		 * Find the common ancestor of the two nodes
		 * @memberOf util#
		 * @param  {Node} node1 - First node for comparison
		 * @param  {Node} node2 - Second node for comparison
		 * @return {Node}       First common ancestor of the two nodes
		 */
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

		/**
		 * Compare two positions within the document
		 * @memberOf util#
		 * @param  {Node}   node1   - First node for comparison
		 * @param  {number} offset1 - Initial offset for first node
		 * @param  {Node}   node2   - Second node for comparison
		 * @param  {number} offset2 - Initial offset for second node
		 * @return {number}         Offset between node 1 and 2 expressed as a number
		 */
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

		/**
		 * Queue mutation on all target nodes, and on all target nodes of all its ancestors
		 * @memberOf util#
		 * @param  {object} mutationRecord - The mutationRecord to queue
		 */
		function queueMutationRecord(mutationRecord) {
			// Check all inclusive ancestors of the target for registered observers
			for (var node = mutationRecord.target; node; node = node.parentNode) {
				node.registeredObservers.queueRecord(mutationRecord);
			}
		}

		/**
		 * @exports util
		 * @name util
		 * @memberOf util#
		 * @borrows commonAncestor as commonAncestor
		 * @borrows comparePoints as comparePoints
		 * @borrows parents as parents
		 * @borrows queueMutationRecord as queueMutationRecord
		 */
		return {
			commonAncestor: commonAncestor,
			comparePoints: comparePoints,
			parents: parents,
			queueMutationRecord: queueMutationRecord
		};
	}
);
