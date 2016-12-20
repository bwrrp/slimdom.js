import slimdom from '../src/index';

import Document from '../src/Document';
import DOMImplementation from '../src/DOMImplementation';
import Element from '../src/Element';
import Node from '../src/Node';
import ProcessingInstruction from '../src/ProcessingInstruction';

describe('Document', () => {
	let document: Document;
	beforeEach(() => {
		document = slimdom.createDocument();
	});

	it('has nodeType 9', () => chai.assert.equal(document.nodeType, 9));

	it('exposes its DOMImplementation', () => chai.assert.instanceOf(document.implementation, DOMImplementation));

	it('initially has no doctype', () => chai.assert.equal(document.doctype, null));

	it('initially has no documentElement', () => chai.assert.equal(document.documentElement, null));

	it('initially has no childNodes', () => chai.assert.deepEqual(document.childNodes, []));

	it('can have user data', () => {
		chai.assert.equal(document.getUserData('test'), null);
		document.setUserData('test', {abc: 123});
		chai.assert.deepEqual(document.getUserData('test'), {abc: 123});
	});

	describe('after appending a child element', () => {
		let element: Element;
		beforeEach(() => {
			element = document.createElement('test');
			document.appendChild(element);
		});

		it('has a documentElement', () => chai.assert.equal(document.documentElement, element));

		it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [ element ]));

		it('the child element is adopted into the document', () => chai.assert.equal(element.ownerDocument, document));

		describe('after removing the element', () => {
			beforeEach(() => {
				document.removeChild(element);
			});

			it('has no documentElement', () => chai.assert.equal(document.documentElement, null));

			it('has no childNodes', () => chai.assert.deepEqual(document.childNodes, []));
		});

		describe('after replacing the element', () => {
			let otherElement: Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, element);
			});

			it('has the other element as documentElement', () => chai.assert.equal(document.documentElement, otherElement));

			it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [ otherElement ]));
		});
	});

	describe('after appending a processing instruction', () => {
		var processingInstruction: ProcessingInstruction;
		beforeEach(() => {
			processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
			document.appendChild(processingInstruction);
		});

		it('has no documentElement', () => chai.assert.equal(document.documentElement, null));

		it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [ processingInstruction ]));

		describe('after replacing with an element', () => {
			let otherElement: Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, processingInstruction);
			});

			it('has the other element as documentElement', () => chai.assert.equal(document.documentElement, otherElement));

			it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [ otherElement ]));
		});
	});

	describe('cloning', () => {
		var clone: Document;
		beforeEach(() => {
			document.appendChild(document.createElement('root'));
			clone = document.cloneNode(true) as Document;
		});

		it('is a new document', () => {
			chai.assert.equal(clone.nodeType, 9);
			chai.assert.notEqual(clone, document);
		});

		it('has a new document element', () => {
			chai.assert.equal(clone.documentElement.nodeType, 1);
			chai.assert.equal(clone.documentElement.nodeName, 'root');
			chai.assert.notEqual(clone.documentElement, document.documentElement);
		});
	});
});
