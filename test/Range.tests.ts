import * as slimdom from '../src/index';

describe('Range', () => {
	let document: slimdom.Document;
	let element: slimdom.Element;
	let text: slimdom.Text;
	let range: slimdom.Range;
	beforeEach(() => {
		document = new slimdom.Document();
		element = document.appendChild(document.createElement('root'));
		text = element.appendChild(document.createTextNode('text'));
		range = document.createRange();
	});

	it('is initially collapsed at the start of the document', () => {
		expect(range.collapsed).toBe(true);
		expect(range.startContainer).toBe(document);
		expect(range.endContainer).toBe(document);
		expect(range.startOffset).toBe(0);
		expect(range.endOffset).toBe(0);
		expect(range.commonAncestorContainer).toBe(document);
	});

	describe('setting positions', () => {
		it('start after end moves end', () => {
			range.setStart(element, 0);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(0);
			expect(range.collapsed).toBe(true);
			expect(range.commonAncestorContainer).toBe(element);
		});

		it('end after start is ok', () => {
			// Move end forward
			range.setEnd(element, 1);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(1);
			expect(range.startContainer).toBe(document);
			expect(range.startOffset).toBe(0);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(document);

			// Move end back
			range.setEnd(element, 0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(0);
			expect(range.startContainer).toBe(document);
			expect(range.startOffset).toBe(0);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(document);
		});

		it('end before start moves start', () => {
			range.setStart(element, 1);
			range.setEnd(element, 0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(0);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
			expect(range.collapsed).toBe(true);
			expect(range.commonAncestorContainer).toBe(element);
		});

		it('start before end is ok', () => {
			range.setEnd(document, 1);

			// Move start forward
			range.setStart(element, 1);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(1);
			expect(range.endContainer).toBe(document);
			expect(range.endOffset).toBe(1);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(document);

			// Move start back
			range.setStart(element, 0);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(document);
			expect(range.endOffset).toBe(1);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(document);
		});

		it('throws if the container is a doctype', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			expect(() => range.setStart(doctype, 0)).toThrow('InvalidNodeTypeError');
			expect(() => range.setEnd(doctype, 0)).toThrow('InvalidNodeTypeError');
		});

		it('throws if the index is beyond the length of the node', () => {
			expect(() => range.setStart(text, 5)).toThrow('IndexSizeError');
			expect(() => range.setEnd(text, -1)).toThrow('IndexSizeError');
		});

		it('can set its endpoints relative to a node', () => {
			range.setStartBefore(element);
			range.setEndBefore(text);
			expect(range.startContainer).toBe(document);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(0);
			range.setStartAfter(text);
			range.setEndAfter(element);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(1);
			expect(range.endContainer).toBe(document);
			expect(range.endOffset).toBe(1);
		});

		it('can not set an endpoint before or after a node without a parent', () => {
			const detached = document.createElement('noparent');
			expect(() => range.setStartBefore(detached)).toThrow('InvalidNodeTypeError');
			expect(() => range.setStartAfter(detached)).toThrow('InvalidNodeTypeError');
			expect(() => range.setEndBefore(detached)).toThrow('InvalidNodeTypeError');
			expect(() => range.setEndAfter(detached)).toThrow('InvalidNodeTypeError');
		});

		it('can selectNode', () => {
			range.selectNode(element);
			expect(range.startContainer).toBe(document);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(document);
			expect(range.endOffset).toBe(1);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(document);
		});

		it('can not selectNode a node without a parent', () => {
			const detached = document.createElement('noparent');
			expect(() => range.selectNode(detached)).toThrow('InvalidNodeTypeError');
		});

		it('can selectNodeContents', () => {
			range.selectNodeContents(element);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(1);
			expect(range.collapsed).toBe(false);
			expect(range.commonAncestorContainer).toBe(element);
		});

		it('can not selectNodeContents a doctype', () => {
			const doctype = document.implementation.createDocumentType('html', '', '');
			expect(() => range.selectNodeContents(doctype)).toThrow('InvalidNodeTypeError');
		});

		it('can be collapsed to start', () => {
			range.selectNodeContents(element);
			range.collapse(true);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(0);
			expect(range.collapsed).toBe(true);
		});

		it('can be collapsed to end', () => {
			range.selectNodeContents(element);
			range.collapse();
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(1);
			expect(range.endContainer).toBe(element);
			expect(range.endOffset).toBe(1);
			expect(range.collapsed).toBe(true);
		});

		it('can compute the common ancestor', () => {
			const child = element
				.appendChild(document.createElement('child'))
				.appendChild(document.createTextNode('test'));
			range.setStart(text, 0);
			range.setEnd(child, 0);
			expect(range.commonAncestorContainer).toBe(element);
		});
	});

	describe('deleteContents', () => {
		let element: slimdom.Element;
		let before: slimdom.Text;
		let inside: slimdom.Text;
		let after: slimdom.Text;
		beforeEach(() => {
			element = document.createElement('element');
			before = element.appendChild(document.createTextNode('before'));
			inside = element
				.appendChild(document.createElement('child'))
				.appendChild(document.createTextNode('inside'));
			after = element.appendChild(document.createTextNode('after'));
			document.documentElement!.replaceWith(element);
		});

		it('can remove the documentElement', () => {
			range.selectNode(element);
			range.deleteContents();
			expect(document.documentElement).toBe(null);
			expect(range.startContainer).toBe(document);
			expect(range.startOffset).toBe(0);
		});

		it('can remove the contents of the documentElement', () => {
			range.selectNodeContents(element);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element/>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
		});

		it('can remove from text node to end', () => {
			range.setStart(inside, 1);
			range.setEnd(element, 3);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element>before<child>i</child></element>'
			);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(2);
		});

		it('can remove within a text node', () => {
			range.setStart(inside, 1);
			range.setEnd(inside, 3);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element>before<child>iide</child>after</element>'
			);
			expect(range.startContainer).toBe(inside);
			expect(range.startOffset).toBe(1);
		});

		it('can remove across multiple text nodes', () => {
			range.setStart(before, 2);
			range.setEnd(inside, 3);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element>be<child>ide</child>after</element>'
			);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(1);
		});

		it('can remove across multiple text nodes and elements', () => {
			range.setStart(before, 2);
			range.setEnd(after, 2);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element>beter</element>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(1);
		});

		it('can remove across multiple nodes from element containers', () => {
			range.setStart(element, 0);
			range.setEnd(element, 2);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element>after</element>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
		});

		it('can remove across multiple nodes from a single element container', () => {
			range.setStart(element, 0);
			range.setEnd(element, 2);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element>after</element>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
		});

		it('can remove across multiple nodes from multiple element containers (end at end)', () => {
			range.setStart(element, 0);
			range.setEnd(inside.parentNode!, 1);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element><child/>after</element>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
		});

		it('can remove across multiple nodes from multiple element containers (end at begin)', () => {
			range.setStart(element, 0);
			range.setEnd(inside.parentNode!, 0);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element><child>inside</child>after</element>'
			);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(0);
		});

		it('can remove across multiple nodes from multiple element containers (start at begin)', () => {
			range.setStart(inside.parentNode!, 0);
			range.setEnd(element, 3);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe('<element>before<child/></element>');
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(2);
		});

		it('can remove across multiple nodes from multiple element containers (start at end)', () => {
			range.setStart(inside.parentNode!, 1);
			range.setEnd(element, 3);
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element>before<child>inside</child></element>'
			);
			expect(range.startContainer).toBe(element);
			expect(range.startOffset).toBe(2);
		});

		it('does not remove anything for a collapsed range', () => {
			range.setStart(inside.parentNode!, 1);
			range.collapse();
			range.deleteContents();
			expect(document.documentElement?.outerHTML).toBe(
				'<element>before<child>inside</child>after</element>'
			);
			expect(range.startContainer).toBe(element.firstElementChild);
			expect(range.startOffset).toBe(1);
		});
	});

	it('can be cloned', () => {
		range.selectNodeContents(element);
		const clone = range.cloneRange();
		range.setStart(document, 0);
		range.collapse(true);
		expect(clone.startContainer).toBe(element);
		expect(clone.startOffset).toBe(0);
		expect(clone.endContainer).toBe(element);
		expect(clone.endOffset).toBe(1);
		expect(clone.collapsed).toBe(false);
	});

	describe('comparing points', () => {
		it('can compare boundary points agains another range', () => {
			const range2 = document.createRange();
			range.setStart(element, 0);
			range.setEnd(text, 2);
			range2.setStart(text, 2);
			range2.setEnd(document, 1);
			expect(() => range.compareBoundaryPoints(98, range2)).toThrow('NotSupportedError');

			expect(range.compareBoundaryPoints(slimdom.Range.START_TO_START, range2)).toBe(-1);
			expect(range.compareBoundaryPoints(slimdom.Range.START_TO_END, range2)).toBe(0);
			expect(range2.compareBoundaryPoints(slimdom.Range.END_TO_END, range)).toBe(1);
			expect(range.compareBoundaryPoints(slimdom.Range.END_TO_START, range2)).toBe(-1);
			range2.detach();
		});

		it('can not compare boundary points if the ranges are in different documents', () => {
			const range2 = new slimdom.Range();
			expect(() => range.compareBoundaryPoints(slimdom.Range.START_TO_START, range2)).toThrow(
				'WrongDocumentError'
			);
			range2.detach();
			range2.detach();
		});

		it('can compare a given point to the range', () => {
			range.setStart(element, 0);
			range.setEnd(element, 1);

			expect(range.isPointInRange(text, 1)).toBe(true);
			expect(range.isPointInRange(document, 1)).toBe(false);

			const range2 = new slimdom.Range();
			const doctype = document.implementation.createDocumentType('html', '', '');
			document.insertBefore(doctype, document.documentElement);

			expect(range2.isPointInRange(element, 0)).toBe(false);
			expect(() => range.isPointInRange(doctype, 0)).toThrow('InvalidNodeTypeError');
			expect(() => range.isPointInRange(element, 3)).toThrow('IndexSizeError');

			expect(range.comparePoint(element, 0)).toBe(0);
			expect(range.comparePoint(document, 1)).toBe(-1);
			expect(range.comparePoint(document, 2)).toBe(1);

			expect(() => range2.comparePoint(element, 0)).toThrow('WrongDocumentError');
			expect(() => range.comparePoint(doctype, 0)).toThrow('InvalidNodeTypeError');
			expect(() => range.comparePoint(element, 3)).toThrow('IndexSizeError');
		});

		it('can compare a given node to the range', () => {
			range.setStart(text, 0);
			range.setEnd(element, 1);
			const child = element.appendChild(document.createElement('child'));

			expect(range.intersectsNode(text)).toBe(true);
			expect(range.intersectsNode(element)).toBe(true);
			expect(range.intersectsNode(document)).toBe(true);
			expect(range.intersectsNode(child)).toBe(false);

			const range2 = new slimdom.Range();
			expect(range2.intersectsNode(document)).toBe(false);
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
				expect(range.startContainer).toBe(element);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(element);
				expect(range.endOffset).toBe(2);
			});

			it('moves positions beyond a remove', () => {
				element.removeChild(element.firstChild!);
				expect(range.startContainer).toBe(element);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(element);
				expect(range.endOffset).toBe(0);
			});
		});

		describe('in text', () => {
			beforeEach(() => {
				range.setStart(text, 1);
				range.setEnd(text, 3);
			});

			it('moves positions beyond an insert', () => {
				text.insertData(0, '123');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(4);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(6);
			});

			it('moves positions inside and beyond a delete', () => {
				text.deleteData(0, 2);
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(1);
			});

			it('moves to the start of a replace when inside', () => {
				text.replaceData(1, 2, '123');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(1);
			});

			it('moves positions beyond a replace when the new text is shorter', () => {
				text.replaceData(0, 2, '1');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(2);
			});

			it('moves positions beyond a replace when the new text is longer', () => {
				text.replaceData(0, 2, '123');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(4);
			});

			it('ignores positions before or on an insert', () => {
				text.insertData(3, '123');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(3);
			});

			it('ignores positions before or at the start of a delete', () => {
				text.deleteData(3, 1);
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(3);
			});

			it('ignores positions before or at the start of a replace', () => {
				text.replaceData(3, 1, '123');
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(3);
			});

			it('moves with text splits', () => {
				const secondHalf = text.splitText(2);
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(secondHalf);
				expect(range.endOffset).toBe(1);
			});

			it('does not move with splits of detached text nodes', () => {
				element.removeChild(text);
				range.setStart(text, 1);
				range.setEnd(text, 2);
				const secondHalf = text.splitText(2);
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(1);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(2);
			});

			it('moves with text node deletes during normalization', () => {
				text.deleteData(0, 4);
				element.normalize();
				expect(range.startContainer).toBe(element);
				expect(range.startOffset).toBe(0);
				expect(range.endContainer).toBe(element);
				expect(range.endOffset).toBe(0);
			});

			it('moves with text node merges during normalization', () => {
				const otherText = element.appendChild(document.createTextNode('more'));
				range.setStartBefore(otherText);
				range.setEnd(otherText, 2);
				element.normalize();
				expect(range.startContainer).toBe(text);
				expect(range.startOffset).toBe(4);
				expect(range.endContainer).toBe(text);
				expect(range.endOffset).toBe(6);
			});
		});
	});

	describe('WeakRef', () => {
		describe('fallback for older environments', () => {
			let oldWeakRef: any;
			beforeAll(() => {
				oldWeakRef = (global as any).WeakRef;
				delete (global as any).WeakRef;
			});
			afterAll(() => {
				(global as any).WeakRef = oldWeakRef;
			});

			it('still works in older environments that do not support WeakRef', () => {
				range.selectNode(element);
				document.removeChild(element);
				expect(range.startOffset).toBe(0);
				expect(range.endOffset).toBe(0);
				range.detach();
			});
		});

		describe('automatic cleanup', () => {
			// We can't force GC, so let's do the next best thing and stub WeakRef instead so we can
			// at least test the code that handles the deref returning undefined
			let oldWeakRef: any;
			let isFakeGarbageCollected: boolean;
			beforeAll(() => {
				oldWeakRef = (global as any).WeakRef;
				(global as any).WeakRef = class StubWeakRef<T> {
					constructor(private target: T) {}
					deref(): T | undefined {
						if (isFakeGarbageCollected) {
							return undefined;
						}
						return this.target;
					}
				};
			});
			afterAll(() => {
				(global as any).WeakRef = oldWeakRef;
			});

			beforeEach(() => {
				isFakeGarbageCollected = false;
			});

			it('uses WeakRef if available to automatically clean up', () => {
				range.selectNode(element);
				isFakeGarbageCollected = true;
				document.removeChild(element);
				// Range should not have been updated because our fake WeakRef said it was GC'ed
				expect(range.startOffset).toBe(0);
				expect(range.endOffset).toBe(1);
			});
		});
	});

	describe('stringifier', () => {
		it('produces the text content of the range', () => {
			const element = document.createElement('element');
			const before = element.appendChild(document.createTextNode('before'));
			const inside = element
				.appendChild(document.createElement('child'))
				.appendChild(document.createTextNode('inside'));
			const after = element.appendChild(document.createTextNode('after'));
			document.documentElement!.replaceWith(element);

			range.selectNode(element);
			expect(range.toString()).toBe('beforeinsideafter');
			range.selectNodeContents(element);
			expect(range.toString()).toBe('beforeinsideafter');
			range.setStart(inside, 1);
			expect(range.toString()).toBe('nsideafter');
			range.setEnd(inside, 3);
			expect(range.toString()).toBe('ns');
			range.setStart(before, 2);
			expect(range.toString()).toBe('foreins');
			range.setEnd(after, 2);
			expect(range.toString()).toBe('foreinsideaf');
			range.setStart(element, 0);
			range.setEnd(element, 2);
			expect(range.toString()).toBe('beforeinside');
			range.setEnd(inside.parentNode!, 1);
			expect(range.toString()).toBe('beforeinside');
			range.setEnd(inside.parentNode!, 0);
			expect(range.toString()).toBe('before');
			range.setStart(inside.parentNode!, 0);
			range.setEnd(element, 3);
			expect(range.toString()).toBe('insideafter');
			range.setStart(inside.parentNode!, 1);
			expect(range.toString()).toBe('after');
			range.collapse();
			expect(range.toString()).toBe('');
		});
	});
});
