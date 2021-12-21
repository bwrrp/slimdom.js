import * as slimdom from '../src/index';

describe('Document', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using its constructor', () => {
		const document = new slimdom.Document();
		expect(document.nodeType).toBe(9);
		expect(document.nodeName).toBe('#document');
		expect(document.nodeValue).toBe(null);
	});

	it('can not change its nodeValue', () => {
		document.nodeValue = 'test';
		expect(document.nodeValue).toBe(null);
	});

	it('can not change its textContent', () => {
		document.textContent = 'test';
		expect(document.textContent).toBe(null);
	});

	it('exposes its DOMImplementation', () =>
		expect(document.implementation).toBeInstanceOf(slimdom.DOMImplementation));

	it('has a doctype property that reflects the presence of a doctype child', () => {
		expect(document.doctype).toBe(null);
		const doctype = document.implementation.createDocumentType('html', '', '');
		document.appendChild(doctype);
		expect(document.doctype).toBe(doctype);
		document.removeChild(doctype);
		expect(document.doctype).toBe(null);
	});

	it('initially has no documentElement', () => expect(document.documentElement).toBe(null));

	it('initially has no childNodes', () => expect(document.childNodes).toEqual([]));

	it('initially has no children', () => expect(document.children).toEqual([]));

	describe('after appending a child element', () => {
		let element: slimdom.Element;
		beforeEach(() => {
			element = document.createElement('test');
			document.appendChild(element);
		});

		it('has a documentElement', () => expect(document.documentElement).toBe(element));

		it('has childNodes', () => expect(document.childNodes).toEqual([element]));

		it('has children', () => expect(document.children).toEqual([element]));

		it('has a first and last element child', () => {
			expect(document.firstElementChild).toBe(element);
			expect(document.lastElementChild).toBe(element);
		});

		it('the child element is adopted into the document', () =>
			expect(element.ownerDocument).toBe(document));

		describe('after removing the element', () => {
			beforeEach(() => {
				document.removeChild(element);
			});

			it('has no documentElement', () => expect(document.documentElement).toBe(null));

			it('has no childNodes', () => expect(document.childNodes).toEqual([]));

			it('has no children', () => expect(document.children).toEqual([]));
		});

		describe('after replacing the element', () => {
			let otherElement: slimdom.Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, element);
			});

			it('has the other element as documentElement', () =>
				expect(document.documentElement).toBe(otherElement));

			it('has childNodes', () => expect(document.childNodes).toEqual([otherElement]));

			it('has children', () => expect(document.children).toEqual([otherElement]));
		});
	});

	describe('after appending a processing instruction', () => {
		var processingInstruction: slimdom.ProcessingInstruction;
		beforeEach(() => {
			processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
			document.appendChild(processingInstruction);
		});

		it('has no documentElement', () => expect(document.documentElement).toBe(null));

		it('has childNodes', () => expect(document.childNodes).toEqual([processingInstruction]));

		it('has no children', () => expect(document.children).toEqual([]));

		describe('after replacing with an element', () => {
			let otherElement: slimdom.Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, processingInstruction);
			});

			it('has the other element as documentElement', () =>
				expect(document.documentElement).toBe(otherElement));

			it('has childNodes', () => expect(document.childNodes).toEqual([otherElement]));

			it('has children', () => expect(document.children).toEqual([otherElement]));
		});
	});

	describe('.getElementsByTagName', () => {
		it('can find all descendants matching the given qualifiedName', () => {
			const root = document.appendChild(document.createElement('root'));
			const e1 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const e2 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const other = root.appendChild(document.createElementNS(null, 'other'));
			const e3 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e4 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e5 = other.appendChild(document.createElementNS('otherns', 'x:elem'));
			const e6 = other.appendChild(document.createElementNS('otherns', 'x:elem'));

			expect(document.getElementsByTagName('root')).toEqual([root]);
			expect(document.getElementsByTagName('pre:elem')).toEqual([e1, e2, e3, e4]);
			expect(document.getElementsByTagName('other')).toEqual([other]);
			expect(document.getElementsByTagName('x:elem')).toEqual([e5, e6]);
		});

		it('can find all descendant elements using the special name "*"', () => {
			const root = document.appendChild(document.createElement('root'));
			const e1 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const e2 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const other = root.appendChild(document.createElementNS(null, 'other'));
			const e3 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e4 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e5 = other.appendChild(document.createElementNS('otherns', 'x:elem'));
			const e6 = other.appendChild(document.createElementNS('otherns', 'x:elem'));

			expect(document.getElementsByTagName('*')).toEqual([
				root,
				e1,
				e2,
				other,
				e3,
				e4,
				e5,
				e6,
			]);
		});
	});

	describe('.getElementsByTagNameNS', () => {
		it('can find all descendants matching the given namespace and localName', () => {
			const root = document.appendChild(document.createElement('root'));
			const e1 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const e2 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const other = root.appendChild(document.createElementNS(null, 'other'));
			const e3 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e4 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e5 = other.appendChild(document.createElementNS('otherns', 'x:elem'));
			const e6 = other.appendChild(document.createElementNS('otherns', 'x:elem'));

			expect(document.getElementsByTagNameNS(null, 'root')).toEqual([root]);
			expect(document.getElementsByTagNameNS('zoinks', 'root')).toEqual([]);
			expect(document.getElementsByTagNameNS('namespace', 'elem')).toEqual([e1, e2]);
			expect(document.getElementsByTagNameNS('otherns', 'elem')).toEqual([e3, e4, e5, e6]);
			expect(document.getElementsByTagNameNS('', 'other')).toEqual([other]);
		});

		it('can find all descendant elements using the special namespace "*"', () => {
			const root = document.appendChild(document.createElement('root'));
			const e1 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const e2 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const other = root.appendChild(document.createElementNS(null, 'other'));
			const e3 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e4 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e5 = other.appendChild(document.createElementNS('otherns', 'x:elem'));
			const e6 = other.appendChild(document.createElementNS('otherns', 'x:elem'));

			expect(document.getElementsByTagNameNS('*', 'root')).toEqual([root]);
			expect(document.getElementsByTagNameNS('*', 'elem')).toEqual([e1, e2, e3, e4, e5, e6]);
			expect(document.getElementsByTagNameNS('*', 'other')).toEqual([other]);
		});

		it('can find all descendant elements using the special localName "*"', () => {
			const root = document.appendChild(document.createElement('root'));
			const e1 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const e2 = root.appendChild(document.createElementNS('namespace', 'pre:elem'));
			const other = root.appendChild(document.createElementNS(null, 'other'));
			const e3 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e4 = other.appendChild(document.createElementNS('otherns', 'pre:elem'));
			const e5 = other.appendChild(document.createElementNS('otherns', 'x:elem'));
			const e6 = other.appendChild(document.createElementNS('otherns', 'x:elem'));

			expect(document.getElementsByTagNameNS(null, '*')).toEqual([root, other]);
			expect(document.getElementsByTagNameNS('', '*')).toEqual([root, other]);
			expect(document.getElementsByTagNameNS('zoinks', '*')).toEqual([]);
			expect(document.getElementsByTagNameNS('namespace', '*')).toEqual([e1, e2]);
			expect(document.getElementsByTagNameNS('otherns', '*')).toEqual([e3, e4, e5, e6]);
			expect(document.getElementsByTagNameNS('*', '*')).toEqual([
				root,
				e1,
				e2,
				other,
				e3,
				e4,
				e5,
				e6,
			]);
		});
	});

	describe('.cloneNode', () => {
		beforeEach(() => {
			document.appendChild(document.createElement('root'));
		});

		it('can be cloned (shallow)', () => {
			const copy = document.cloneNode();

			expect(copy.nodeType).toBe(9);
			expect(copy.nodeName).toBe('#document');
			expect(copy.nodeValue).toBe(null);

			expect(copy.documentElement).toBe(null);

			expect(copy).not.toBe(document);
		});

		it('can be cloned (deep)', () => {
			const copy = document.cloneNode(true);

			expect(copy.nodeType).toBe(9);
			expect(copy.nodeName).toBe('#document');
			expect(copy.nodeValue).toBe(null);

			expect(copy.documentElement!.nodeName).toBe('root');

			expect(copy).not.toBe(document);
			expect(copy.documentElement).not.toBe(document.documentElement);
		});
	});

	it('can lookup a prefix or namespace on its document element', () => {
		expect(document.lookupNamespaceURI('prf')).toBe(null);
		expect(document.lookupPrefix('http://www.example.com/ns')).toBe(null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		document.appendChild(element);
		expect(document.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(document.lookupPrefix('http://www.example.com/ns')).toBe('prf');
	});

	describe('.createElement', () => {
		it('throws if not given a name', () => {
			expect(() => (document as any).createElement()).toThrow(TypeError);
		});

		it('throws if given an invalid name', () => {
			expect(() => document.createElement(String.fromCodePoint(0x200b))).toThrow(
				'InvalidCharacterError'
			);
		});
	});

	describe('.createElementNS', () => {
		it('throws if given an invalid name', () => {
			expect(() => document.createElementNS(null, String.fromCodePoint(0x200b))).toThrow(
				'InvalidCharacterError'
			);
			expect(() => document.createElementNS(null, 'a:b:c')).toThrow('InvalidCharacterError');
		});

		it('throws if given a prefixed name without a namespace', () => {
			expect(() => document.createElementNS('', 'prf:test')).toThrow('NamespaceError');
		});

		it('throws if given an invalid use of a reserved prefix', () => {
			expect(() => document.createElementNS('not the xml namespace', 'xml:test')).toThrow(
				'NamespaceError'
			);
			expect(() => document.createElementNS('not the xmlns namespace', 'xmlns:test')).toThrow(
				'NamespaceError'
			);
			expect(() =>
				document.createElementNS('http://www.w3.org/2000/xmlns/', 'pre:test')
			).toThrow('NamespaceError');
		});
	});

	describe('.createCDATASection', () => {
		it('throws if data contains "]]>"', () => {
			expect(() => document.createCDATASection('meep]]>maap')).toThrow(
				'InvalidCharacterError'
			);
		});
	});

	describe('.createProcessingInstruction', () => {
		it('throws if given an invalid target', () => {
			expect(() =>
				document.createProcessingInstruction(String.fromCodePoint(0x200b), 'some data')
			).toThrow('InvalidCharacterError');
		});

		it('throws if data contains "?>"', () => {
			expect(() => document.createProcessingInstruction('target', 'some ?> data')).toThrow(
				'InvalidCharacterError'
			);
		});
	});

	describe('.importNode', () => {
		let otherDocument: slimdom.Document;
		beforeEach(() => {
			otherDocument = new slimdom.Document();
		});

		it('returns a clone with the document as node document', () => {
			const element = otherDocument.createElement('test');
			expect(element.ownerDocument).toBe(otherDocument);
			const copy = document.importNode(element);
			expect(copy.ownerDocument).toBe(document);
			expect(copy.nodeName).toBe(element.nodeName);
			expect(copy).not.toBe(element);
			expect(copy.childNodes).toEqual([]);
		});

		it('can clone descendants', () => {
			const element = otherDocument.createElement('test');
			element
				.appendChild(otherDocument.createElement('child'))
				.appendChild(otherDocument.createTextNode('content'));
			expect(element.ownerDocument).toBe(otherDocument);
			const copy = document.importNode(element, true);
			expect(copy.ownerDocument).toBe(document);
			expect(copy.nodeName).toBe(element.nodeName);
			expect(copy).not.toBe(element);

			const child = copy.firstElementChild!;
			expect(child.nodeName).toBe('child');
			expect(child.ownerDocument).toBe(document);
			expect(child).not.toBe(element.firstElementChild);

			expect(child.firstChild!.ownerDocument).toBe(document);
			expect((child.firstChild as slimdom.Text).data).toBe('content');
		});

		it('throws if given a document node', () => {
			expect(() => document.importNode(otherDocument, true)).toThrow('NotSupportedError');
		});

		it('throws if given something other than a node', () => {
			expect(() => (document as any).importNode('not a node')).toThrow(TypeError);
		});
	});

	describe('.adoptNode', () => {
		let otherDocument: slimdom.Document;
		beforeEach(() => {
			otherDocument = new slimdom.Document();
		});

		it('modifies the node to set the document as its node document', () => {
			const element = otherDocument.createElement('test');
			expect(element.ownerDocument).toBe(otherDocument);
			const adopted = document.adoptNode(element);
			expect(adopted.ownerDocument).toBe(document);
			expect(adopted.nodeName).toBe(element.nodeName);
			expect(adopted).toBe(element);
		});

		it('also adopts descendants and attributes', () => {
			const element = otherDocument.createElement('test');
			element
				.appendChild(otherDocument.createElement('child'))
				.appendChild(otherDocument.createTextNode('content'));
			element.setAttribute('test', 'value');
			expect(element.ownerDocument).toBe(otherDocument);
			const adopted = document.adoptNode(element);
			expect(adopted.ownerDocument).toBe(document);
			expect(adopted.nodeName).toBe(element.nodeName);
			expect(adopted).toBe(element);

			const child = adopted.firstElementChild!;
			expect(child.ownerDocument).toBe(document);
			expect(child.firstChild!.ownerDocument).toBe(document);

			const attr = adopted.getAttributeNode('test');
			expect(attr!.ownerDocument).toBe(document);
		});

		it('throws if given a document node', () => {
			expect(() => document.adoptNode(otherDocument)).toThrow('NotSupportedError');
		});
	});

	describe('.createAttribute', () => {
		it('throws if given an invalid name', () => {
			expect(() => document.createAttribute(String.fromCodePoint(0x200b))).toThrow(
				'InvalidCharacterError'
			);
		});
	});

	describe('.prepend', () => {
		it('can add nodes at the start', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			document.prepend(comment, pi);

			expect(document.firstChild).toBe(comment);
			expect(document.firstChild!.nextSibling).toBe(pi);
		});

		it('can not add text', () => {
			expect(() => document.prepend('text')).toThrow('HierarchyRequestError');
		});
	});

	describe('.append', () => {
		it('can add nodes at the end', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			document.append(comment, pi);

			expect(document.lastChild!.previousSibling).toBe(comment);
			expect(document.lastChild).toBe(pi);
		});

		it('can not add text', () => {
			expect(() => document.append('text')).toThrow('HierarchyRequestError');
		});
	});

	describe('.replaceChildren', () => {
		it('can replace all children', () => {
			const element = document.appendChild(document.createElement('test'));
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');

			document.replaceChildren(comment, pi);

			expect(element.parentNode).toBe(null);
			expect(document.firstChild).toBe(comment);
			expect(document.lastChild).toBe(pi);
		});
	});
});
