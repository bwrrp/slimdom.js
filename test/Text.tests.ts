import * as slimdom from '../src/index';

import Document from '../src/Document';
import Element from '../src/Element';
import Text from '../src/Text';

import * as chai from 'chai';

describe('Text', () => {
	let document: Document;
	let text: Text;
	beforeEach(() => {
		document = slimdom.createDocument();
		text = document.createTextNode('text');
	});

	it('has nodeType 3', () => chai.assert.equal(text.nodeType, 3));

	it('has data', () => chai.assert.equal(text.data, 'text'));

	it('has a nodeValue', () => chai.assert.equal(text.nodeValue, 'text'));

	it('has a length', () => chai.assert.equal(text.length, 4));

	it('can set data property', () => {
		var newValue = 'a new text value';
		text.data = newValue;
		chai.assert.equal(text.data, newValue);
		chai.assert.equal(text.nodeValue, newValue);
		chai.assert.equal(text.length, newValue.length);
	});

	it('can be cloned', () => {
		var clone = text.cloneNode(true) as Text;
		chai.assert.equal(clone.nodeType, 3);
		chai.assert.equal(clone.nodeValue, 'text');
		chai.assert.equal(clone.data, 'text');
		chai.assert.notEqual(clone, text);
	});

	it('can substring its data', () => {
		chai.assert.equal(text.substringData(0, 2), 'te');
		chai.assert.equal(text.substringData(2, 2), 'xt');
		chai.assert.equal(text.substringData(1, 2), 'ex');
		chai.assert.equal(text.substringData(2, 9999), 'xt');

		chai.assert.throws(() => text.substringData(-123, 1), 'IndexSizeError');
		chai.assert.throws(() => text.substringData(123, 1), 'IndexSizeError');
	});

	it('can appendData', () => {
		text.appendData('123');
		chai.assert.equal(text.data, 'text123');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 7);
	});

	it('can insertData', () => {
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
			const otherHalf = text.splitText(2);
			chai.assert.equal(text.data, 'te');
			chai.assert.equal(text.nodeValue, text.data);
			chai.assert.equal(otherHalf.data, 'xt');
			chai.assert.equal(otherHalf.nodeValue, otherHalf.data);

			chai.assert.throws(() => text.splitText(-123), 'IndexSizeError');
			chai.assert.throws(() => text.splitText(123), 'IndexSizeError');
		});

		describe('under a parent', () => {
			let element: Element;
			let otherHalf: Text;
			beforeEach(() => {
				element = document.createElement('parent');
				element.appendChild(text);
				otherHalf = text.splitText(2);
			});

			it('is split correctly', () => {
				chai.assert.equal(text.data, 'te');
				chai.assert.equal(text.nodeValue, text.data);
				chai.assert.equal(otherHalf.data, 'xt');
				chai.assert.equal(otherHalf.nodeValue, otherHalf.data);
			});

			it('both halves are children of the parent', () => {
				chai.assert.equal(text.parentNode, element);
				chai.assert.equal(otherHalf.parentNode, element);
			});

			it('both halves are siblings', () => {
				chai.assert.equal(text.nextSibling, otherHalf);
				chai.assert.equal(otherHalf.previousSibling, text);
			});
		});
	});
});
