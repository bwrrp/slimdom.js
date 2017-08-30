import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Document', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using its constructor', () => {
		const document = new slimdom.Document();
		chai.assert.equal(document.nodeType, 9);
		chai.assert.equal(document.nodeName, '#document');
		chai.assert.equal(document.nodeValue, null);
	});

	it('can not change its nodeValue', () => {
		document.nodeValue = 'test';
		chai.assert.equal(document.nodeValue, null);
	});

	it('exposes its DOMImplementation', () =>
		chai.assert.instanceOf(document.implementation, slimdom.DOMImplementation));

	it('has a doctype property that reflects the presence of a doctype child', () => {
		chai.assert.equal(document.doctype, null);
		const doctype = document.implementation.createDocumentType('html', '', '');
		document.appendChild(doctype);
		chai.assert.equal(document.doctype, doctype);
		document.removeChild(doctype);
		chai.assert.equal(document.doctype, null);
	});

	it('initially has no documentElement', () => chai.assert.equal(document.documentElement, null));

	it('initially has no childNodes', () => chai.assert.deepEqual(document.childNodes, []));

	it('initially has no children', () => chai.assert.deepEqual(document.children, []));

	describe('after appending a child element', () => {
		let element: slimdom.Element;
		beforeEach(() => {
			element = document.createElement('test');
			document.appendChild(element);
		});

		it('has a documentElement', () => chai.assert.equal(document.documentElement, element));

		it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [element]));

		it('has children', () => chai.assert.deepEqual(document.children, [element]));

		it('has a first and last element child', () => {
			chai.assert.equal(document.firstElementChild, element);
			chai.assert.equal(document.lastElementChild, element);
		});

		it('the child element is adopted into the document', () => chai.assert.equal(element.ownerDocument, document));

		describe('after removing the element', () => {
			beforeEach(() => {
				document.removeChild(element);
			});

			it('has no documentElement', () => chai.assert.equal(document.documentElement, null));

			it('has no childNodes', () => chai.assert.deepEqual(document.childNodes, []));

			it('has no children', () => chai.assert.deepEqual(document.children, []));
		});

		describe('after replacing the element', () => {
			let otherElement: slimdom.Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, element);
			});

			it('has the other element as documentElement', () =>
				chai.assert.equal(document.documentElement, otherElement));

			it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [otherElement]));

			it('has children', () => chai.assert.deepEqual(document.children, [otherElement]));
		});
	});

	describe('after appending a processing instruction', () => {
		var processingInstruction: slimdom.ProcessingInstruction;
		beforeEach(() => {
			processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
			document.appendChild(processingInstruction);
		});

		it('has no documentElement', () => chai.assert.equal(document.documentElement, null));

		it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [processingInstruction]));

		it('has no children', () => chai.assert.deepEqual(document.children, []));

		describe('after replacing with an element', () => {
			let otherElement: slimdom.Element;
			beforeEach(() => {
				otherElement = document.createElement('other');
				document.replaceChild(otherElement, processingInstruction);
			});

			it('has the other element as documentElement', () =>
				chai.assert.equal(document.documentElement, otherElement));

			it('has childNodes', () => chai.assert.deepEqual(document.childNodes, [otherElement]));

			it('has children', () => chai.assert.deepEqual(document.children, [otherElement]));
		});
	});

	describe('.cloneNode', () => {
		beforeEach(() => {
			document.appendChild(document.createElement('root'));
		});

		it('can be cloned (shallow)', () => {
			const copy = document.cloneNode() as slimdom.Document;

			chai.assert.equal(copy.nodeType, 9);
			chai.assert.equal(copy.nodeName, '#document');
			chai.assert.equal(copy.nodeValue, null);

			chai.assert.equal(copy.documentElement, null);

			chai.assert.notEqual(copy, document);
		});

		it('can be cloned (deep)', () => {
			const copy = document.cloneNode(true) as slimdom.Document;

			chai.assert.equal(copy.nodeType, 9);
			chai.assert.equal(copy.nodeName, '#document');
			chai.assert.equal(copy.nodeValue, null);

			chai.assert.equal(copy.documentElement!.nodeName, 'root');

			chai.assert.notEqual(copy, document);
			chai.assert.notEqual(copy.documentElement, document.documentElement);
		});
	});

	it('can lookup a prefix or namespace on its document element', () => {
		chai.assert.equal(document.lookupNamespaceURI('prf'), null);
		chai.assert.equal(document.lookupPrefix('http://www.example.com/ns'), null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		document.appendChild(element);
		chai.assert.equal(document.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(document.lookupPrefix('http://www.example.com/ns'), 'prf');
	});

	describe('.createElement', () => {
		it('throws if not given a name', () => {
			chai.assert.throws(() => (document as any).createElement(), TypeError);
		});

		it('throws if given an invalid name', () => {
			chai.assert.throws(() => document.createElement(String.fromCodePoint(0x200b)), 'InvalidCharacterError');
		});
	});

	describe('.createElementNS', () => {
		it('throws if given an invalid name', () => {
			chai.assert.throws(
				() => document.createElementNS(null, String.fromCodePoint(0x200b)),
				'InvalidCharacterError'
			);
			chai.assert.throws(() => document.createElementNS(null, 'a:b:c'), 'InvalidCharacterError');
		});

		it('throws if given a prefixed name without a namespace', () => {
			chai.assert.throws(() => document.createElementNS('', 'prf:test'), 'NamespaceError');
		});

		it('throws if given an invalid use of a reserved prefix', () => {
			chai.assert.throws(() => document.createElementNS('not the xml namespace', 'xml:test'));
			chai.assert.throws(() => document.createElementNS('not the xmlns namespace', 'xmlns:test'));
			chai.assert.throws(() => document.createElementNS('http://www.w3.org/2000/xmlns/', 'pre:test'));
		});
	});

	describe('.createCDATASection', () => {
		it('throws if data contains "]]>"', () => {
			chai.assert.throws(() => document.createCDATASection('meep]]>maap'), 'InvalidCharacterError');
		});
	});

	describe('.createProcessingInstruction', () => {
		it('throws if given an invalid target', () => {
			chai.assert.throws(
				() => document.createProcessingInstruction(String.fromCodePoint(0x200b), 'some data'),
				'InvalidCharacterError'
			);
		});

		it('throws if data contains "?>"', () => {
			chai.assert.throws(
				() => document.createProcessingInstruction('target', 'some ?> data'),
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
			chai.assert.equal(element.ownerDocument, otherDocument);
			const copy = document.importNode(element);
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.equal(copy.nodeName, element.nodeName);
			chai.assert.notEqual(copy, element);
			chai.assert.deepEqual(copy.childNodes, []);
		});

		it('can clone descendants', () => {
			const element = otherDocument.createElement('test');
			element
				.appendChild(otherDocument.createElement('child'))
				.appendChild(otherDocument.createTextNode('content'));
			chai.assert.equal(element.ownerDocument, otherDocument);
			const copy = document.importNode(element, true) as slimdom.Element;
			chai.assert.equal(copy.ownerDocument, document);
			chai.assert.equal(copy.nodeName, element.nodeName);
			chai.assert.notEqual(copy, element);

			const child = copy.firstElementChild!;
			chai.assert.equal(child.nodeName, 'child');
			chai.assert.equal(child.ownerDocument, document);
			chai.assert.notEqual(child, element.firstElementChild);

			chai.assert.equal(child.firstChild!.ownerDocument, document);
			chai.assert.equal((child.firstChild as slimdom.Text).data, 'content');
		});

		it('throws if given a document node', () => {
			chai.assert.throws(() => document.importNode(otherDocument, true), 'NotSupportedError');
		});

		it('throws if given something other than a node', () => {
			chai.assert.throws(() => (document as any).importNode('not a node'), TypeError);
		});
	});

	describe('.adoptNode', () => {
		let otherDocument: slimdom.Document;
		beforeEach(() => {
			otherDocument = new slimdom.Document();
		});

		it('modifies the node to set the document as its node document', () => {
			const element = otherDocument.createElement('test');
			chai.assert.equal(element.ownerDocument, otherDocument);
			const adopted = document.adoptNode(element);
			chai.assert.equal(adopted.ownerDocument, document);
			chai.assert.equal(adopted.nodeName, element.nodeName);
			chai.assert.equal(adopted, element);
		});

		it('also adopts descendants and attributes', () => {
			const element = otherDocument.createElement('test');
			element
				.appendChild(otherDocument.createElement('child'))
				.appendChild(otherDocument.createTextNode('content'));
			element.setAttribute('test', 'value');
			chai.assert.equal(element.ownerDocument, otherDocument);
			const adopted = document.adoptNode(element) as slimdom.Element;
			chai.assert.equal(adopted.ownerDocument, document);
			chai.assert.equal(adopted.nodeName, element.nodeName);
			chai.assert.equal(adopted, element);

			const child = adopted.firstElementChild!;
			chai.assert.equal(child.ownerDocument, document);
			chai.assert.equal(child.firstChild!.ownerDocument, document);

			const attr = adopted.getAttributeNode('test');
			chai.assert.equal(attr!.ownerDocument, document);
		});

		it('throws if given a document node', () => {
			chai.assert.throws(() => document.adoptNode(otherDocument), 'NotSupportedError');
		});
	});

	describe('.createAttribute', () => {
		it('throws if given an invalid name', () => {
			chai.assert.throws(() => document.createAttribute(String.fromCodePoint(0x200b)), 'InvalidCharacterError');
		});
	});
});
