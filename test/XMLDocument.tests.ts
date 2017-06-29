import * as slimdom from '../src/index';

describe('XMLDocument', () => {
	it('can be created using DOMImplementation#createDocument()', () => {
		const doc = slimdom.document.implementation.createDocument(null, '');
		expect(doc).toBeInstanceOf(slimdom.XMLDocument);
		expect(doc.nodeType).toBe(9);
	});

	it('can be cloned', () => {
		const doc = slimdom.document.implementation.createDocument(null, '');
		const copy = doc.cloneNode();
		expect(copy).toBeInstanceOf(slimdom.XMLDocument);
		expect(copy.nodeType).toBe(9);
	});
});
