import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('DOM mutations', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	describe('Node#appendChild / Node#insertBefore', () => {
		it('throws if inserting a node below one that can not have children', () => {
			const text = document.createTextNode('test');
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('test', 'test');
			chai.assert.throws(() => text.appendChild(comment), 'HierarchyRequestError');
			chai.assert.throws(() => comment.appendChild(pi), 'HierarchyRequestError');
			chai.assert.throws(() => pi.appendChild(text), 'HierarchyRequestError');
		});

		it('throws if inserting a node below one of its descendants', () => {
			const descendant = document
				.appendChild(document.createElement('ancestor'))
				.appendChild(document.createElement('middle'))
				.appendChild(document.createElement('descendant'));
			chai.assert.throws(() => descendant.appendChild(document.documentElement!), 'HierarchyRequestError');
		});

		it('throws if the reference node is not a child of the parent', () => {
			const parent = document.createElement('parent');
			const notChild = document.createElement('notChild');
			const text = document.createTextNode('test');
			chai.assert.throws(() => parent.insertBefore(text, notChild), 'NotFoundError');
		});

		it('throws if inserting a node that can not be a child', () => {
			const attr = document.createAttribute('test');
			const doc = new slimdom.Document();
			const element = document.createElement('test');
			chai.assert.throws(() => element.appendChild(attr), 'HierarchyRequestError');
			chai.assert.throws(() => element.appendChild(doc), 'HierarchyRequestError');
		});

		it('throws if inserting a text node directly under the document', () => {
			const text = document.createTextNode('test');
			chai.assert.throws(() => document.appendChild(text), 'HierarchyRequestError');
		});

		it('throws if inserting a doctype under something other than a document', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			const fragment = document.createDocumentFragment();
			chai.assert.throws(() => fragment.appendChild(doctype), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a text node under a document', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createTextNode('test'));
			chai.assert.throws(() => document.appendChild(fragment), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add multiple document elements', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			chai.assert.throws(() => document.appendChild(fragment), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add another document element', () => {
			const fragment = document.createDocumentFragment();
			document.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			chai.assert.throws(() => document.appendChild(fragment), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a document element before the doctype', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			chai.assert.throws(() => document.insertBefore(fragment, doctype), 'HierarchyRequestError');
			const comment = document.insertBefore(document.createComment('test'), doctype);
			chai.assert.throws(() => document.insertBefore(fragment, comment), 'HierarchyRequestError');
		});

		it('allows inserting a document element using a fragment', () => {
			const fragment = document.createDocumentFragment();
			const child = fragment.appendChild(document.createElement('child1')) as slimdom.Element;
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			document.appendChild(fragment);
			chai.assert.equal(document.documentElement, child);
		});

		it('throws if inserting a document element before the doctype', () => {
			const element = document.createElement('test');
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			chai.assert.throws(() => document.insertBefore(element, doctype), 'HierarchyRequestError');
			const comment = document.insertBefore(document.createComment('test'), doctype);
			chai.assert.throws(() => document.insertBefore(element, comment), 'HierarchyRequestError');
		});

		it('throws if inserting a second doctype', () => {
			const htmlDocument = document.implementation.createHTMLDocument('test');
			const doctype = document.implementation.createDocumentType('test', '', '');
			chai.assert.throws(() => htmlDocument.appendChild(doctype), 'HierarchyRequestError');
		});

		it('throws if inserting a doctype after the document element', () => {
			const element = document.appendChild(document.createElement('test'));
			const doctype = document.implementation.createDocumentType('html', '', '');
			chai.assert.throws(() => document.appendChild(doctype), 'HierarchyRequestError');
		});

		it('correctly handles inserting a node before itself', () => {
			const parent = document.appendChild(document.createElement('parent')) as slimdom.Element;
			const element = parent.appendChild(document.createElement('child')) as slimdom.Element;
			parent.insertBefore(element, element);
			chai.assert.equal(parent.firstElementChild, element);
			chai.assert.equal(element.nextElementSibling, null);
			chai.assert.equal(element.previousElementSibling, null);
		});

		it('throws if inserting the document element before itself', () => {
			const element = document.appendChild(document.createElement('test')) as slimdom.Element;
			chai.assert.throws(() => document.insertBefore(element, element), 'HierarchyRequestError');
		});

		describe('effect on ranges', () => {
			let range: slimdom.Range;
			beforeEach(() => {
				range = document.createRange();
			});

			it('updates ranges after the insertion point', () => {
				const parent = document.createElement('parent');
				const child = parent.appendChild(document.createComment('test'));
				range.setStartAfter(child);
				range.collapse(true);
				chai.assert.equal(range.startContainer, parent);
				chai.assert.equal(range.startOffset, 1);
				parent.insertBefore(document.createTextNode('test'), child);
				chai.assert.equal(range.startContainer, parent);
				chai.assert.equal(range.startOffset, 2);
			});
		});
	});

	describe('replaceChild', () => {
		it('throws if replacing under a non-parent node', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			chai.assert.throws(() => doctype.replaceChild(doctype, doctype), 'HierarchyRequestError');
		});

		it('throws if inserting a node below one of its descendants', () => {
			const descendant = document
				.appendChild(document.createElement('ancestor'))
				.appendChild(document.createElement('middle'))
				.appendChild(document.createElement('descendant'));
			const pi = descendant.appendChild(document.createProcessingInstruction('target', 'test'));
			chai.assert.throws(() => descendant.replaceChild(document.documentElement!, pi), 'HierarchyRequestError');
		});

		it('throws if replacing a node that is not a child of the parent', () => {
			const parent = document.createElement('parent');
			const notChild = document.createElement('notChild');
			const text = document.createTextNode('test');
			chai.assert.throws(() => parent.replaceChild(text, notChild), 'NotFoundError');
		});

		it('throws if inserting a node that can not be a child', () => {
			const parent = document.createElement('parent');
			const oldChild = parent.appendChild(document.createComment(''));
			const attr = document.createAttribute('test');
			const doc = new slimdom.Document();
			chai.assert.throws(() => parent.replaceChild(attr, oldChild), 'HierarchyRequestError');
			chai.assert.throws(() => parent.replaceChild(doc, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a text node directly under the document', () => {
			const text = document.createTextNode('test');
			const oldChild = document.appendChild(document.createComment(''));
			chai.assert.throws(() => document.replaceChild(text, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a doctype under something other than a document', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			const fragment = document.createDocumentFragment();
			const oldChild = fragment.appendChild(document.createComment(''));
			chai.assert.throws(() => fragment.replaceChild(doctype, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a text node under a document', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createTextNode('test'));
			chai.assert.throws(() => document.replaceChild(fragment, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add multiple document elements', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			chai.assert.throws(() => document.replaceChild(fragment, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add another document element', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			document.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			chai.assert.throws(() => document.replaceChild(fragment, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a document element before the doctype', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			chai.assert.throws(() => document.replaceChild(fragment, oldChild), 'HierarchyRequestError');
		});

		it('allows inserting a document element using a fragment', () => {
			const fragment = document.createDocumentFragment();
			const child = fragment.appendChild(document.createElement('child1')) as slimdom.Element;
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			const oldChild = document.appendChild(document.createComment(''));
			document.replaceChild(fragment, oldChild);
			chai.assert.equal(document.documentElement, child);
		});

		it('throws if inserting a document element before the doctype', () => {
			const element = document.createElement('test');
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.appendChild(document.implementation.createDocumentType('html', '', ''));
			chai.assert.throws(() => document.replaceChild(element, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a second doctype', () => {
			const htmlDocument = document.implementation.createHTMLDocument('test');
			const doctype = document.implementation.createDocumentType('test', '', '');
			const oldChild = htmlDocument.appendChild(document.createComment(''));
			chai.assert.throws(() => htmlDocument.replaceChild(doctype, oldChild), 'HierarchyRequestError');
		});

		it('throws if inserting a doctype after the document element', () => {
			const element = document.appendChild(document.createElement('test'));
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.implementation.createDocumentType('html', '', '');
			chai.assert.throws(() => document.replaceChild(doctype, oldChild), 'HierarchyRequestError');
		});

		it('allows insert a doctype', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.implementation.createDocumentType('html', '', '');
			document.replaceChild(doctype, oldChild);
			chai.assert.equal(document.doctype, doctype);
		});

		it('correctly handles replacing a node with itself', () => {
			const parent = document.appendChild(document.createElement('parent')) as slimdom.Element;
			const element = parent.appendChild(document.createElement('child')) as slimdom.Element;
			parent.replaceChild(element, element);
			chai.assert.equal(parent.firstElementChild, element);
			chai.assert.equal(element.nextElementSibling, null);
			chai.assert.equal(element.previousElementSibling, null);
		});

		it('correctly handles replacing a node with its next sibling', () => {
			const parent = document.appendChild(document.createElement('parent')) as slimdom.Element;
			const element1 = parent.appendChild(document.createElement('child')) as slimdom.Element;
			const element2 = parent.appendChild(document.createElement('child')) as slimdom.Element;
			parent.replaceChild(element2, element1);
			chai.assert.equal(parent.firstElementChild, element2);
			chai.assert.equal(element2.nextElementSibling, null);
			chai.assert.equal(element2.previousElementSibling, null);
		});
	});

	describe('removeChild', () => {
		it('throws if the child is not a child of the parent', () => {
			const element = document.createElement('element');
			chai.assert.throws(() => document.removeChild(element), 'NotFoundError');
		});

		describe('effect on ranges', () => {
			let range: slimdom.Range;
			beforeEach(() => {
				range = document.createRange();
			});

			it('updates ranges after the deletion point', () => {
				const parent = document.createElement('parent');
				const child = parent.appendChild(document.createComment('test'));
				parent.appendChild(document.createTextNode('test'));
				range.setStartAfter(parent.lastChild!);
				range.collapse(true);
				chai.assert.equal(range.startContainer, parent);
				chai.assert.equal(range.startOffset, 2);
				parent.removeChild(child);
				chai.assert.equal(range.startContainer, parent);
				chai.assert.equal(range.startOffset, 1);
			});
		});
	});
});
