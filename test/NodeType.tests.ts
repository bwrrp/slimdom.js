import * as slimdom from '../src/index';

describe('NodeType', () => {
	it('is exposed as constants on the Node constructor', () => {
		expect(slimdom.Node.ELEMENT_NODE).toBe(1);
		expect(slimdom.Node.ATTRIBUTE_NODE).toBe(2);
		expect(slimdom.Node.TEXT_NODE).toBe(3);
		expect(slimdom.Node.CDATA_SECTION_NODE).toBe(4);
		expect(slimdom.Node.ENTITY_REFERENCE_NODE).toBe(5);
		expect(slimdom.Node.ENTITY_NODE).toBe(6);
		expect(slimdom.Node.PROCESSING_INSTRUCTION_NODE).toBe(7);
		expect(slimdom.Node.COMMENT_NODE).toBe(8);
		expect(slimdom.Node.DOCUMENT_NODE).toBe(9);
		expect(slimdom.Node.DOCUMENT_TYPE_NODE).toBe(10);
		expect(slimdom.Node.DOCUMENT_FRAGMENT_NODE).toBe(11);
		expect(slimdom.Node.NOTATION_NODE).toBe(12);
	});

	it('is exposed as properties on Node instances', () => {
		const node = slimdom.document.createElement('test');
		expect(node.ELEMENT_NODE).toBe(1);
		expect(node.ATTRIBUTE_NODE).toBe(2);
		expect(node.TEXT_NODE).toBe(3);
		expect(node.CDATA_SECTION_NODE).toBe(4);
		expect(node.ENTITY_REFERENCE_NODE).toBe(5);
		expect(node.ENTITY_NODE).toBe(6);
		expect(node.PROCESSING_INSTRUCTION_NODE).toBe(7);
		expect(node.COMMENT_NODE).toBe(8);
		expect(node.DOCUMENT_NODE).toBe(9);
		expect(node.DOCUMENT_TYPE_NODE).toBe(10);
		expect(node.DOCUMENT_FRAGMENT_NODE).toBe(11);
		expect(node.NOTATION_NODE).toBe(12);
	});
});
