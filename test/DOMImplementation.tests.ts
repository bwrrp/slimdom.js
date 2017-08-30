import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('DOMImplementation', () => {
	let domImplementation: slimdom.DOMImplementation;
	beforeEach(() => {
		const document = new slimdom.Document();
		domImplementation = document.implementation;
	});

	describe('.createDocumentType()', () => {
		it('can create a document type', () => {
			const doctype = domImplementation.createDocumentType(
				'someName',
				'somePublicId',
				'someSystemId'
			);
			chai.assert.equal(doctype.nodeType, 10);
			chai.assert.equal(doctype.name, 'someName');
			chai.assert.equal(doctype.publicId, 'somePublicId');
			chai.assert.equal(doctype.systemId, 'someSystemId');
		});
	});

	describe('.createDocument()', () => {
		it('can create a blank document', () => {
			const document = domImplementation.createDocument(null, '');
			chai.assert.equal(document.nodeType, 9);
			chai.assert.equal(document.firstChild, null);
		});

		it('can create a document with a given document type', () => {
			const doctype = domImplementation.createDocumentType(
				'someName',
				'somePublicId',
				'someSystemId'
			);
			const document = domImplementation.createDocument(null, '', doctype);
			chai.assert.equal(document.nodeType, 9);
			chai.assert.equal(document.firstChild, document.doctype);
			chai.assert.equal(document.doctype, doctype);
			chai.assert.equal(document.documentElement, null);
		});

		it('can create a document with a given root element', () => {
			const document = domImplementation.createDocument(null, 'someRootElementName');
			chai.assert.equal(document.nodeType, 9);
			chai.assert.equal(document.firstChild, document.documentElement);
			chai.assert.equal(
				(document.documentElement as slimdom.Element).nodeName,
				'someRootElementName'
			);
		});
	});

	describe('.createHTMLDocument()', () => {
		it('can create a document without a title', () => {
			const document = domImplementation.createHTMLDocument(null);
			const html = document.documentElement!;
			chai.assert.equal(html.namespaceURI, 'http://www.w3.org/1999/xhtml');
			chai.assert.equal(html.localName, 'html');
			const head = html.firstElementChild!;
			chai.assert.equal(head.localName, 'head');
			const body = html.lastElementChild!;
			chai.assert.equal(body.localName, 'body');
			const title = head.firstElementChild;
			chai.assert.equal(title, null);
		});

		it('can create a document with a title', () => {
			const document = domImplementation.createHTMLDocument('some title');
			const html = document.documentElement!;
			chai.assert.equal(html.namespaceURI, 'http://www.w3.org/1999/xhtml');
			chai.assert.equal(html.localName, 'html');
			const head = html.firstElementChild!;
			chai.assert.equal(head.localName, 'head');
			const body = html.lastElementChild!;
			chai.assert.equal(body.localName, 'body');
			const title = head.firstElementChild!;
			chai.assert.equal(title.localName, 'title');
			chai.assert.equal((title.firstChild as slimdom.Text).data, 'some title');
		});
	});
});
