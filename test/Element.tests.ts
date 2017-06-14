import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Element', () => {
	let document: slimdom.Document;
	let element: slimdom.Element;
	beforeEach(() => {
		document = new slimdom.Document();
		element = document.createElement('root');
	});

	it('has nodeType 1', () => chai.assert.equal(element.nodeType, 1));

	it('is owned by the document', () => chai.assert.equal(element.ownerDocument, document));

	it('initially has no child nodes', () => {
		chai.assert.equal(element.firstChild, null);
		chai.assert.equal(element.lastChild, null);
		chai.assert.deepEqual(element.childNodes, []);
	});

	it('initially has no child elements', () => {
		chai.assert.equal(element.firstElementChild, null);
		chai.assert.equal(element.lastElementChild, null);
		chai.assert.deepEqual(element.children, []);
		chai.assert.equal(element.childElementCount, 0);
	});

	it('initially has no attributes', () => {
		chai.assert(!element.hasAttribute('test'));
		chai.assert.equal(element.getAttribute('test'), null);
		chai.assert.deepEqual(element.attributes, []);
	});

	describe('setting attributes', () => {
		beforeEach(() => {
			element.setAttribute('firstAttribute', 'first');
			element.setAttribute('test', '123');
			element.setAttribute('lastAttribute', 'last');
		});

		it('has the attributes', () => {
			chai.assert(element.hasAttribute('firstAttribute'), 'has attribute firstAttribute');
			chai.assert(element.hasAttribute('test'), 'has attribute test');
			chai.assert(element.hasAttribute('lastAttribute'), 'has attribute lastAttribute');
			chai.assert(!element.hasAttribute('noSuchAttribute'), 'does not have attribute noSuchAttribute');
		});

		it('returns the attribute value', () => {
			chai.assert.equal(element.getAttribute('firstAttribute'), 'first');
			chai.assert.equal(element.getAttribute('test'), '123');
			chai.assert.equal(element.getAttribute('lastAttribute'), 'last');
			chai.assert.equal(element.getAttribute('noSuchAttribute'), null);
		});

		function hasAttributes(attributes: slimdom.Attr[], expected: { name: string; value: string }[]): boolean {
			return (
				attributes.length === expected.length &&
				attributes.every(attr => expected.some(pair => pair.name === attr.name && pair.value === attr.value)) &&
				expected.every(pair => attributes.some(attr => attr.name === pair.name && attr.value === pair.value))
			);
		}

		it('has attributes', () =>
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'lastAttribute', value: 'last' }
				])
			));

		it('can overwrite the attribute', () => {
			element.setAttribute('test', '456');
			chai.assert(element.hasAttribute('test'), 'has the attribute');
			chai.assert.equal(element.getAttribute('test'), '456');
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '456' },
					{ name: 'lastAttribute', value: 'last' }
				])
			);
		});

		it('can remove the attribute', () => {
			element.removeAttribute('test');
			chai.assert(element.hasAttribute('firstAttribute'), 'has attribute firstAttribute');
			chai.assert(!element.hasAttribute('test'), 'does not have attribute test');
			chai.assert(element.hasAttribute('lastAttribute'), 'has attribute lastAttribute');
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'lastAttribute', value: 'last' }
				])
			);
		});

		it('ignores removing non-existent attributes', () => {
			chai.assert(!element.hasAttribute('other'), 'does not have attribute other');
			element.removeAttribute('other');
			chai.assert(!element.hasAttribute('other'), 'does not have attribute other');
			chai.assert(element.hasAttribute('test'), 'has attribute test');
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'lastAttribute', value: 'last' }
				])
			);
		});
	});

	describe('after appending a child element', () => {
		let child: slimdom.Element;
		beforeEach(() => {
			child = document.createElement('child');
			element.appendChild(child);
		});

		it('has child node references', () => {
			chai.assert.equal(element.firstChild, child);
			chai.assert.equal(element.lastChild, child);
			chai.assert.deepEqual(element.childNodes, [child]);
		});

		it('has child element references', () => {
			chai.assert.equal(element.firstElementChild, child);
			chai.assert.equal(element.lastElementChild, child);
			chai.assert.deepEqual(element.children, [child]);
			chai.assert.equal(element.childElementCount, 1);
		});

		describe('after removing the child element', () => {
			beforeEach(() => {
				element.removeChild(child);
			});

			it('has no child nodes', () => {
				chai.assert.equal(element.firstChild, null);
				chai.assert.equal(element.lastChild, null);
				chai.assert.deepEqual(element.childNodes, []);
			});

			it('has no child elements', () => {
				chai.assert.equal(element.firstElementChild, null);
				chai.assert.equal(element.lastElementChild, null);
				chai.assert.deepEqual(element.children, []);
				chai.assert.equal(element.childElementCount, 0);
			});
		});

		describe('after replacing the child element', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.replaceChild(otherChild, child);
			});

			it('has child node references', () => {
				chai.assert.equal(element.firstChild, otherChild);
				chai.assert.equal(element.lastChild, otherChild);
				chai.assert.deepEqual(element.childNodes, [otherChild]);
			});

			it('has child element references', () => {
				chai.assert.equal(element.firstElementChild, otherChild);
				chai.assert.equal(element.lastElementChild, otherChild);
				chai.assert.deepEqual(element.children, [otherChild]);
				chai.assert.equal(element.childElementCount, 1);
			});
		});

		describe('after inserting an element before the child', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.insertBefore(otherChild, child);
			});

			it('has child node references', () => {
				chai.assert.equal(element.firstChild, otherChild);
				chai.assert.equal(element.lastChild, child);
				chai.assert.deepEqual(element.childNodes, [otherChild, child]);
			});

			it('has child element references', () => {
				chai.assert.equal(element.firstElementChild, otherChild);
				chai.assert.equal(element.lastElementChild, child);
				chai.assert.deepEqual(element.children, [otherChild, child]);
				chai.assert.equal(element.childElementCount, 2);
			});

			it('has correct siblings on the children', () => {
				chai.assert.equal(child.nextSibling, null);
				chai.assert.equal(child.previousSibling, otherChild);
				chai.assert.equal(child.nextElementSibling, null);
				chai.assert.equal(child.previousElementSibling, otherChild);

				chai.assert.equal(otherChild.nextSibling, child);
				chai.assert.equal(otherChild.previousSibling, null);
				chai.assert.equal(otherChild.nextElementSibling, child);
				chai.assert.equal(otherChild.previousElementSibling, null);
			});
		});

		describe('after inserting an element after the child', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.appendChild(otherChild);
			});

			it('has child node references', () => {
				chai.assert.equal(element.firstChild, child);
				chai.assert.equal(element.lastChild, otherChild);
				chai.assert.deepEqual(element.childNodes, [child, otherChild]);
			});

			it('has child element references', () => {
				chai.assert.equal(element.firstElementChild, child);
				chai.assert.equal(element.lastElementChild, otherChild);
				chai.assert.deepEqual(element.children, [child, otherChild]);
				chai.assert.equal(element.childElementCount, 2);
			});

			it('has correct siblings on the children', () => {
				chai.assert.equal(child.nextSibling, otherChild);
				chai.assert.equal(child.previousSibling, null);
				chai.assert.equal(child.nextElementSibling, otherChild);
				chai.assert.equal(child.previousElementSibling, null);

				chai.assert.equal(otherChild.nextSibling, null);
				chai.assert.equal(otherChild.previousSibling, child);
				chai.assert.equal(otherChild.nextElementSibling, null);
				chai.assert.equal(otherChild.previousElementSibling, child);
			});
		});

		describe('after inserting the element at the same location', () => {
			beforeEach(() => {
				element.appendChild(child);
			});

			it('has child node references', () => {
				chai.assert.equal(element.firstChild, child);
				chai.assert.equal(element.lastChild, child);
				chai.assert.deepEqual(element.childNodes, [child]);
			});

			it('has child element references', () => {
				chai.assert.equal(element.firstElementChild, child);
				chai.assert.equal(element.lastElementChild, child);
				chai.assert.deepEqual(element.children, [child]);
				chai.assert.equal(element.childElementCount, 1);
			});

			it('has no siblings on child', () => {
				chai.assert.equal(child.nextSibling, null);
				chai.assert.equal(child.previousSibling, null);
				chai.assert.equal(child.nextElementSibling, null);
				chai.assert.equal(child.previousElementSibling, null);
			});
		});
	});

	describe('after appending a processing instruction', () => {
		let processingInstruction: slimdom.ProcessingInstruction;
		beforeEach(() => {
			processingInstruction = document.createProcessingInstruction('test', 'test');
			element.appendChild(processingInstruction);
		});

		it('has child node references', () => {
			chai.assert.equal(element.firstChild, processingInstruction);
			chai.assert.equal(element.lastChild, processingInstruction);
			chai.assert.deepEqual(element.childNodes, [processingInstruction]);
		});

		it('has no child elements', () => {
			chai.assert.equal(element.firstElementChild, null);
			chai.assert.equal(element.lastElementChild, null);
			chai.assert.deepEqual(element.children, []);
			chai.assert.equal(element.childElementCount, 0);
		});

		describe('after replacing with an element', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.replaceChild(otherChild, element.firstChild!);
			});

			it('has child node references', () => {
				chai.assert.equal(element.firstChild, otherChild);
				chai.assert.equal(element.lastChild, otherChild);
				chai.assert.deepEqual(element.childNodes, [otherChild]);
			});

			it('has child element references', () => {
				chai.assert.equal(element.firstElementChild, otherChild);
				chai.assert.equal(element.lastElementChild, otherChild);
				chai.assert.deepEqual(element.children, [otherChild]);
				chai.assert.equal(element.childElementCount, 1);
			});
		});
	});

	describe('normalization', () => {
		it('removes empty text nodes', () => {
			let textNode = element.appendChild(document.createTextNode(''));
			element.normalize();
			chai.assert.equal(textNode.parentNode, null);
		});

		it('combines adjacent text nodes', () => {
			element.appendChild(document.createTextNode('test'));
			element.appendChild(document.createTextNode('123'));
			element.appendChild(document.createTextNode('abc'));
			chai.assert.equal(element.childNodes.length, 3);
			element.normalize();
			chai.assert.equal(element.childNodes.length, 1);
			chai.assert.equal((element.firstChild as slimdom.Text).nodeValue, 'test123abc');
			chai.assert.equal((element.firstChild as slimdom.Text).data, 'test123abc');
		});
	});
});
