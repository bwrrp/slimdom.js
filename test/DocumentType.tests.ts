import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('DocumentType', () => {
	let doctype: slimdom.DocumentType;
	beforeEach(() => {
		const document = new slimdom.Document();
		doctype = document.implementation.createDocumentType('somename', 'somePublicId', 'someSystemId');
	});

	it('has nodeType 10', () => chai.assert.equal(doctype.nodeType, 10));

	it('has a name', () => chai.assert.equal(doctype.name, 'somename'));

	it('has a publicId', () => chai.assert.equal(doctype.publicId, 'somePublicId'));

	it('has a systemId', () => chai.assert.equal(doctype.systemId, 'someSystemId'));

	it('can be cloned', () => {
		const clone = doctype.cloneNode(true) as slimdom.DocumentType;
		chai.assert.equal(clone.nodeType, 10);
		chai.assert.equal(clone.name, 'somename');
		chai.assert.equal(clone.publicId, 'somePublicId');
		chai.assert.equal(clone.systemId, 'someSystemId');
		chai.assert.notEqual(clone, doctype);
	});
});
