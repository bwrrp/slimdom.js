import DOMImplementation from '../src/DOMImplementation';

describe('DOMImplementation', () => {
	let domImplementation: DOMImplementation;
	beforeEach(() => {
		domImplementation = new DOMImplementation();
	});

	describe('.createDocumentType()', () => {
		it('can create a document type', () => {
			const doctype = domImplementation.createDocumentType('someName', 'somePublicId', 'someSystemId');
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
			const doctype = domImplementation.createDocumentType('someName', 'somePublicId', 'someSystemId');
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
			chai.assert.equal(document.documentElement.nodeName, 'someRootElementName');
		});
	});
});
