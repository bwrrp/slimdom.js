import Node from '../Node';

export const enum NodeType {
	ELEMENT_NODE = 1,
	ATTRIBUTE_NODE = 2,
	TEXT_NODE = 3,
	CDATA_SECTION_NODE = 4,
	ENTITY_REFERENCE_NODE = 5, // historical
	ENTITY_NODE = 6, // historical
	PROCESSING_INSTRUCTION_NODE = 7,
	COMMENT_NODE = 8,
	DOCUMENT_NODE = 9,
	DOCUMENT_TYPE_NODE = 10,
	DOCUMENT_FRAGMENT_NODE = 11,
	NOTATION_NODE = 12 // historical
}

/**
 * Checks whether the given node's nodeType is one of the specified values
 *
 * @param node  The node to test
 * @param types Possible nodeTypes for node
 *
 * @return Whether node.nodeType is one of the specified values
 */
export function isNodeOfType (node: Node, ...types: NodeType[]): boolean {
	return types.some(t => node.nodeType === t);
}
