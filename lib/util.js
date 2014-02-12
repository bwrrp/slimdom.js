/**
 * @module slimdom
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

		/**
		 * Get all parents of the given node.
		 *
		 * @method parents
		 * 
		 * @param  {Node}   node  A Node to get it's parents from.
		 * 
		 * @return {Array}  Array with all parents of node
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
		 * Returns the first common ancestor of the two nodes.
		 *
		 * @method commonAncestor
		 * 
		 * @param  {Node}  node1  First node for comparison.
		 * @param  {Node}  node2  Second node for comparison.
		 * 
		 * @return {Node}  First common ancestor of the two nodes.
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
		 * Compares two positions within the document.
		 *
		 * @method comparePoints
		 * 
		 * @param  {Node}    node1    First node for comparison.
		 * @param  {Number}  offset1  Initial offset for first node.
		 * @param  {Node}    node2    Second node for comparison.
		 * @param  {Number}  offset2  Initial offset for second node.
		 * 
		 * @return {Number}  Offset between node 1 and 2 expressed as a number.
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
		 * Queues mutation on all target nodes, and on all target nodes of all its ancestors.
		 *
		 * @method queueMutationRecord
		 * 
		 * @param  {MutationRecord}  mutationRecord  The MutationRecord to queue.
		 */
		function queueMutationRecord(mutationRecord) {
			// Check all inclusive ancestors of the target for registered observers
			for (var node = mutationRecord.target; node; node = node.parentNode) {
				node.registeredObservers.queueRecord(mutationRecord);
			}
		}

		/**
		 * Slimdom utility functions, intended for internal usage by the slimdom module.
		 * 
		 * @class util
		 * @static
		 * @private
		 */
		return {
			commonAncestor: commonAncestor,
			comparePoints: comparePoints,
			parents: parents,
			queueMutationRecord: queueMutationRecord
		};
	}
);
