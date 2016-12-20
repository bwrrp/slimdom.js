import slimdom from '../src/index';

import Document from '../src/Document';
import Element from '../src/Element';
import Text from '../src/Text';

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

	// TODO: wholeText not yet supported
	it('has wholeText');
	//it('has wholeText', () => {
	//	chai.assert.equal(text.wholeText, 'text');
	//})

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
		chai.assert.equal(text.substringData(2), 'xt');
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

		text.insertData(-100, '123');
		chai.assert.equal(text.data, '123te123xt');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 10);

		text.insertData(100, '123');
		chai.assert.equal(text.data, '123te123xt123');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 13);
	});

	it('can deleteData', () => {
		text.deleteData(0, 0);
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.deleteData(-100, 1);
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.deleteData(100, 2);
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.deleteData(1, 1);
		chai.assert.equal(text.data, 'txt');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 3);

		text.deleteData(2);
		chai.assert.equal(text.data, 'tx');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 2);
	});

	it('can replaceData', () => {
		text.replaceData(0, 0, '');
		chai.assert.equal(text.data, 'text');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 4);

		text.replaceData(-100, 10, 'asd');
		chai.assert.equal(text.data, 'asdtext');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 7);

		text.replaceData(100, 10, 'asd');
		chai.assert.equal(text.data, 'asdtextasd');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 10);

		text.replaceData(3, 4, 'asd');
		chai.assert.equal(text.data, 'asdasdasd');
		chai.assert.equal(text.nodeValue, text.data);
		chai.assert.equal(text.length, 9);
	});

	describe('splitting', () => {
		it('can be split', () => {
			const otherHalf = text.splitText(2);
			chai.assert.equal(text.data, 'te');
			chai.assert.equal(text.nodeValue, text.data);
			chai.assert.equal(otherHalf.data, 'xt');
			chai.assert.equal(otherHalf.nodeValue, otherHalf.data);
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

			// TODO: wholeText not yet supported
			it('has wholeText');
			//it('has wholeText', () => {
			//	chai.assert.equal(text.wholeText, 'text');
			//	chai.assert.equal(otherHalf.wholeText, 'text');
			//});
		});
	});
});
