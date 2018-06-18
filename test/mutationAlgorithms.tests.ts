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
			expect(() => text.appendChild(comment)).toThrow('HierarchyRequestError');
			expect(() => comment.appendChild(pi)).toThrow('HierarchyRequestError');
			expect(() => pi.appendChild(text)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a node below one of its descendants', () => {
			const descendant = document
				.appendChild(document.createElement('ancestor'))
				.appendChild(document.createElement('middle'))
				.appendChild(document.createElement('descendant'));
			expect(() => descendant.appendChild(document.documentElement!)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if the reference node is not a child of the parent', () => {
			const parent = document.createElement('parent');
			const notChild = document.createElement('notChild');
			const text = document.createTextNode('test');
			expect(() => parent.insertBefore(text, notChild)).toThrow('NotFoundError');
		});

		it('throws if inserting a node that can not be a child', () => {
			const attr = document.createAttribute('test');
			const doc = new slimdom.Document();
			const element = document.createElement('test');
			expect(() => element.appendChild(attr)).toThrow('HierarchyRequestError');
			expect(() => element.appendChild(doc)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a text node directly under the document', () => {
			const text = document.createTextNode('test');
			expect(() => document.appendChild(text)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a doctype under something other than a document', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			const fragment = document.createDocumentFragment();
			expect(() => fragment.appendChild(doctype)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a text node under a document', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createTextNode('test'));
			expect(() => document.appendChild(fragment)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a fragment would add multiple document elements', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			expect(() => document.appendChild(fragment)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a fragment would add another document element', () => {
			const fragment = document.createDocumentFragment();
			document.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			expect(() => document.appendChild(fragment)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a document element before the doctype', () => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			expect(() => document.insertBefore(fragment, doctype)).toThrow('HierarchyRequestError');
			const comment = document.insertBefore(document.createComment('test'), doctype);
			expect(() => document.insertBefore(fragment, comment)).toThrow('HierarchyRequestError');
		});

		it('allows inserting a document element using a fragment', () => {
			const fragment = document.createDocumentFragment();
			const child = fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			document.appendChild(fragment);
			expect(document.documentElement).toBe(child);
		});

		it('throws if inserting a document element before the doctype', () => {
			const element = document.createElement('test');
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			expect(() => document.insertBefore(element, doctype)).toThrow('HierarchyRequestError');
			const comment = document.insertBefore(document.createComment('test'), doctype);
			expect(() => document.insertBefore(element, comment)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a second doctype', () => {
			const htmlDocument = document.implementation.createHTMLDocument('test');
			const doctype = document.implementation.createDocumentType('test', '', '');
			expect(() => htmlDocument.appendChild(doctype)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a doctype after the document element', () => {
			const element = document.appendChild(document.createElement('test'));
			const doctype = document.implementation.createDocumentType('html', '', '');
			expect(() => document.appendChild(doctype)).toThrow('HierarchyRequestError');
		});

		it('correctly handles inserting a node before itself', () => {
			const parent = document.appendChild(document.createElement('parent'));
			const element = parent.appendChild(document.createElement('child'));
			parent.insertBefore(element, element);
			expect(parent.firstElementChild).toBe(element);
			expect(element.nextElementSibling).toBe(null);
			expect(element.previousElementSibling).toBe(null);
		});

		it('throws if inserting the document element before itself', () => {
			const element = document.appendChild(document.createElement('test'));
			expect(() => document.insertBefore(element, element)).toThrow('HierarchyRequestError');
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
				expect(range.startContainer).toBe(parent);
				expect(range.startOffset).toBe(1);
				parent.insertBefore(document.createTextNode('test'), child);
				expect(range.startContainer).toBe(parent);
				expect(range.startOffset).toBe(2);
			});
		});
	});

	describe('replaceChild', () => {
		it('throws if replacing under a non-parent node', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			expect(() => doctype.replaceChild(doctype, doctype)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a node below one of its descendants', () => {
			const descendant = document
				.appendChild(document.createElement('ancestor'))
				.appendChild(document.createElement('middle'))
				.appendChild(document.createElement('descendant'));
			const pi = descendant.appendChild(
				document.createProcessingInstruction('target', 'test')
			);
			expect(() => descendant.replaceChild(document.documentElement!, pi)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if replacing a node that is not a child of the parent', () => {
			const parent = document.createElement('parent');
			const notChild = document.createElement('notChild');
			const text = document.createTextNode('test');
			expect(() => parent.replaceChild(text, notChild)).toThrow('NotFoundError');
		});

		it('throws if inserting a node that can not be a child', () => {
			const parent = document.createElement('parent');
			const oldChild = parent.appendChild(document.createComment(''));
			const attr = document.createAttribute('test');
			const doc = new slimdom.Document();
			expect(() => parent.replaceChild(attr, oldChild)).toThrow('HierarchyRequestError');
			expect(() => parent.replaceChild(doc, oldChild)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a text node directly under the document', () => {
			const text = document.createTextNode('test');
			const oldChild = document.appendChild(document.createComment(''));
			expect(() => document.replaceChild(text, oldChild)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a doctype under something other than a document', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			const fragment = document.createDocumentFragment();
			const oldChild = fragment.appendChild(document.createComment(''));
			expect(() => fragment.replaceChild(doctype, oldChild)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a fragment would add a text node under a document', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createTextNode('test'));
			expect(() => document.replaceChild(fragment, oldChild)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if inserting a fragment would add multiple document elements', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			expect(() => document.replaceChild(fragment, oldChild)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if inserting a fragment would add another document element', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			document.appendChild(document.createElement('child1'));
			fragment.appendChild(document.createElement('child2'));
			expect(() => document.replaceChild(fragment, oldChild)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if inserting a fragment would add a document element before the doctype', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const fragment = document.createDocumentFragment();
			fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			expect(() => document.replaceChild(fragment, oldChild)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('allows inserting a document element using a fragment', () => {
			const fragment = document.createDocumentFragment();
			const child = fragment.appendChild(document.createElement('child1'));
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			const oldChild = document.appendChild(document.createComment(''));
			document.replaceChild(fragment, oldChild);
			expect(document.documentElement).toBe(child);
		});

		it('throws if inserting a document element before the doctype', () => {
			const element = document.createElement('test');
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.appendChild(
				document.implementation.createDocumentType('html', '', '')
			);
			expect(() => document.replaceChild(element, oldChild)).toThrow('HierarchyRequestError');
		});

		it('throws if inserting a second doctype', () => {
			const htmlDocument = document.implementation.createHTMLDocument('test');
			const doctype = document.implementation.createDocumentType('test', '', '');
			const oldChild = htmlDocument.appendChild(document.createComment(''));
			expect(() => htmlDocument.replaceChild(doctype, oldChild)).toThrow(
				'HierarchyRequestError'
			);
		});

		it('throws if inserting a doctype after the document element', () => {
			const element = document.appendChild(document.createElement('test'));
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.implementation.createDocumentType('html', '', '');
			expect(() => document.replaceChild(doctype, oldChild)).toThrow('HierarchyRequestError');
		});

		it('allows insert a doctype', () => {
			const oldChild = document.appendChild(document.createComment(''));
			const doctype = document.implementation.createDocumentType('html', '', '');
			document.replaceChild(doctype, oldChild);
			expect(document.doctype).toBe(doctype);
		});

		it('correctly handles replacing a node with itself', () => {
			const parent = document.appendChild(document.createElement('parent'));
			const element = parent.appendChild(document.createElement('child'));
			parent.replaceChild(element, element);
			expect(parent.firstElementChild).toBe(element);
			expect(element.nextElementSibling).toBe(null);
			expect(element.previousElementSibling).toBe(null);
		});

		it('correctly handles replacing a node with its next sibling', () => {
			const parent = document.appendChild(document.createElement('parent'));
			const element1 = parent.appendChild(document.createElement('child'));
			const element2 = parent.appendChild(document.createElement('child'));
			parent.replaceChild(element2, element1);
			expect(parent.firstElementChild).toBe(element2);
			expect(element2.nextElementSibling).toBe(null);
			expect(element2.previousElementSibling).toBe(null);
		});
	});

	describe('removeChild', () => {
		it('throws if the child is not a child of the parent', () => {
			const element = document.createElement('element');
			expect(() => document.removeChild(element)).toThrow('NotFoundError');
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
				expect(range.startContainer).toBe(parent);
				expect(range.startOffset).toBe(2);
				parent.removeChild(child);
				expect(range.startContainer).toBe(parent);
				expect(range.startOffset).toBe(1);
			});
		});
	});
});
