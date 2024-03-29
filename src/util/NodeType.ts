import Attr from '../Attr';
import CharacterData from '../CharacterData';
import Document from '../Document';
import DocumentFragment from '../DocumentFragment';
import DocumentType from '../DocumentType';
import Element from '../Element';
import Node from '../Node';
import Text from '../Text';

export const enum NodeType {
	ELEMENT_NODE = 1,
	ATTRIBUTE_NODE = 2,
	TEXT_NODE = 3,
	CDATA_SECTION_NODE = 4,
	ENTITY_REFERENCE_NODE = 5, // legacy
	ENTITY_NODE = 6, // legacy
	PROCESSING_INSTRUCTION_NODE = 7,
	COMMENT_NODE = 8,
	DOCUMENT_NODE = 9,
	DOCUMENT_TYPE_NODE = 10,
	DOCUMENT_FRAGMENT_NODE = 11,
	NOTATION_NODE = 12, // legacy
}

/**
 * Checks whether the given node's nodeType is one of the specified values
 *
 * @param node  - The node to test
 * @param types - Possible nodeTypes for node
 *
 * @returns Whether node.nodeType is one of the specified values
 */
export function isNodeOfType(node: Node, ...types: NodeType[]): boolean {
	return types.some((t) => node.nodeType === t);
}

/**
 * Checks whether node implements Attr
 *
 * @param node - The node to test
 *
 * @returns Whether node is an Attr
 */
export function isAttrNode(node: Node): node is Attr {
	return node.nodeType === NodeType.ATTRIBUTE_NODE;
}

/**
 * Checks whether node implements CharacterData
 *
 * @param node - The node to test
 *
 * @returns Whether node is a CharacterData node
 */
export function isCharacterDataNode(node: Node): node is CharacterData {
	return (
		node.nodeType === NodeType.TEXT_NODE ||
		node.nodeType === NodeType.CDATA_SECTION_NODE ||
		node.nodeType === NodeType.COMMENT_NODE ||
		node.nodeType === NodeType.PROCESSING_INSTRUCTION_NODE
	);
}

/**
 * Checks whether node implements Text
 *
 * @param node - The node to test
 *
 * @returns Whether node is a Text (or CDataSection) node
 */
export function isTextNode(node: Node): node is Text {
	return node.nodeType === NodeType.TEXT_NODE || node.nodeType === NodeType.CDATA_SECTION_NODE;
}

/**
 * Checks whether node implements Element
 *
 * @param node - The node to test
 *
 * @returns Whether node is an Element node
 */
export function isElement(node: Node): node is Element {
	return node.nodeType === NodeType.ELEMENT_NODE;
}

/**
 * Checks whether node implements Document
 *
 * @param node - The node to test
 *
 * @returns Whether node is a Document node
 */
export function isDocument(node: Node): node is Document {
	return node.nodeType === NodeType.DOCUMENT_NODE;
}

/**
 * Checks whether node implements DocumentFragment
 *
 * @param node - The node to test
 *
 * @returns Whether node is a DocumentFragment node
 */
export function isDocumentFragment(node: Node): node is DocumentFragment {
	return node.nodeType === NodeType.DOCUMENT_FRAGMENT_NODE;
}

/**
 * Checks whether node implements DocumentType
 *
 * @param node - The node to test
 *
 * @returns Whether node is a DocumentType node
 */
export function isDocumentType(node: Node): node is DocumentType {
	return node.nodeType === NodeType.DOCUMENT_TYPE_NODE;
}
