import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('XMLDocument', () => {
	it('can be created using DOMImplementation#createDocument()', () => {
		const doc = slimdom.document.implementation.createDocument(null, '');
		chai.assert.instanceOf(doc, slimdom.XMLDocument);
		chai.assert.equal(doc.nodeType, 9);
	});

	it('can be cloned', () => {
		const doc = slimdom.document.implementation.createDocument(null, '');
		const copy = doc.cloneNode();
		chai.assert.instanceOf(copy, slimdom.XMLDocument);
		chai.assert.equal(copy.nodeType, 9);
	});
});
