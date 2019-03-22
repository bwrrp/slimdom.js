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
		expect(doctype.nodeType).toBe(10);
		expect(doctype.nodeName).toBe('HTML');
		expect(doctype.nodeValue).toBe(null);
		expect(doctype.name).toBe('HTML');
		expect(doctype.publicId).toBe('-//W3C//DTD HTML 4.01//EN');
		expect(doctype.systemId).toBe('http://www.w3.org/TR/html4/strict.dtd');
		expect(doctype.ownerDocument).toBe(document);
	});

	it('can not change its nodeValue', () => {
		doctype.nodeValue = 'test';
		expect(document.nodeValue).toBe(null);
	});

	it('can not change its textContent', () => {
		doctype.textContent = 'test';
		expect(doctype.textContent).toBe(null);
	});

	it('can be cloned', () => {
		const copy = doctype.cloneNode(true);
		expect(copy.nodeType).toBe(10);
		expect(copy.name).toBe('somename');
		expect(copy.publicId).toBe('somePublicId');
		expect(copy.systemId).toBe('someSystemId');
		expect(copy.ownerDocument).toBe(document);
		expect(copy).not.toBe(doctype);
	});

	it('can not lookup namespaces or prefixes', () => {
		document.appendChild(doctype);
		document.appendChild(document.createElementNS('http://www.example.com/ns', 'prf:test'));
		expect(doctype.lookupNamespaceURI('prf')).toBe(null);
		expect(doctype.lookupPrefix('http://www.example.com/ns')).toBe(null);
	});

	describe('.before', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			doctype.before(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes before the node', () => {
			document.appendChild(doctype);
			doctype.before(comment);

			expect(doctype.previousSibling).toBe(comment);
		});
	});

	describe('.after', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			doctype.after(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes after the node', () => {
			document.appendChild(doctype);
			doctype.after(comment);

			expect(doctype.nextSibling).toBe(comment);
		});
	});

	describe('.replaceWith', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			doctype.replaceWith(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can replace the node with nodes and/or text', () => {
			document.appendChild(doctype);
			doctype.replaceWith(comment);

			expect(doctype.parentNode).toBe(null);
			expect(document.firstChild).toBe(comment);
		});
	});

	describe('.remove', () => {
		it('does nothing if the node does not have a parent', () => {
			doctype.remove();
			expect(doctype.parentNode).toBe(null);
		});

		it('can remove the node from its parent', () => {
			document.appendChild(doctype);
			doctype.remove();

			expect(doctype.parentNode).toBe(null);
			expect(document.doctype).toBe(null);
		});
	});
});
