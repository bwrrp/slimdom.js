import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('DocumentType', () => {
	let document: slimdom.Document;
	let doctype: slimdom.DocumentType;
	beforeEach(() => {
		document = new slimdom.Document();
		doctype = document.implementation.createDocumentType(
			'somename',
			'somePublicId',
			'someSystemId'
		);
	});

	it('can be created using DOMImplementation#createDocumentType', () => {
		const doctype = document.implementation.createDocumentType(
			'HTML',
			'-//W3C//DTD HTML 4.01//EN',
			'http://www.w3.org/TR/html4/strict.dtd'
		);
		chai.assert.equal(doctype.nodeType, 10);
		chai.assert.equal(doctype.nodeName, 'HTML');
		chai.assert.equal(doctype.nodeValue, null);
		chai.assert.equal(doctype.name, 'HTML');
		chai.assert.equal(doctype.publicId, '-//W3C//DTD HTML 4.01//EN');
		chai.assert.equal(doctype.systemId, 'http://www.w3.org/TR/html4/strict.dtd');
		chai.assert.equal(doctype.ownerDocument, document);
	});

	it('can not change its nodeValue', () => {
		doctype.nodeValue = 'test';
		chai.assert.equal(document.nodeValue, null);
	});

	it('can be cloned', () => {
		const copy = doctype.cloneNode(true) as slimdom.DocumentType;
		chai.assert.equal(copy.nodeType, 10);
		chai.assert.equal(copy.name, 'somename');
		chai.assert.equal(copy.publicId, 'somePublicId');
		chai.assert.equal(copy.systemId, 'someSystemId');
		chai.assert.equal(copy.ownerDocument, document);
		chai.assert.notEqual(copy, doctype);
	});

	it('can not lookup namespaces or prefixes', () => {
		document.appendChild(doctype);
		document.appendChild(document.createElementNS('http://www.example.com/ns', 'prf:test'));
		chai.assert.equal(doctype.lookupNamespaceURI('prf'), null);
		chai.assert.equal(doctype.lookupPrefix('http://www.example.com/ns'), null);
	});
});
