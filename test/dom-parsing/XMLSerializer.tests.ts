import * as chai from 'chai';
import * as slimdom from '../../src/index';

import { appendAttribute } from '../../src/util/attrMutations';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

describe('XMLSerializer', () => {
	let document: slimdom.Document;
	let serializer: slimdom.XMLSerializer;
	beforeEach(() => {
		document = new slimdom.Document();
		serializer = new slimdom.XMLSerializer();
	});

	it('returns the empty string if given an Attr', () => {
		chai.assert.equal(serializer.serializeToString(document.createAttribute('test')), '');
		chai.assert.equal(
			serializer.serializeToString(document.createAttributeNS('http://www.example.com/ns', 'test')),
			''
		);
	});

	it('can serialize a CDATASection', () => {
		chai.assert.equal(serializer.serializeToString(document.createCDATASection('test')), '<![CDATA[test]]>');
	});

	it('can serialize a Comment', () => {
		chai.assert.equal(serializer.serializeToString(document.createComment('test')), '<!--test-->');
	});

	it('can serialize a Document', () => {
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createHTMLDocument('title')),
			'<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>title</title></head><body></body></html>'
		);
	});

	it('can serialize a DocumentFragment', () => {
		const df = document.createDocumentFragment();
		df.appendChild(document.createTextNode('test'));
		df.appendChild(document.createElement('test'));
		df.appendChild(document.createComment('test'));
		chai.assert.equal(serializer.serializeToString(df), 'test<test/><!--test-->');
	});

	it('can serialize a DocumentType', () => {
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createDocumentType('html', '', '')),
			'<!DOCTYPE html>'
		);
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createDocumentType('html', 'a', '')),
			'<!DOCTYPE html PUBLIC "a">'
		);
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createDocumentType('html', '', 'a')),
			'<!DOCTYPE html SYSTEM "a">'
		);
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createDocumentType('html', 'a', 'b')),
			'<!DOCTYPE html PUBLIC "a" "b">'
		);
	});

	it('can serialize an Element', () => {
		chai.assert.equal(serializer.serializeToString(document.createElement('el')), '<el/>');
	});

	it('can serialize an Element in the xmlns namespace', () => {
		chai.assert.equal(
			serializer.serializeToString(document.createElementNS(XMLNS_NAMESPACE, 'xmlns:test')),
			'<xmlns:test/>'
		);
	});

	it('ignores useless default namespace definitions', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', 'http://www.example.com/ns');
		const child = document.createElementNS('http://www.example.com/ns', 'child');
		child.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', 'http://www.example.com/ns');
		el.appendChild(child);
		chai.assert.equal(serializer.serializeToString(el), '<test xmlns="http://www.example.com/ns"><child/></test>');
	});

	it('retains null default namespace definitions on prefixed elements', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', '');
		const child = document.createElementNS('http://www.example.com/ns', 'prf:child');
		child.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', '');
		el.appendChild(child);
		chai.assert.equal(
			serializer.serializeToString(el),
			'<prf:test xmlns:prf="http://www.example.com/ns" xmlns=""><prf:child xmlns=""/></prf:test>'
		);
	});

	it('ignores useless prefix but not default definitions if elements are prefixed', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', 'http://www.example.com/ns');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', 'http://www.example.com/ns2');
		const child = document.createElementNS('http://www.example.com/ns', 'prf:child');
		child.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', 'http://www.example.com/ns');
		child.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', 'http://www.example.com/ns2');
		el.appendChild(child);
		chai.assert.equal(
			serializer.serializeToString(el),
			'<prf:test xmlns:prf="http://www.example.com/ns" xmlns="http://www.example.com/ns2"><prf:child xmlns="http://www.example.com/ns2"/></prf:test>'
		);
	});

	it('correctly handles returning to the null namespace', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'test');
		const child = document.createElementNS('', 'child');
		child.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', '');
		el.appendChild(child);
		child.appendChild(document.createElement('grandChild'));
		chai.assert.equal(
			serializer.serializeToString(el),
			'<test xmlns="http://www.example.com/ns"><child xmlns=""><grandChild/></child></test>'
		);
	});

	it('correctly handles changing the default namespace on prefixed elements', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', 'http://www.example.com/ns2');
		el.appendChild(document.createElementNS('http://www.example.com/ns2', 'grandChild'));
		chai.assert.equal(
			serializer.serializeToString(el),
			'<prf:test xmlns:prf="http://www.example.com/ns" xmlns="http://www.example.com/ns2"><grandChild/></prf:test>'
		);
	});

	it('correctly handles redefining prefixes', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		const child = document.createElementNS('http://www.example.com/ns2', 'prf:child');
		el.appendChild(child);
		chai.assert.equal(
			serializer.serializeToString(el),
			'<prf:test xmlns:prf="http://www.example.com/ns"><prf:child xmlns:prf="http://www.example.com/ns2"/></prf:test>'
		);
	});

	it('correctly handles conflicting prefixes', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', 'http://www.example.com/ns2');
		chai.assert.equal(
			serializer.serializeToString(el),
			'<ns1:test xmlns:ns1="http://www.example.com/ns" xmlns:prf="http://www.example.com/ns2"/>'
		);
	});

	it('always uses prefix xml for the xml namespace', () => {
		const el = document.createElementNS(XML_NAMESPACE, 'test');
		chai.assert.equal(serializer.serializeToString(el), '<xml:test/>');
	});

	it('always generates a new prefix for namespaced attributes', () => {
		// TODO: this sounds like it is not intended behavior, but does follow the algorithm
		// (see XML serialization of the attributes or an Element, 3.5.3.1.)
		const el = document.createElement('test');
		el.setAttributeNS('http://www.example.com/ns', 'prf:test', 'value');
		chai.assert.equal(
			serializer.serializeToString(el),
			'<test xmlns:ns1="http://www.example.com/ns" ns1:test="value"/>'
		);
	});

	it('always uses prefix xml for the xml namespace, even if declared as default', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'prf:test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', XML_NAMESPACE);
		el.appendChild(document.createElementNS(XML_NAMESPACE, 'test'));
		chai.assert.equal(
			serializer.serializeToString(el),
			'<prf:test xmlns:prf="http://www.example.com/ns"><xml:test/></prf:test>'
		);
	});

	it('ignores any namespace declarations for the xml namespace', () => {
		const el = document.createElementNS(XML_NAMESPACE, 'test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns', XML_NAMESPACE);
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:xml', XML_NAMESPACE);
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', XML_NAMESPACE);
		chai.assert.equal(serializer.serializeToString(el), '<xml:test/>');
	});

	it('uses a HTML parser compatible serialization for empty HTML elements', () => {
		const el = document.createElementNS(HTML_NAMESPACE, 'body');
		el.appendChild(document.createElementNS(HTML_NAMESPACE, 'br'));
		el.appendChild(document.createElementNS(HTML_NAMESPACE, 'i'));
		el.appendChild(document.createElement('not-html'));
		chai.assert.equal(
			serializer.serializeToString(el),
			'<body xmlns="http://www.w3.org/1999/xhtml"><br /><i></i><not-html xmlns=""/></body>'
		);
	});

	it('can serialize a ProcessingInstruction', () => {
		chai.assert.equal(
			serializer.serializeToString(document.createProcessingInstruction('target', 'data')),
			'<?target data?>'
		);
	});

	it('can serialize a Text node', () => {
		chai.assert.equal(serializer.serializeToString(document.createTextNode('test')), 'test');
	});

	it('can serialize an XMLDocument', () => {
		chai.assert.equal(
			serializer.serializeToString(document.implementation.createDocument('http://www.example.com/ns', 'test')),
			'<test xmlns="http://www.example.com/ns"/>'
		);
	});

	it("throws if given something that isn't a node", () => {
		chai.assert.throws(() => (serializer as any).serializeToString({ nodeType: 1 }), TypeError);
	});
});

describe('serializeToWellFormedString', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it("throws if given something that isn't a node", () => {
		chai.assert.throws(() => (slimdom as any).serializeToWellFormedString({ nodeType: 1 }), TypeError);
	});

	it('throws if given an element with a prefixed local name', () => {
		chai.assert.throws(
			() => slimdom.serializeToWellFormedString(document.createElement('notaprefix:test')),
			'InvalidStateError'
		);
	});

	it('throws if given an element in the xmlns namespace', () => {
		chai.assert.throws(
			() => slimdom.serializeToWellFormedString(document.createElementNS(XMLNS_NAMESPACE, 'xmlns:test')),
			'InvalidStateError'
		);
	});

	it('throws if given a namespace declaration for the xmlns namespace', () => {
		const el = document.createElement('test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', XMLNS_NAMESPACE);
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if given a namespace prefix declaration for the null namespace', () => {
		const el = document.createElement('test');
		el.setAttributeNS(XMLNS_NAMESPACE, 'xmlns:prf', '');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if an attribute has a prefixed local name', () => {
		const el = document.createElement('test');
		el.setAttribute('prf:test', 'value');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if the xmlns attribute has the null namespace', () => {
		const el = document.createElementNS('http://www.example.com/ns', 'test');
		el.setAttribute('xmlns', 'http://www.example.com/ns');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if two attributes share the same local name and namespace', () => {
		const el = document.createElement('test');
		// It is not possible to create this situation using the DOM API, as any attempt to set a namespaced attribute
		// will check by localName / namespaceUri only, and any null-namespaced attribute can not have a prefix.
		// Use an internal function to forceably create the invalid state.
		appendAttribute(document.createAttributeNS('http://www.example.com/ns', 'prf1:test'), el);
		appendAttribute(document.createAttributeNS('http://www.example.com/ns', 'prf2:test'), el);
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if an attribute value contains characters that do not match the Char production', () => {
		const el = document.createElement('test');
		el.setAttribute('test', String.fromCodePoint(0x7));
		chai.assert.throws(() => slimdom.serializeToWellFormedString(el), 'InvalidStateError');
	});

	it('throws if serializing an empty Document', () => {
		chai.assert.throws(() => slimdom.serializeToWellFormedString(document), 'InvalidStateError');
	});

	it('throws if a comment contains characters that do not match the Char production', () => {
		const comment = document.createComment(String.fromCodePoint(0x7));
		chai.assert.throws(() => slimdom.serializeToWellFormedString(comment), 'InvalidStateError');
	});

	it('throws if a comment contains the string "--"', () => {
		const comment = document.createComment('test--test');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(comment), 'InvalidStateError');
	});

	it('throws if a comment ends with the string "-"', () => {
		const comment = document.createComment('-');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(comment), 'InvalidStateError');
	});

	it('throws if a text node contains characters that do not match the Char production', () => {
		const text = document.createTextNode(String.fromCodePoint(0x7));
		chai.assert.throws(() => slimdom.serializeToWellFormedString(text), 'InvalidStateError');
	});

	it("throws if a doctype's publidId contains characters that do not match the PubidChar production", () => {
		const doctype = document.implementation.createDocumentType('name', '\\', '');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(doctype), 'InvalidStateError');
	});

	it("throws if a doctype's systemId contains characters that do not match the Char production", () => {
		const doctype = document.implementation.createDocumentType('name', '', String.fromCodePoint(0x7));
		chai.assert.throws(() => slimdom.serializeToWellFormedString(doctype), 'InvalidStateError');
	});

	it("throws if a doctype's systemId contains both single and double quotes", () => {
		const doctype = document.implementation.createDocumentType('name', '', '\'"');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(doctype), 'InvalidStateError');
	});

	it("throws if a processing instruction's target contains a colon", () => {
		const pi = document.createProcessingInstruction('tar:get', 'data');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(pi), 'InvalidStateError');
	});

	it('throws if a processing instruction\'s target is "xml" in any case', () => {
		const pi = document.createProcessingInstruction('XmL', 'data');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(pi), 'InvalidStateError');
	});

	it("throws if a processing instruction's data contains characters that do not match the Char production", () => {
		const pi = document.createProcessingInstruction('target', String.fromCodePoint(0x7));
		chai.assert.throws(() => slimdom.serializeToWellFormedString(pi), 'InvalidStateError');
	});

	it('throws if a processing instruction\'s data contains the string "?>"', () => {
		const pi = document.createProcessingInstruction('target', 'test');
		pi.appendData('?>test');
		chai.assert.throws(() => slimdom.serializeToWellFormedString(pi), 'InvalidStateError');
	});
});
