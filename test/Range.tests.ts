import * as slimdom from '../src/index';

import Document from '../src/Document';
import Element from '../src/Element';
import Node from '../src/Node';
import Text from '../src/Text';
import Range from '../src/Range';

import * as chai from 'chai';

describe('Range', () => {
	let document: Document;
	let element: Element;
	let text: Text;
	let range: Range;
	beforeEach(() => {
		document = slimdom.createDocument();
		element = document.appendChild(document.createElement('root')) as Element;
		text = element.appendChild(document.createTextNode('text')) as Text;
		range = document.createRange();
	});

	it('is initially collapsed at the start of the document', () => {
		chai.assert.equal(range.collapsed, true);
		chai.assert.equal(range.startContainer, document);
		chai.assert.equal(range.endContainer, document);
		chai.assert.equal(range.startOffset, 0);
		chai.assert.equal(range.endOffset, 0);
	});

	describe('setting positions', () => {
		it('start after end moves end', () => {
			range.setStart(element, 0);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 0);
			chai.assert.equal(range.collapsed, true);
		});

		it('end after start is ok', () => {
			range.setEnd(element, 1);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.startContainer, document);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.collapsed, false);
		});

		it('can selectNode', () => {
			range.selectNode(element);
			chai.assert.equal(range.startContainer, document);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, document);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, false);
		});

		it('can selectNodeContents', () => {
			range.selectNodeContents(element);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, false);
		});

		it('can be collapsed to start', () => {
			range.selectNodeContents(element);
			range.collapse(true);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 0);
			chai.assert.equal(range.collapsed, true);
		});

		it('can be collapsed to end', () => {
			range.selectNodeContents(element);
			range.collapse(false);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 1);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, true);
		});

		it('can be cloned', () => {
			range.selectNodeContents(element);
			const clone = range.cloneRange();
			range.setStart(document, 0);
			range.collapse(true);
			chai.assert.equal(clone.startContainer, element);
			chai.assert.equal(clone.startOffset, 0);
			chai.assert.equal(clone.endContainer, element);
			chai.assert.equal(clone.endOffset, 1);
			chai.assert.equal(clone.collapsed, false);
		});
	});

	describe('under mutations', () => {

		describe('in element', () => {
			beforeEach(() => {
				range.setStart(element, 0);
				range.setEnd(element, 1);
			});

			it('moves positions beyond an insert', () => {
				element.insertBefore(document.createElement('test'), element.firstChild);
				chai.assert.equal(range.startContainer, element);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, element);
				chai.assert.equal(range.endOffset, 2);
			});

			it('moves positions beyond a remove', () => {
				element.removeChild(element.firstChild as Node);
				chai.assert.equal(range.startContainer, element);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, element);
				chai.assert.equal(range.endOffset, 0);
			});
		});

		describe('in text', () => {
			beforeEach(() => {
				range.setStart(text, 1);
				range.setEnd(text, 3);
			});

			it('moves positions beyond an insert', () => {
				text.insertData(0, '123');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 4);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 6);
			});

			it('moves positions inside and beyond a delete', () => {
				text.deleteData(0, 2);
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 1);
			});

			it('moves to the start of a replace when inside', () => {
				text.replaceData(1, 2, '123');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 1);
			});

			it('moves positions beyond a replace when the new text is shorter', () => {
				text.replaceData(0, 2, '1');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 2);
			});

			it('moves positions beyond a replace when the new text is longer', () => {
				text.replaceData(0, 2, '123');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 4);
			});

			it('ignores positions before or on an insert', () => {
				text.insertData(3, '123');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 3);
			});

			it('ignores positions before or at the start of a delete', () => {
				text.deleteData(3, 1);
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 3);
			});

			it('ignores positions before or at the start of a replace', () => {
				text.replaceData(3, 1, '123');
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 3);
			});

			it('moves with text splits', () => {
				const secondHalf = text.splitText(2);
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, secondHalf);
				chai.assert.equal(range.endOffset, 1);
			});

			it('does not move with splits of detached text nodes', () => {
				element.removeChild(text);
				range.setStart(text, 1);
				range.setEnd(text, 2);
				const secondHalf = text.splitText(2);
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 1);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 2);
			});

			it('moves with text node deletes during normalization', () => {
				text.deleteData(0, 4);
				element.normalize();
				chai.assert.equal(range.startContainer, element);
				chai.assert.equal(range.startOffset, 0);
				chai.assert.equal(range.endContainer, element);
				chai.assert.equal(range.endOffset, 0);
			});

			it('moves with text node merges during normalization', () => {
				const otherText = element.appendChild(document.createTextNode('more')) as Node;
				range.setStartBefore(otherText);
				range.setEnd(otherText, 2);
				element.normalize();
				chai.assert.equal(range.startContainer, text);
				chai.assert.equal(range.startOffset, 4);
				chai.assert.equal(range.endContainer, text);
				chai.assert.equal(range.endOffset, 6);
			});
		});
	});
});
