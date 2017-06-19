import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Comment', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createComment()', () => {
		const comment = document.createComment('some data');
		chai.assert.equal(comment.nodeType, 8);
		chai.assert.equal(comment.nodeName, '#comment');
		chai.assert.equal(comment.nodeValue, 'some data');
		chai.assert.equal(comment.data, 'some data');
	});

	it('can be created using its constructor (with data)', () => {
		const comment = new slimdom.Comment('some data');
		chai.assert.equal(comment.nodeType, 8);
		chai.assert.equal(comment.nodeName, '#comment');
		chai.assert.equal(comment.nodeValue, 'some data');
		chai.assert.equal(comment.data, 'some data');

		chai.assert.equal(comment.ownerDocument, slimdom.document);
	});

	it('can be created using its constructor (without arguments)', () => {
		const comment = new slimdom.Comment();
		chai.assert.equal(comment.nodeType, 8);
		chai.assert.equal(comment.nodeName, '#comment');
		chai.assert.equal(comment.nodeValue, '');
		chai.assert.equal(comment.data, '');

		chai.assert.equal(comment.ownerDocument, slimdom.document);
	});

	it('can set its data using nodeValue', () => {
		const comment = document.createComment('some data');
		comment.nodeValue = 'other data';
		chai.assert.equal(comment.nodeValue, 'other data');
		chai.assert.equal(comment.data, 'other data');

		comment.nodeValue = null;
		chai.assert.equal(comment.nodeValue, '');
		chai.assert.equal(comment.data, '');
	});

	it('can set its data using data', () => {
		const comment = document.createComment('some data');
		comment.data = 'other data';
		chai.assert.equal(comment.nodeValue, 'other data');
		chai.assert.equal(comment.data, 'other data');
		(comment as any).data = null;
		chai.assert.equal(comment.nodeValue, '');
		chai.assert.equal(comment.data, '');
	});

	it('can be cloned', () => {
		const comment = document.createComment('some data');
		var copy = comment.cloneNode() as slimdom.Comment;
		chai.assert.equal(copy.nodeType, 8);
		chai.assert.equal(copy.nodeName, '#comment');
		chai.assert.equal(copy.nodeValue, 'some data');
		chai.assert.equal(copy.data, 'some data');
		chai.assert.notEqual(copy, comment);
	});

	it('can lookup a prefix or namespace on its parent element', () => {
		const comment = document.createComment('some data');
		chai.assert.equal(comment.lookupNamespaceURI('prf'), null);
		chai.assert.equal(comment.lookupPrefix('http://www.example.com/ns'), null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.appendChild(comment);
		chai.assert.equal(comment.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(comment.lookupPrefix('http://www.example.com/ns'), 'prf');
	});
});
