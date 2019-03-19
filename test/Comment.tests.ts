import * as slimdom from '../src/index';

describe('Comment', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createComment()', () => {
		const comment = document.createComment('some data');
		expect(comment.nodeType).toBe(8);
		expect(comment.nodeName).toBe('#comment');
		expect(comment.nodeValue).toBe('some data');
		expect(comment.data).toBe('some data');
	});

	it('can be created using its constructor (with data)', () => {
		const comment = new slimdom.Comment('some data');
		expect(comment.nodeType).toBe(8);
		expect(comment.nodeName).toBe('#comment');
		expect(comment.nodeValue).toBe('some data');
		expect(comment.data).toBe('some data');

		expect(comment.ownerDocument).toBe(slimdom.document);
	});

	it('can be created using its constructor (without arguments)', () => {
		const comment = new slimdom.Comment();
		expect(comment.nodeType).toBe(8);
		expect(comment.nodeName).toBe('#comment');
		expect(comment.nodeValue).toBe('');
		expect(comment.data).toBe('');

		expect(comment.ownerDocument).toBe(slimdom.document);
	});

	it('can set its data using nodeValue', () => {
		const comment = document.createComment('some data');
		comment.nodeValue = 'other data';
		expect(comment.nodeValue).toBe('other data');
		expect(comment.textContent).toBe('other data');
		expect(comment.data).toBe('other data');

		comment.nodeValue = null;
		expect(comment.nodeValue).toBe('');
		expect(comment.textContent).toBe('');
		expect(comment.data).toBe('');
	});

	it('can set its data using textContent', () => {
		const comment = document.createComment('some data');
		comment.textContent = 'other data';
		expect(comment.nodeValue).toBe('other data');
		expect(comment.textContent).toBe('other data');
		expect(comment.data).toBe('other data');

		comment.textContent = null;
		expect(comment.nodeValue).toBe('');
		expect(comment.textContent).toBe('');
		expect(comment.data).toBe('');
	});

	it('can set its data using data', () => {
		const comment = document.createComment('some data');
		comment.data = 'other data';
		expect(comment.nodeValue).toBe('other data');
		expect(comment.data).toBe('other data');
		(comment as any).data = null;
		expect(comment.nodeValue).toBe('');
		expect(comment.data).toBe('');
	});

	it('can be cloned', () => {
		const comment = document.createComment('some data');
		var copy = comment.cloneNode();
		expect(copy.nodeType).toBe(8);
		expect(copy.nodeName).toBe('#comment');
		expect(copy.nodeValue).toBe('some data');
		expect(copy.data).toBe('some data');
		expect(copy).not.toBe(comment);
	});

	it('can lookup a prefix or namespace on its parent element', () => {
		const comment = document.createComment('some data');
		expect(comment.lookupNamespaceURI('prf')).toBe(null);
		expect(comment.lookupPrefix('http://www.example.com/ns')).toBe(null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.appendChild(comment);
		expect(comment.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(comment.lookupPrefix('http://www.example.com/ns')).toBe('prf');
	});
});
