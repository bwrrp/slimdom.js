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
			expect(doctype.nodeType).toBe(10);
			expect(doctype.name).toBe('someName');
			expect(doctype.publicId).toBe('somePublicId');
			expect(doctype.systemId).toBe('someSystemId');
		});
	});

	describe('.createDocument()', () => {
		it('can create a blank document', () => {
			const document = domImplementation.createDocument(null, '');
			expect(document.nodeType).toBe(9);
			expect(document.firstChild).toBe(null);
		});

		it('can create a document with a given document type', () => {
			const doctype = domImplementation.createDocumentType(
				'someName',
				'somePublicId',
				'someSystemId'
			);
			const document = domImplementation.createDocument(null, '', doctype);
			expect(document.nodeType).toBe(9);
			expect(document.firstChild).toBe(document.doctype);
			expect(document.doctype).toBe(doctype);
			expect(document.documentElement).toBe(null);
		});

		it('can create a document with a given root element', () => {
			const document = domImplementation.createDocument(null, 'someRootElementName');
			expect(document.nodeType).toBe(9);
			expect(document.firstChild).toBe(document.documentElement);
			expect(document.documentElement!.nodeName).toBe(
				'someRootElementName'
			);
		});
	});

	describe('.createHTMLDocument()', () => {
		it('can create a document without a title', () => {
			const document = domImplementation.createHTMLDocument(null);
			const html = document.documentElement!;
			expect(html.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
			expect(html.localName).toBe('html');
			const head = html.firstElementChild!;
			expect(head.localName).toBe('head');
			const body = html.lastElementChild!;
			expect(body.localName).toBe('body');
			const title = head.firstElementChild;
			expect(title).toBe(null);
		});

		it('can create a document with a title', () => {
			const document = domImplementation.createHTMLDocument('some title');
			const html = document.documentElement!;
			expect(html.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
			expect(html.localName).toBe('html');
			const head = html.firstElementChild!;
			expect(head.localName).toBe('head');
			const body = html.lastElementChild!;
			expect(body.localName).toBe('body');
			const title = head.firstElementChild!;
			expect(title.localName).toBe('title');
			expect((title.firstChild as slimdom.Text).data).toBe('some title');
		});
	});
});
