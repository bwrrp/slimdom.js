import slimdom from '../src/index';

import DocumentType from '../src/DocumentType';

describe('DocumentType', () => {
	let doctype: DocumentType;
	beforeEach(() => {
		doctype = slimdom.implementation.createDocumentType('somename', 'somePublicId', 'someSystemId');
	});

	it('has nodeType 10', () => chai.assert.equal(doctype.nodeType, 10));

	it('has a name', () => chai.assert.equal(doctype.name, 'somename'));

	it('has a publicId', () => chai.assert.equal(doctype.publicId, 'somePublicId'));

	it('has a systemId', () => chai.assert.equal(doctype.systemId, 'someSystemId'));

	it('can be cloned', () => {
		const clone = doctype.cloneNode(true) as DocumentType;
		chai.assert.equal(clone.nodeType, 10);
		chai.assert.equal(clone.name, 'somename');
		chai.assert.equal(clone.publicId, 'somePublicId');
		chai.assert.equal(clone.systemId, 'someSystemId');
		chai.assert.notEqual(clone, doctype);
	});
});
