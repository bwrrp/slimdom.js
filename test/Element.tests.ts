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
		expect(element.nodeType).toBe(1);
		expect(element.nodeName).toBe('test');
		expect(element.nodeValue).toBe(null);
		expect(element.ownerDocument).toBe(document);
		expect(element.namespaceURI).toBe(null);
		expect(element.localName).toBe('test');
		expect(element.prefix).toBe(null);
	});

	it('can be created using Document#createElementNS', () => {
		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		expect(element.nodeType).toBe(1);
		expect(element.nodeName).toBe('prf:test');
		expect(element.nodeValue).toBe(null);
		expect(element.ownerDocument).toBe(document);
		expect(element.namespaceURI).toBe('http://www.example.com/ns');
		expect(element.localName).toBe('test');
		expect(element.prefix).toBe('prf');
	});

	it('can not change its nodeValue', () => {
		element.nodeValue = 'test';
		expect(element.nodeValue).toBe(null);
	});

	it('can change its textContent, replacing its existing children', () => {
		element
			.appendChild(document.createElement('oldChild'))
			.appendChild(document.createTextNode('old'));
		element.appendChild(document.createCDATASection('text'));
		expect(element.textContent).toBe('oldtext');

		element.textContent = 'test';
		expect(element.textContent).toBe('test');
		expect(element.childNodes.length).toBe(1);
		expect(element.firstChild!.nodeType).toBe(3);

		element.textContent = null;
		expect(element.textContent).toBe('');
		expect(element.childNodes.length).toBe(0);
	});

	it('can lookup its own prefix or namespace', () => {
		expect(element.lookupPrefix(null)).toBe(null);
		expect(element.lookupNamespaceURI('')).toBe(null);
		expect(element.lookupNamespaceURI('svg')).toBe('http://www.w3.org/2000/svg');
		expect(element.lookupPrefix('http://www.w3.org/2000/svg')).toBe('svg');
	});

	it('can lookup a prefix or namespace declared on itself', () => {
		element.setAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'xmlns',
			'http://www.w3.org/2000/svg'
		);
		element.setAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'xmlns:prf',
			'http://www.example.com/ns'
		);
		expect(element.lookupPrefix(null)).toBe(null);
		expect(element.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(element.lookupPrefix('http://www.example.com/ns')).toBe('prf');
		expect(element.lookupNamespaceURI(null)).toBe('http://www.w3.org/2000/svg');
		expect((element as any).lookupNamespaceURI(undefined)).toBe('http://www.w3.org/2000/svg');
		expect(element.lookupPrefix('http://www.w3.org/2000/svg')).toBe('svg');
	});

	it('can lookup a prefix or namespace declared on an ancestor', () => {
		const parent = document.createElement('svg');
		parent.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', '');
		parent.appendChild(element);
		parent.setAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'xmlns:prf',
			'http://www.example.com/ns'
		);
		expect(element.lookupPrefix(null)).toBe(null);
		expect(element.lookupNamespaceURI(null)).toBe(null);
		expect(element.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(element.lookupPrefix('http://www.example.com/ns')).toBe('prf');
		expect(element.lookupPrefix('unknown')).toBe(null);
		expect(element.lookupNamespaceURI('unknown')).toBe(null);
	});

	it('can check the default namespace', () => {
		const element = document.createElementNS('http://www.w3.org/1999/xhtml', 'html');
		expect(element.isDefaultNamespace('http://www.w3.org/2000/svg')).toBe(false);
		expect(element.isDefaultNamespace('http://www.w3.org/1999/xhtml')).toBe(true);
		expect(document.createElement('test').isDefaultNamespace('')).toBe(true);
	});

	it('initially has no childNodes', () => {
		expect(element.firstChild).toBe(null);
		expect(element.lastChild).toBe(null);
		expect(element.hasChildNodes()).toBe(false);
		expect(element.childNodes).toEqual([]);
	});

	it('initially has no children', () => {
		expect(element.firstElementChild).toBe(null);
		expect(element.lastElementChild).toBe(null);
		expect(element.children).toEqual([]);
		expect(element.childElementCount).toBe(0);
	});

	it('initially has no attributes', () => {
		expect(element.hasAttributes()).toBe(false);
		expect(Array.from(element.attributes)).toEqual([]);
	});

	describe('setting attributes', () => {
		beforeEach(() => {
			element.setAttribute('firstAttribute', 'first');
			element.setAttribute('test', '123');
			element.setAttributeNS('http://www.example.com/ns', 'prf:lastAttribute', 'last');
		});

		it('throws if the attribute name is invalid', () => {
			expect(() => element.setAttribute(String.fromCodePoint(0x200b), 'value')).toThrow(
				'InvalidCharacterError'
			);
		});

		it('has the attributes', () => {
			expect(element.hasAttributes()).toBe(true);
			expect(element.hasAttribute('firstAttribute')).toBe(true);
			expect(element.hasAttributeNS(null, 'firstAttribute')).toBe(true);
			expect(element.hasAttribute('test')).toBe(true);
			expect(element.hasAttributeNS(null, 'test')).toBe(true);
			expect(element.hasAttribute('prf:lastAttribute')).toBe(true);
			expect(element.hasAttributeNS('http://www.example.com/ns', 'lastAttribute')).toBe(true);
			expect(element.hasAttribute('noSuchAttribute')).toBe(false);
			expect(element.hasAttributeNS(null, 'prf:lastAttribute')).toBe(false);
		});

		it('returns the attribute value', () => {
			expect(element.getAttribute('firstAttribute')).toBe('first');
			expect(element.getAttributeNS('', 'firstAttribute')).toBe('first');
			expect(element.getAttribute('test')).toBe('123');
			expect(element.getAttributeNS(null, 'test')).toBe('123');
			expect(element.getAttribute('prf:lastAttribute')).toBe('last');
			expect(element.getAttributeNS('http://www.example.com/ns', 'lastAttribute')).toBe(
				'last'
			);
			expect(element.getAttribute('noSuchAttribute')).toBe(null);
			expect(element.getAttributeNS(null, 'prf:noSuchAttribute')).toBe(null);
		});

		function hasAttributes(
			attributes: slimdom.Attr[],
			expected: { name: string; value: string }[]
		): boolean {
			return (
				attributes.length === expected.length &&
				attributes.every((attr) =>
					expected.some((pair) => pair.name === attr.name && pair.value === attr.value)
				) &&
				expected.every((pair) =>
					attributes.some((attr) => attr.name === pair.name && attr.value === pair.value)
				)
			);
		}

		it('has attributes', () => {
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'prf:lastAttribute', value: 'last' },
				])
			).toBe(true);
		});

		it('can overwrite the attribute', () => {
			element.setAttribute('test', '456');
			expect(element.hasAttribute('test')).toBe(true);
			expect(element.getAttribute('test')).toBe('456');
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '456' },
					{ name: 'prf:lastAttribute', value: 'last' },
				])
			).toBe(true);

			element.setAttributeNS('http://www.example.com/ns', 'prf:lastAttribute', 'new value');
			expect(element.hasAttributeNS('http://www.example.com/ns', 'lastAttribute')).toBe(true);
			expect(element.getAttributeNS('http://www.example.com/ns', 'lastAttribute')).toBe(
				'new value'
			);
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '456' },
					{ name: 'prf:lastAttribute', value: 'new value' },
				])
			).toBe(true);
		});

		it('can remove the attribute', () => {
			element.removeAttribute('test');
			expect(element.hasAttribute('firstAttribute')).toBe(true);
			expect(element.hasAttribute('test')).toBe(false);
			expect(element.hasAttribute('prf:lastAttribute')).toBe(true);
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'prf:lastAttribute', value: 'last' },
				])
			).toBe(true);
			element.removeAttributeNS('http://www.example.com/ns', 'lastAttribute');
			expect(
				hasAttributes(element.attributes, [{ name: 'firstAttribute', value: 'first' }])
			).toBe(true);
			// Removing something that doesn't exist does nothing
			element.removeAttributeNS('http://www.example.com/ns', 'missingAttribute');
			expect(
				hasAttributes(element.attributes, [{ name: 'firstAttribute', value: 'first' }])
			).toBe(true);
		});

		it('ignores removing non-existent attributes', () => {
			expect(element.hasAttribute('other')).toBe(false);
			element.removeAttribute('other');
			expect(element.hasAttribute('other')).toBe(false);
			expect(element.hasAttribute('test')).toBe(true);
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'prf:lastAttribute', value: 'last' },
				])
			).toBe(true);
		});

		it('can toggle an attribute', () => {
			expect(element.hasAttribute('toggle')).toBe(false);
			expect(element.toggleAttribute('toggle')).toBe(true);
			expect(element.hasAttribute('toggle')).toBe(true);
			expect(element.getAttribute('toggle')).toBe('');
			expect(element.toggleAttribute('toggle')).toBe(false);
			expect(element.hasAttribute('toggle')).toBe(false);
		});

		it('can toggle an attribute with force', () => {
			expect(element.hasAttribute('toggle')).toBe(false);
			expect(element.toggleAttribute('toggle', false)).toBe(false);
			expect(element.hasAttribute('toggle')).toBe(false);
			expect(element.toggleAttribute('toggle', true)).toBe(true);
			expect(element.hasAttribute('toggle')).toBe(true);
			expect(element.getAttribute('toggle')).toBe('');
			expect(element.toggleAttribute('toggle', true)).toBe(true);
			expect(element.hasAttribute('toggle')).toBe(true);
			expect(element.getAttribute('toggle')).toBe('');
			expect(element.toggleAttribute('toggle', false)).toBe(false);
			expect(element.hasAttribute('toggle')).toBe(false);
		});

		it('throws when trying to toggle an attribute with an invalid name', () => {
			expect(() => element.toggleAttribute('0')).toThrow();
		});

		it('can set attributes using their nodes', () => {
			const attr = document.createAttribute('attr');
			attr.value = 'some value';
			expect(element.setAttributeNodeNS(attr)).toBe(null);
			const namespacedAttr = document.createAttributeNS(
				'http://www.example.com/ns',
				'prf:aaa'
			);
			element.setAttributeNode(namespacedAttr);
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'test', value: '123' },
					{ name: 'prf:lastAttribute', value: 'last' },
					{ name: 'attr', value: 'some value' },
					{ name: 'prf:aaa', value: '' },
				])
			).toBe(true);

			// It returns the previous attribute node
			expect(element.setAttributeNode(attr)).toBe(attr);
			expect(element.setAttributeNode(document.createAttribute('attr'))).toBe(attr);

			const otherElement = document.createElement('test');
			expect(() => otherElement.setAttributeNode(namespacedAttr)).toThrow(
				'InUseAttributeError'
			);
		});

		it('can remove attributes using their nodes', () => {
			const attr = element.removeAttributeNode(element.attributes[1]);
			expect(
				hasAttributes(element.attributes, [
					{ name: 'firstAttribute', value: 'first' },
					{ name: 'prf:lastAttribute', value: 'last' },
				])
			).toBe(true);
			expect(() => element.removeAttributeNode(attr)).toThrow('NotFoundError');
		});
	});

	describe('after appending a child element', () => {
		let child: slimdom.Element;
		beforeEach(() => {
			child = document.createElement('child');
			element.appendChild(child);
		});

		it('has child node references', () => {
			expect(element.firstChild).toBe(child);
			expect(element.lastChild).toBe(child);
			expect(element.childNodes).toEqual([child]);
		});

		it('has child element references', () => {
			expect(element.firstElementChild).toBe(child);
			expect(element.lastElementChild).toBe(child);
			expect(element.children).toEqual([child]);
			expect(element.childElementCount).toBe(1);
		});

		describe('after removing the child element', () => {
			beforeEach(() => {
				element.removeChild(child);
			});

			it('has no child nodes', () => {
				expect(element.firstChild).toBe(null);
				expect(element.lastChild).toBe(null);
				expect(element.childNodes).toEqual([]);
			});

			it('has no child elements', () => {
				expect(element.firstElementChild).toBe(null);
				expect(element.lastElementChild).toBe(null);
				expect(element.children).toEqual([]);
				expect(element.childElementCount).toBe(0);
			});
		});

		describe('after replacing the child element', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.replaceChild(otherChild, child);
			});

			it('has child node references', () => {
				expect(element.firstChild).toBe(otherChild);
				expect(element.lastChild).toBe(otherChild);
				expect(element.childNodes).toEqual([otherChild]);
			});

			it('has child element references', () => {
				expect(element.firstElementChild).toBe(otherChild);
				expect(element.lastElementChild).toBe(otherChild);
				expect(element.children).toEqual([otherChild]);
				expect(element.childElementCount).toBe(1);
			});
		});

		describe('after inserting an element before the child', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.insertBefore(otherChild, child);
			});

			it('has child node references', () => {
				expect(element.firstChild).toBe(otherChild);
				expect(element.lastChild).toBe(child);
				expect(element.childNodes).toEqual([otherChild, child]);
			});

			it('has child element references', () => {
				expect(element.firstElementChild).toBe(otherChild);
				expect(element.lastElementChild).toBe(child);
				expect(element.children).toEqual([otherChild, child]);
				expect(element.childElementCount).toBe(2);
			});

			it('has correct siblings on the children', () => {
				expect(child.nextSibling).toBe(null);
				expect(child.previousSibling).toBe(otherChild);
				expect(child.nextElementSibling).toBe(null);
				expect(child.previousElementSibling).toBe(otherChild);

				expect(otherChild.nextSibling).toBe(child);
				expect(otherChild.previousSibling).toBe(null);
				expect(otherChild.nextElementSibling).toBe(child);
				expect(otherChild.previousElementSibling).toBe(null);
			});
		});

		describe('after inserting an element after the child', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.appendChild(otherChild);
			});

			it('has child node references', () => {
				expect(element.firstChild).toBe(child);
				expect(element.lastChild).toBe(otherChild);
				expect(element.childNodes).toEqual([child, otherChild]);
			});

			it('has child element references', () => {
				expect(element.firstElementChild).toBe(child);
				expect(element.lastElementChild).toBe(otherChild);
				expect(element.children).toEqual([child, otherChild]);
				expect(element.childElementCount).toBe(2);
			});

			it('has correct siblings on the children', () => {
				expect(child.nextSibling).toBe(otherChild);
				expect(child.previousSibling).toBe(null);
				expect(child.nextElementSibling).toBe(otherChild);
				expect(child.previousElementSibling).toBe(null);

				expect(otherChild.nextSibling).toBe(null);
				expect(otherChild.previousSibling).toBe(child);
				expect(otherChild.nextElementSibling).toBe(null);
				expect(otherChild.previousElementSibling).toBe(child);
			});
		});

		describe('after inserting the element at the same location', () => {
			beforeEach(() => {
				element.appendChild(child);
			});

			it('has child node references', () => {
				expect(element.firstChild).toBe(child);
				expect(element.lastChild).toBe(child);
				expect(element.childNodes).toEqual([child]);
			});

			it('has child element references', () => {
				expect(element.firstElementChild).toBe(child);
				expect(element.lastElementChild).toBe(child);
				expect(element.children).toEqual([child]);
				expect(element.childElementCount).toBe(1);
			});

			it('has no siblings on child', () => {
				expect(child.nextSibling).toBe(null);
				expect(child.previousSibling).toBe(null);
				expect(child.nextElementSibling).toBe(null);
				expect(child.previousElementSibling).toBe(null);
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
			expect(element.firstChild).toBe(processingInstruction);
			expect(element.lastChild).toBe(processingInstruction);
			expect(element.childNodes).toEqual([processingInstruction]);
		});

		it('has no child elements', () => {
			expect(element.firstElementChild).toBe(null);
			expect(element.lastElementChild).toBe(null);
			expect(element.children).toEqual([]);
			expect(element.childElementCount).toBe(0);
		});

		describe('after replacing with an element', () => {
			let otherChild: slimdom.Element;
			beforeEach(() => {
				otherChild = document.createElement('other');
				element.replaceChild(otherChild, element.firstChild!);
			});

			it('has child node references', () => {
				expect(element.firstChild).toBe(otherChild);
				expect(element.lastChild).toBe(otherChild);
				expect(element.childNodes).toEqual([otherChild]);
			});

			it('has child element references', () => {
				expect(element.firstElementChild).toBe(otherChild);
				expect(element.lastElementChild).toBe(otherChild);
				expect(element.children).toEqual([otherChild]);
				expect(element.childElementCount).toBe(1);
			});
		});
	});

	describe('normalization', () => {
		it('removes empty text nodes', () => {
			let textNode = element.appendChild(document.createTextNode(''));
			element.normalize();
			expect(textNode.parentNode).toBe(null);
		});

		it('combines adjacent text nodes', () => {
			element.appendChild(document.createTextNode('test'));
			element.appendChild(document.createTextNode('123'));
			element.appendChild(document.createTextNode('abc'));
			expect(element.childNodes.length).toBe(3);
			element.normalize();
			expect(element.childNodes.length).toBe(1);
			expect((element.firstChild as slimdom.Text).nodeValue).toBe('test123abc');
			expect((element.firstChild as slimdom.Text).data).toBe('test123abc');
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
			expect(element.childNodes.length).toBe(3);
			expect((element.firstChild as slimdom.Text).nodeValue).toBe('test123abc');
			expect(child.childNodes.length).toBe(1);
			expect((child.firstChild as slimdom.Text).data).toBe('childcontent');
			expect(otherChild.childNodes.length).toBe(1);
			expect((otherChild.firstChild as slimdom.Text).data).toBe('text');
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
			expect(range1.startContainer).toBe(element.firstChild);
			expect(range1.startOffset).toBe(4);
			expect(range1.endContainer).toBe(element.firstChild);
			expect(range1.endOffset).toBe(7);
			expect(range2.startContainer).toBe(element.firstChild);
			expect(range2.startOffset).toBe(4);
			expect(range2.endContainer).toBe(element.firstChild);
			expect(range2.endOffset).toBe(7);
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
			const copy = element.cloneNode();

			expect(copy.nodeType).toBe(1);
			expect(copy.nodeName).toBe('svg:g');
			expect(copy.nodeValue).toBe(null);
			expect(copy.ownerDocument).toBe(document);
			expect(copy.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(copy.localName).toBe('g');
			expect(copy.prefix).toBe('svg');
			expect(copy.ownerDocument).toBe(document);
			expect(copy.firstChild).toBe(null);
			expect(copy).not.toBe(element);

			expect(copy.getAttributeNS('http://www.example.com/ns', 'test')).toBe('value');
		});

		it('can be cloned (deep)', () => {
			const copy = element.cloneNode(true);

			expect(copy.nodeType).toBe(1);
			expect(copy.nodeName).toBe('svg:g');
			expect(copy.nodeValue).toBe(null);
			expect(copy.ownerDocument).toBe(document);
			expect(copy.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(copy.localName).toBe('g');
			expect(copy.prefix).toBe('svg');
			expect(copy.ownerDocument).toBe(document);
			expect(copy).not.toBe(element);

			expect(copy.getAttributeNS('http://www.example.com/ns', 'test')).toBe('value');

			const child = copy.firstChild!;
			expect(child.nodeName).toBe('child');
			expect(child).not.toBe(element.firstChild);
		});
	});

	describe('.before', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			element.before(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes before the node', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			element.before('hello', comment);

			expect(element.previousSibling).toBe(comment);
			expect((element.previousSibling!.previousSibling as slimdom.Text).data).toBe('hello');
		});

		it('can re-insert when nodes contains the node or its siblings', () => {
			const parent = document.createElement('parent');
			const previousSibling = parent.appendChild(document.createElement('previousSibling'));
			parent.appendChild(element);
			element.before(element, previousSibling, 'text');

			expect(element.parentNode).toBe(parent);
			expect(element.nextSibling).toBe(previousSibling);
			expect((element.nextSibling!.nextSibling as slimdom.Text).data).toBe('text');

			element.before('first');
			element.before(previousSibling, element);
			expect(element.previousSibling).toBe(previousSibling);
		});
	});

	describe('.after', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			element.after(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes after the node', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			element.after(comment, 'hello');

			expect(element.nextSibling).toBe(comment);
			expect((element.nextSibling!.nextSibling as slimdom.Text).data).toBe('hello');
		});

		it('can re-insert when nodes contains the node or its siblings', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			const nextSibling = parent.appendChild(document.createElement('nextSibling'));
			element.after('text', nextSibling, element);

			expect(element.parentNode).toBe(parent);
			expect(element.previousSibling).toBe(nextSibling);
			expect((element.previousSibling!.previousSibling as slimdom.Text).data).toBe('text');

			element.after('last');
			element.after(element, nextSibling);
			expect(element.nextSibling).toBe(nextSibling);
		});
	});

	describe('.replaceWith', () => {
		let comment: slimdom.Comment;
		beforeEach(() => {
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			element.replaceWith(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can replace the node with nodes and/or text', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			element.replaceWith(comment, 'hello');

			expect(element.parentNode).toBe(null);
			expect(parent.firstChild).toBe(comment);
			expect((parent.lastChild as slimdom.Text).data).toBe('hello');
		});

		it('can replace a node with nodes containing itself or its siblings', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			const nextSibling = parent.appendChild(document.createElement('nextSibling'));
			element.replaceWith(comment, nextSibling, element, 'hello');

			expect(element.parentNode).toBe(parent);
			expect(parent.firstChild).toBe(comment);
			expect(comment.nextSibling).toBe(nextSibling);
			expect(nextSibling.nextSibling).toBe(element);
			expect((parent.lastChild as slimdom.Text).data).toBe('hello');
		});
	});

	describe('.remove', () => {
		it('does nothing if the node does not have a parent', () => {
			element.remove();
			expect(element.parentNode).toBe(null);
		});

		it('can remove the node from its parent', () => {
			const parent = document.createElement('parent');
			parent.appendChild(element);
			element.remove();

			expect(element.parentNode).toBe(null);
			expect(parent.firstChild).toBe(null);
		});
	});

	describe('.prepend', () => {
		it('can add nodes at the start', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			element.prepend(comment, 'text', pi);

			expect(element.firstChild).toBe(comment);
			expect(element.firstChild!.nextSibling!.nodeType).toBe(slimdom.Node.TEXT_NODE);
			expect((element.firstChild!.nextSibling as slimdom.Text).data).toBe('text');
			expect(element.firstChild!.nextSibling!.nextSibling).toBe(pi);
		});
	});

	describe('.append', () => {
		it('can add nodes at the end', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			element.append(comment, 'text', pi);

			expect(element.lastChild!.previousSibling!.previousSibling).toBe(comment);
			expect(element.lastChild!.previousSibling!.nodeType).toBe(slimdom.Node.TEXT_NODE);
			expect((element.lastChild!.previousSibling as slimdom.Text).data).toBe('text');
			expect(element.lastChild).toBe(pi);
		});
	});

	describe('.replaceChildren', () => {
		it('can replace all children', () => {
			const comment = element.appendChild(document.createComment('test'));
			const pi = document.createProcessingInstruction('target', 'data');
			element.replaceChildren(pi);

			expect(element.firstChild).toBe(pi);
			expect(element.lastChild).toBe(pi);
			expect(comment.parentNode).toBe(null);
		});
	});
});
