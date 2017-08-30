import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Element', () => {
	let document: slimdom.Document;
	let element: slimdom.Element;
	beforeEach(() => {
		document = new slimdom.Document();
		element = document.createElementNS('http://www.w3.org/2000/svg', 'svg:g');
	});

	it('can be created using Document#createElement', () => {
		const element = document.createElement('test');
		chai.assert.equal(element.nodeType, 1);
		chai.assert.equal(element.nodeName, 'test');
		chai.assert.equal(element.nodeValue, null);
		chai.assert.equal(element.ownerDocument, document);
		chai.assert.equal(element.namespaceURI, null);
		chai.assert.equal(element.localName, 'test');
		chai.assert.equal(element.prefix, null);
	});

	it('can be created using Document#createElementNS', () => {
		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		chai.assert.equal(element.nodeType, 1);
		chai.assert.equal(element.nodeName, 'prf:test');
		chai.assert.equal(element.nodeValue, null);
		chai.assert.equal(element.ownerDocument, document);
		chai.assert.equal(element.namespaceURI, 'http://www.example.com/ns');
		chai.assert.equal(element.localName, 'test');
		chai.assert.equal(element.prefix, 'prf');
	});

	it('can not change its nodeValue', () => {
		element.nodeValue = 'test';
		chai.assert.equal(element.nodeValue, null);
	});

	it('can lookup its own prefix or namespace', () => {
		chai.assert.equal(element.lookupPrefix(null), null);
		chai.assert.equal(element.lookupNamespaceURI(''), null);
		chai.assert.equal(element.lookupNamespaceURI('svg'), 'http://www.w3.org/2000/svg');
		chai.assert.equal(element.lookupPrefix('http://www.w3.org/2000/svg'), 'svg');
	});

	it('can lookup a prefix or namespace declared on itself', () => {
		element.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/2000/svg');
		element.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:prf', 'http://www.example.com/ns');
		chai.assert.equal(element.lookupPrefix(null), null);
		chai.assert.equal(element.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(element.lookupPrefix('http://www.example.com/ns'), 'prf');
		chai.assert.equal(element.lookupNamespaceURI(null), 'http://www.w3.org/2000/svg');
		chai.assert.equal((element as any).lookupNamespaceURI(undefined), 'http://www.w3.org/2000/svg');
		chai.assert.equal(element.lookupPrefix('http://www.w3.org/2000/svg'), 'svg');
	});

	it('can lookup a prefix or namespace declared on an ancestor', () => {
		const parent = document.createElement('svg');
		parent.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', '');
		parent.appendChild(element);
		parent.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:prf', 'http://www.example.com/ns');
		chai.assert.equal(element.lookupPrefix(null), null);
		chai.assert.equal(element.lookupNamespaceURI(null), null);
		chai.assert.equal(element.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(element.lookupPrefix('http://www.example.com/ns'), 'prf');
		chai.assert.equal(element.lookupPrefix('unknown'), null);
		chai.assert.equal(element.lookupNamespaceURI('unknown'), null);
	});

	it('can check the default namespace', () => {
		const element = document.createElementNS('http://www.w3.org/1999/xhtml', 'html');
		chai.assert(!element.isDefaultNamespace('http://www.w3.org/2000/svg'));
		chai.assert(element.isDefaultNamespace('http://www.w3.org/1999/xhtml'));
		chai.assert(document.createElement('test').isDefaultNamespace(''));
	});

	it('initially has no childNodes', () => {
		chai.assert.equal(element.firstChild, null);
		chai.assert.equal(element.lastChild, null);
		chai.assert(!element.hasChildNodes());
		chai.assert.deepEqual(element.childNodes, []);
	});

	it('initially has no children', () => {
		chai.assert.equal(element.firstElementChild, null);
		chai.assert.equal(element.lastElementChild, null);
		chai.assert.deepEqual(element.children, []);
		chai.assert.equal(element.childElementCount, 0);
	});

	it('initially has no attributes', () => {
		chai.assert.equal(element.hasAttributes(), false);
		chai.assert.deepEqual(Array.from(element.attributes), []);
	});

	describe('setting attributes', () => {
		beforeEach(() => {
			element.setAttribute('firstAttribute', 'first');
			element.setAttribute('test', '123');
			element.setAttributeNS('http://www.example.com/ns', 'prf:lastAttribute', 'last');
		});

		it('throws if the attribute name is invalid', () => {
			chai.assert.throws(() => element.setAttribute(String.fromCodePoint(0x200b), 'value'));
		});

		it('has the attributes', () => {
			chai.assert(element.hasAttributes());
			chai.assert(element.hasAttribute('firstAttribute'), 'has attribute firstAttribute');
			chai.assert(element.hasAttributeNS(null, 'firstAttribute'), 'has attribute firstAttribute');
			chai.assert(element.hasAttribute('test'), 'has attribute test');
			chai.assert(element.hasAttributeNS(null, 'test'), 'has attribute test');
			chai.assert(element.hasAttribute('prf:lastAttribute'), 'has attribute lastAttribute');
			chai.assert(
				element.hasAttributeNS('http://www.example.com/ns', 'lastAttribute'),
				'has attribute lastAttribute'
			);
			chai.assert(!element.hasAttribute('noSuchAttribute'), 'does not have attribute noSuchAttribute');
			chai.assert(
				!element.hasAttributeNS(null, 'prf:lastAttribute'),
				'does not have attribute prf:lastAttribute without namespace'
			);
		});

		it('returns the attribute value', () => {
			chai.assert.equal(element.getAttribute('firstAttribute'), 'first');
			chai.assert.equal(element.getAttributeNS('', 'firstAttribute'), 'first');
			chai.assert.equal(element.getAttribute('test'), '123');
			chai.assert.equal(element.getAttributeNS(null, 'test'), '123');
			chai.assert.equal(element.getAttribute('prf:lastAttribute'), 'last');
			chai.assert.equal(element.getAttributeNS('http://www.example.com/ns', 'lastAttribute'), 'last');
			chai.assert.equal(element.getAttribute('noSuchAttribute'), null);
			chai.assert.equal(element.getAttributeNS(null, 'prf:noSuchAttribute'), null);
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
					{ name: 'prf:lastAttribute', value: 'last' }
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
					{ name: 'prf:lastAttribute', value: 'last' }
				])
			);

			element.setAttributeNS('http://www.example.com/ns', 'prf:lastAttribute', 'new value');
			chai.assert(element.hasAttributeNS('http://www.example.com/ns', 'lastAttribute'), 'has the attribute');
			chai.assert.equal(element.getAttributeNS('http://www.example.com/ns', 'lastAttribute'), 'new value');
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '456' },
					{ name: 'prf:lastAttribute', value: 'new value' }
				])
			);
		});

		it('can remove the attribute', () => {
			element.removeAttribute('test');
			chai.assert(element.hasAttribute('firstAttribute'), 'has attribute firstAttribute');
			chai.assert(!element.hasAttribute('test'), 'does not have attribute test');
			chai.assert(element.hasAttribute('prf:lastAttribute'), 'has attribute lastAttribute');
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'prf:lastAttribute', value: 'last' }
				])
			);
			element.removeAttributeNS('http://www.example.com/ns', 'lastAttribute');
			chai.assert(hasAttributes(element.attributes, [{ name: 'firstAttribute', value: 'first' }]));
			// Removing something that doesn't exist does nothing
			element.removeAttributeNS('http://www.example.com/ns', 'missingAttribute');
			chai.assert(hasAttributes(element.attributes, [{ name: 'firstAttribute', value: 'first' }]));
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
					{ name: 'prf:lastAttribute', value: 'last' }
				])
			);
		});

		it('can set attributes using their nodes', () => {
			const attr = document.createAttribute('attr');
			attr.value = 'some value';
			chai.assert.equal(element.setAttributeNodeNS(attr), null);
			const namespacedAttr = document.createAttributeNS('http://www.example.com/ns', 'prf:aaa');
			element.setAttributeNode(namespacedAttr);
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'prf:lastAttribute', value: 'last' },
					{ name: 'attr', value: 'some value' },
					{ name: 'prf:aaa', value: '' }
				])
			);

			// It returns the previous attribute node
			chai.assert.equal(element.setAttributeNode(attr), attr);
			chai.assert.equal(element.setAttributeNode(document.createAttribute('attr')), attr);

			const otherElement = document.createElement('test');
			chai.assert.throws(() => otherElement.setAttributeNode(namespacedAttr), 'InUseAttributeError');
		});

		it('can remove attributes using their nodes', () => {
			const attr = element.removeAttributeNode(element.attributes[1]);
			chai.assert(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'prf:lastAttribute', value: 'last' }
				])
			);
			chai.assert.throws(() => element.removeAttributeNode(attr), 'NotFoundError');
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

		it('recursively normalizes the entire subtree', () => {
			element.appendChild(document.createTextNode('test'));
			element.appendChild(document.createTextNode('123'));
			element.appendChild(document.createTextNode('abc'));
			const child = element.appendChild(document.createElement('child'));
			child.appendChild(document.createTextNode('child'));
			child.appendChild(document.createTextNode(''));
			child.appendChild(document.createTextNode('content'));
			const otherChild = element.appendChild(document.createElement('empty'));
			otherChild.appendChild(document.createTextNode('text'));
			otherChild.appendChild(document.createTextNode(''));
			otherChild.appendChild(document.createTextNode(''));
			element.normalize();
			chai.assert.equal(element.childNodes.length, 3);
			chai.assert.equal((element.firstChild as slimdom.Text).nodeValue, 'test123abc');
			chai.assert.equal(child.childNodes.length, 1);
			chai.assert.equal((child.firstChild as slimdom.Text).data, 'childcontent');
			chai.assert.equal(otherChild.childNodes.length, 1);
			chai.assert.equal((otherChild.firstChild as slimdom.Text).data, 'text');
		});

		it('adjusts ranges appropriately', () => {
			let range1 = new slimdom.Range();
			let range2 = new slimdom.Range();
			element.appendChild(document.createTextNode('test'));
			element.appendChild(document.createTextNode('123'));
			element.appendChild(document.createTextNode('abc'));
			range1.setStart(element.childNodes[1], 0);
			range1.setEnd(element, 2);
			range2.setStart(element, 1);
			range2.setEnd(element.lastChild!, 0);
			element.normalize();
			chai.assert.equal(range1.startContainer, element.firstChild);
			chai.assert.equal(range1.startOffset, 4);
			chai.assert.equal(range1.endContainer, element.firstChild);
			chai.assert.equal(range1.endOffset, 7);
			chai.assert.equal(range2.startContainer, element.firstChild);
			chai.assert.equal(range2.startOffset, 4);
			chai.assert.equal(range2.endContainer, element.firstChild);
			chai.assert.equal(range2.endOffset, 7);
			range1.detach();
			range2.detach();
		});
	});

	describe('.cloneNode', () => {
		beforeEach(() => {
			document.appendChild(element);
			element.setAttributeNS('http://www.example.com/ns', 'test', 'value');
			element.appendChild(document.createElement('child'));
		});

		it('can be cloned (shallow)', () => {
			const copy = element.cloneNode() as slimdom.Element;

			chai.assert.equal(copy.nodeType, 1);
			chai.assert.equal(copy.nodeName, 'svg:g');
			chai.assert.equal(copy.nodeValue, null);
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.equal(copy.namespaceURI, 'http://www.w3.org/2000/svg');
			chai.assert.equal(copy.localName, 'g');
			chai.assert.equal(copy.prefix, 'svg');
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.equal(copy.firstChild, null);
			chai.assert.notEqual(copy, element);

			chai.assert.equal(copy.getAttributeNS('http://www.example.com/ns', 'test'), 'value');
		});

		it('can be cloned (deep)', () => {
			const copy = element.cloneNode(true) as slimdom.Element;

			chai.assert.equal(copy.nodeType, 1);
			chai.assert.equal(copy.nodeName, 'svg:g');
			chai.assert.equal(copy.nodeValue, null);
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.equal(copy.namespaceURI, 'http://www.w3.org/2000/svg');
			chai.assert.equal(copy.localName, 'g');
			chai.assert.equal(copy.prefix, 'svg');
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.notEqual(copy, element);

			chai.assert.equal(copy.getAttributeNS('http://www.example.com/ns', 'test'), 'value');

			const child = copy.firstChild!;
			chai.assert.equal(child.nodeName, 'child');
			chai.assert.notEqual(child, element.firstChild);
		});
	});
});
