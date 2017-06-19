import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Range', () => {
	let document: slimdom.Document;
	let element: slimdom.Element;
	let text: slimdom.Text;
	let range: slimdom.Range;
	beforeEach(() => {
		document = new slimdom.Document();
		element = document.appendChild(document.createElement('root')) as slimdom.Element;
		text = element.appendChild(document.createTextNode('text')) as slimdom.Text;
		range = document.createRange();
	});

	it('is initially collapsed at the start of the document', () => {
		chai.assert.equal(range.collapsed, true);
		chai.assert.equal(range.startContainer, document);
		chai.assert.equal(range.endContainer, document);
		chai.assert.equal(range.startOffset, 0);
		chai.assert.equal(range.endOffset, 0);
		chai.assert.equal(range.commonAncestorContainer, document);
	});

	describe('setting positions', () => {
		it('start after end moves end', () => {
			range.setStart(element, 0);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 0);
			chai.assert.equal(range.collapsed, true);
			chai.assert.equal(range.commonAncestorContainer, element);
		});

		it('end after start is ok', () => {
			range.setEnd(element, 1);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.startContainer, document);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.collapsed, false);
			chai.assert.equal(range.commonAncestorContainer, document);
		});

		it('end before start moves start', () => {
			range.setStart(element, 1);
			range.setEnd(element, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 0);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.collapsed, true);
			chai.assert.equal(range.commonAncestorContainer, element);
		});

		it('throws if the container is a doctype', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			chai.assert.throws(() => range.setStart(doctype, 0), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.setEnd(doctype, 0), 'InvalidNodeTypeError');
		});

		it('throws if the index is beyond the length of the node', () => {
			chai.assert.throws(() => range.setStart(text, 5), 'IndexSizeError');
			chai.assert.throws(() => range.setEnd(text, -1), 'IndexSizeError');
		});

		it('can set its endpoints relative to a node', () => {
			range.setStartBefore(element);
			range.setEndBefore(text);
			chai.assert.equal(range.startContainer, document);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 0);
			range.setStartAfter(text);
			range.setEndAfter(element);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 1);
			chai.assert.equal(range.endContainer, document);
			chai.assert.equal(range.endOffset, 1);
		});

		it('can not set an endpoint before or after a node without a parent', () => {
			const detached = document.createElement('noparent');
			chai.assert.throws(() => range.setStartBefore(detached), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.setStartAfter(detached), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.setEndBefore(detached), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.setEndAfter(detached), 'InvalidNodeTypeError');
		});

		it('can selectNode', () => {
			range.selectNode(element);
			chai.assert.equal(range.startContainer, document);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, document);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, false);
			chai.assert.equal(range.commonAncestorContainer, document);
		});

		it('can not selectNode a node without a parent', () => {
			const detached = document.createElement('noparent');
			chai.assert.throws(() => range.selectNode(detached), 'InvalidNodeTypeError');
		});

		it('can selectNodeContents', () => {
			range.selectNodeContents(element);
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 0);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, false);
			chai.assert.equal(range.commonAncestorContainer, element);
		});

		it('can not selectNodeContents a doctype', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			chai.assert.throws(() => range.selectNodeContents(doctype), 'InvalidNodeTypeError');
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
			range.collapse();
			chai.assert.equal(range.startContainer, element);
			chai.assert.equal(range.startOffset, 1);
			chai.assert.equal(range.endContainer, element);
			chai.assert.equal(range.endOffset, 1);
			chai.assert.equal(range.collapsed, true);
		});

		it('can compute the common ancestor', () => {
			const child = element.appendChild(document.createElement('child')).appendChild(document.createTextNode('test'));
			range.setStart(text, 0);
			range.setEnd(child, 0);
			chai.assert.equal(range.commonAncestorContainer, element);
		});
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

	describe('comparing points', () => {
		it('can compare boundary points agains another range', () => {
			const range2 = document.createRange();
			range.setStart(element, 0);
			range.setEnd(text, 2);
			range2.setStart(text, 2);
			range2.setEnd(document, 1);
			chai.assert.throws(() => range.compareBoundaryPoints(98, range2), 'NotSupportedError');

			chai.assert.equal(range.compareBoundaryPoints(slimdom.Range.START_TO_START, range2), -1);
			chai.assert.equal(range.compareBoundaryPoints(slimdom.Range.START_TO_END, range2), 0);
			chai.assert.equal(range2.compareBoundaryPoints(slimdom.Range.END_TO_END, range), 1);
			chai.assert.equal(range.compareBoundaryPoints(slimdom.Range.END_TO_START, range2), -1);
			range2.detach();
		});

		it('can not compare boundary points if the ranges are in different documents', () => {
			const range2 = new slimdom.Range();
			chai.assert.throws(() => range.compareBoundaryPoints(slimdom.Range.START_TO_START, range2));
			range2.detach();
			range2.detach();
		});

		it('can compare a given point to the range', () => {
			range.setStart(element, 0);
			range.setEnd(element, 1);

			chai.assert(range.isPointInRange(text, 1));
			chai.assert(!range.isPointInRange(document, 1));

			const range2 = new slimdom.Range();
			const doctype = document.implementation.createDocumentType('html', '', '');
			document.insertBefore(doctype, document.documentElement);

			chai.assert(!range2.isPointInRange(element, 0));
			chai.assert.throws(() => range.isPointInRange(doctype, 0), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.isPointInRange(element, 3), 'IndexSizeError');

			chai.assert.equal(range.comparePoint(element, 0), 0);
			chai.assert.equal(range.comparePoint(document, 1), -1);
			chai.assert.equal(range.comparePoint(document, 2), 1);

			chai.assert.throws(() => range2.comparePoint(element, 0), 'WrongDocumentError');
			chai.assert.throws(() => range.comparePoint(doctype, 0), 'InvalidNodeTypeError');
			chai.assert.throws(() => range.comparePoint(element, 3), 'IndexSizeError');
		});

		it('can compare a given node to the range', () => {
			range.setStart(text, 0);
			range.setEnd(element, 1);
			const child = element.appendChild(document.createElement('child'));

			chai.assert(range.intersectsNode(text), 'intersects text');
			chai.assert(range.intersectsNode(element), 'intersects element');
			chai.assert(range.intersectsNode(document), 'intersects the document');
			chai.assert(!range.intersectsNode(child), 'does not intersect child');

			const range2 = new slimdom.Range();
			chai.assert(!range2.intersectsNode(document), "different roots don't intersect");
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
				element.removeChild(element.firstChild!);
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
				const otherText = element.appendChild(document.createTextNode('more'));
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
