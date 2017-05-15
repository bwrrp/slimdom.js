import Node from './Node';

/**
 * Get all inclusive ancestors of the given node.
 *
 * @param node Node to collect ancestors for
 *
 * @return All inclusive ancestors, ordered from root down to node
 */
export function parents (node: Node | null): Node[] {
	const nodes = [];
	while (node) {
		nodes.unshift(node);
		node = node.parentNode;
	}
	return nodes;
}

/**
 * Returns the index of the given node in its parent's childNodes.
 * Used as an offset, this represents the position just before the given node.
 *
 * @param node Node to determine the index of
 *
 * @return The index among node's siblings
 */
export function getNodeIndex (node: Node): number {
	return (node.parentNode as Node).childNodes.indexOf(node);
}

/**
 * Returns the first common ancestor of the two nodes.
 *
 * @param node1 First node
 * @param node2 Second node
 *
 * @return Common ancestor of node1 and node2, or null if the nodes are in different trees
 */
export function commonAncestor (node1: Node, node2: Node): Node | null {
	if (node1 === node2) {
		return node1;
	}

	const parents1 = parents(node1);
	const parents2 = parents(node2);
	let parent1 = parents1[0];
	let parent2 = parents2[0];

	if (parent1 !== parent2) {
		return null;
	}

	for (let i = 1, l = Math.min(parents1.length, parents2.length); i < l; i++) {
		// Let the commonAncestor be one step behind
		const commonAncestor = parent1;
		parent1 = parents1[i];
		parent2 = parents2[i];

		if (!parent1 || !parent2 || parent1 !== parent2) {
			return commonAncestor;
		}
	}

	// The common Ancestor is the node itself
	return parent1;
}

/**
 * Compares two positions within the document.
 *
 * @param node1   Container of first position
 * @param offset1 Offset of first position
 * @param node2   Container of second position
 * @param offset2 Offset of second position
 *
 * @return Negative, 0 or positive, depending on the relative ordering of the given positions
 */
export function comparePoints (node1: Node, offset1: number, node2: Node, offset2: number): number | undefined {
	if (node1 !== node2) {
		const parents1 = parents(node1);
		const parents2 = parents(node2);
		// This should not be called on nodes from different trees
		if (parents1[0] !== parents2[0]) {
			return undefined;
		}

		// Skip common parents
		while (parents1[0] && parents2[0] && parents1[0] === parents2[0]) {
			parents1.shift();
			parents2.shift();
		}

		// Compute offsets at the level under the last common parent,
		// we add 0.5 to indicate a position inside the parent rather than before or after
		if (parents1.length) {
			offset1 = getNodeIndex(parents1[0]) + 0.5;
		}
		if (parents2.length) {
			offset2 = getNodeIndex(parents2[0]) + 0.5;
		}
	}

	// Compare positions at this level
	return offset1 - offset2;
}
