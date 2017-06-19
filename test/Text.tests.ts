import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Text', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createTextNode()', () => {
		const text = document.createTextNode('some data');
		chai.assert.equal(text.nodeType, 3);
		chai.assert.equal(text.nodeName, '#text');
		chai.assert.equal(text.nodeValue, 'some data');
		chai.assert.equal(text.data, 'some data');

		chai.assert.equal(text.ownerDocument, document);
	});

	it('can be created using its constructor (with data)', () => {
		const text = new slimdom.Text('some data');
		chai.assert.equal(text.nodeType, 3);
		chai.assert.equal(text.nodeName, '#text');
		chai.assert.equal(text.nodeValue, 'some data');
		chai.assert.equal(text.data, 'some data');

		chai.assert.equal(text.ownerDocument, slimdom.document);
	});

	it('can be created using its constructor (without arguments)', () => {
		const text = new slimdom.Text();
		chai.assert.equal(text.nodeType, 3);
		chai.assert.equal(text.nodeName, '#text');
		chai.assert.equal(text.nodeValue, '');
		chai.assert.equal(text.data, '');

		chai.assert.equal(text.ownerDocument, slimdom.document);
	});

	it('can set its data using nodeValue', () => {
		const text = document.createTextNode('some data');
		text.nodeValue = 'other data';
		chai.assert.equal(text.nodeValue, 'other data');
		chai.assert.equal(text.data, 'other data');

		text.nodeValue = null;
		chai.assert.equal(text.nodeValue, '');
		chai.assert.equal(text.data, '');
	});

	it('can set its data using data', () => {
		const text = document.createTextNode('some data');
		text.data = 'other data';
		chai.assert.equal(text.nodeValue, 'other data');
		chai.assert.equal(text.data, 'other data');
	});

	it('can be cloned', () => {
		const text = document.createTextNode('some data');
		var copy = text.cloneNode() as slimdom.Text;
		chai.assert.equal(copy.nodeType, 3);
		chai.assert.equal(copy.nodeName, '#text');
		chai.assert.equal(copy.nodeValue, 'some data');
		chai.assert.equal(copy.data, 'some data');
		chai.assert.notEqual(copy, text);
	});

	it('can lookup a prefix or namespace on its parent element', () => {
		const text = document.createTextNode('some data');
		chai.assert.equal(text.lookupNamespaceURI('prf'), null);
		chai.assert.equal(text.lookupPrefix('http://www.example.com/ns'), null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.appendChild(text);
		chai.assert.equal(text.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(text.lookupPrefix('http://www.example.com/ns'), 'prf');
	});

	it('can substring its data', () => {
		const text = document.createTextNode('text');
		chai.assert.equal(text.substringData(0, 2), 'te');
		chai.assert.equal(text.substringData(2, 2), 'xt');
		chai.assert.equal(text.substringData(1, 2), 'ex');
		chai.assert.equal(text.substringData(2, 9999), 'xt');

		chai.assert.throws(() => text.substringData(-123, 1), 'IndexSizeError');
		chai.assert.throws(() => text.substringData(123, 1), 'IndexSizeError');
	});

	it('can appendData', () => {
		const text = document.createTextNode('text');
		text.appendData('123');
		chai.assert.equal(text.data, 'text123');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 7);
	});

	it('can insertData', () => {
		const text = document.createTextNode('text');
		text.insertData(2, '123');
		chai.assert.equal(text.data, 'te123xt');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 7);

		text.insertData(0, '123');
		chai.assert.equal(text.data, '123te123xt');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 10);

		text.insertData(text.length, '123');
		chai.assert.equal(text.data, '123te123xt123');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 13);

		chai.assert.throws(() => text.insertData(-123, '123'), 'IndexSizeError');
		chai.assert.throws(() => text.insertData(123, '123'), 'IndexSizeError');
	});

	it('can deleteData', () => {
		const text = document.createTextNode('text');
		text.deleteData(0, 0);
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.deleteData(0, 1);
		chai.assert.equal(text.data, 'ext');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 3);

		text.deleteData(text.length, 2);
		chai.assert.equal(text.data, 'ext');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 3);

		text.deleteData(1, 1);
		chai.assert.equal(text.data, 'et');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 2);

		text.deleteData(1, 9999);
		chai.assert.equal(text.data, 'e');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 1);

		chai.assert.throws(() => text.deleteData(-123, 2), 'IndexSizeError');
		chai.assert.throws(() => text.deleteData(123, 2), 'IndexSizeError');
	});

	it('can replaceData', () => {
		const text = document.createTextNode('text');
		text.replaceData(0, 0, '');
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.replaceData(0, 10, 'asd');
		chai.assert.equal(text.data, 'asd');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 3);

		text.replaceData(text.length, 10, 'fgh');
		chai.assert.equal(text.data, 'asdfgh');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 6);

		text.replaceData(3, 4, 'asd');
		chai.assert.equal(text.data, 'asdasd');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 6);

		chai.assert.throws(() => text.replaceData(-123, 2, 'text'), 'IndexSizeError');
		chai.assert.throws(() => text.replaceData(123, 2, 'text'), 'IndexSizeError');
	});

	describe('splitting', () => {
		it('can be split', () => {
			const text = document.createTextNode('text');
			const otherHalf = text.splitText(2);
			chai.assert.equal(text.data, 'te');
			chai.assert.equal(text.nodeValue, text.data);
			chai.assert.equal(otherHalf.data, 'xt');
			chai.assert.equal(otherHalf.nodeValue, otherHalf.data);

			chai.assert.throws(() => text.splitText(-123), 'IndexSizeError');
			chai.assert.throws(() => text.splitText(123), 'IndexSizeError');
		});

		describe('under a parent', () => {
			let text: slimdom.Text;
			let element: slimdom.Element;
			beforeEach(() => {
				element = document.createElement('parent');
				text = document.createTextNode('text');
				element.appendChild(text);
			});

			it('is split correctly', () => {
				const otherHalf = text.splitText(2);
				chai.assert.equal(text.data, 'te');
				chai.assert.equal(text.nodeValue, text.data);
				chai.assert.equal(otherHalf.data, 'xt');
				chai.assert.equal(otherHalf.nodeValue, otherHalf.data);
			});

			it('both halves are children of the parent', () => {
				const otherHalf = text.splitText(2);
				chai.assert.equal(text.parentNode, element);
				chai.assert.equal(otherHalf.parentNode, element);
			});

			it('both halves are siblings', () => {
				const otherHalf = text.splitText(2);
				chai.assert.equal(text.nextSibling, otherHalf);
				chai.assert.equal(otherHalf.previousSibling, text);
			});

			it('updates ranges after the split point', () => {
				const range1 = new slimdom.Range();
				const range2 = new slimdom.Range();
				range1.setStart(text, 3);
				range1.setEnd(text, 4);
				range2.setStart(element, 1);
				range2.collapse(true);
				const otherHalf = text.splitText(2);
				chai.assert.equal(range1.startContainer, otherHalf);
				chai.assert.equal(range1.startOffset, 1);
				chai.assert.equal(range1.endContainer, otherHalf);
				chai.assert.equal(range1.endOffset, 2);
				chai.assert.equal(range2.startContainer, element);
				chai.assert.equal(range2.startOffset, 2);
				chai.assert.equal(range2.endContainer, element);
				chai.assert.equal(range2.endOffset, 2);
			});
		});
	});
});
