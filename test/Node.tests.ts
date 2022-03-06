import * as slimdom from '../src/index';

describe('Node', () => {
	describe('compareDocumentPosition', () => {
		it('returns the appropriate value', () => {
			const doc = new slimdom.Document();
			const detached = doc.createElement('detached');
			const root = doc.appendChild(doc.createElement('root'));
			const firstChild = root.appendChild(doc.createElement('first-child'));
			const secondChild = root.appendChild(doc.createElement('second-child'));
			firstChild.setAttribute('attr1', 'value');
			firstChild.setAttribute('attr2', 'value');
			const attr1 = firstChild.getAttributeNode('attr1')!;
			const attr2 = firstChild.getAttributeNode('attr2')!;
			secondChild.setAttribute('attr3', 'value');
			const attr3 = secondChild.getAttributeNode('attr3')!;
			const detachedAttr1 = doc.createAttribute('detached-attr1');
			const detachedAttr2 = doc.createAttribute('detached-attr2');

			// Compare to self returns 0
			for (const node of [root, firstChild, secondChild, attr1, attr2]) {
				expect(node.compareDocumentPosition(node)).toBe(0);
			}

			// Siblings
			expect(firstChild.compareDocumentPosition(secondChild)).toBe(
				slimdom.Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(secondChild.compareDocumentPosition(firstChild)).toBe(
				slimdom.Node.DOCUMENT_POSITION_PRECEDING
			);

			// Unrelated can be either order
			expect([
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING,
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING,
			]).toContain(firstChild.compareDocumentPosition(detached));
			expect([
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING,
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING,
			]).toContain(detached.compareDocumentPosition(firstChild));
			expect(firstChild.compareDocumentPosition(detached)).not.toBe(
				detached.compareDocumentPosition(firstChild)
			);

			// Same for detached attributes
			expect([
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING,
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING,
			]).toContain(attr1.compareDocumentPosition(detachedAttr1));
			expect([
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING,
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING,
			]).toContain(detachedAttr1.compareDocumentPosition(detachedAttr2));
			expect([
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING,
				slimdom.Node.DOCUMENT_POSITION_DISCONNECTED |
					slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING,
			]).toContain(detachedAttr2.compareDocumentPosition(detachedAttr1));
			expect(detachedAttr1.compareDocumentPosition(detachedAttr2)).not.toBe(
				detachedAttr2.compareDocumentPosition(detachedAttr1)
			);

			// Attributes on the same element
			expect(attr1.compareDocumentPosition(attr2)).toBe(
				slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(attr2.compareDocumentPosition(attr1)).toBe(
				slimdom.Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC |
					slimdom.Node.DOCUMENT_POSITION_PRECEDING
			);

			// Attributes on different elements
			expect(attr1.compareDocumentPosition(attr3)).toBe(
				slimdom.Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(attr3.compareDocumentPosition(attr1)).toBe(
				slimdom.Node.DOCUMENT_POSITION_PRECEDING
			);

			// Descendants / ancestors
			expect(doc.compareDocumentPosition(secondChild)).toBe(
				slimdom.Node.DOCUMENT_POSITION_CONTAINED_BY |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(firstChild.compareDocumentPosition(root)).toBe(
				slimdom.Node.DOCUMENT_POSITION_CONTAINS | slimdom.Node.DOCUMENT_POSITION_PRECEDING
			);

			// Attributes and their elements
			expect(firstChild.compareDocumentPosition(attr1)).toBe(
				slimdom.Node.DOCUMENT_POSITION_CONTAINED_BY |
					slimdom.Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect(attr2.compareDocumentPosition(firstChild)).toBe(
				slimdom.Node.DOCUMENT_POSITION_CONTAINS | slimdom.Node.DOCUMENT_POSITION_PRECEDING
			);
		});
	});
});
