import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Attr', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createAttribute()', () => {
		const attr = document.createAttribute('test');
		chai.assert.equal(attr.nodeType, 2);
		chai.assert.equal(attr.nodeName, 'test');
		chai.assert.equal(attr.nodeValue, '');

		chai.assert.equal(attr.namespaceURI, null);
		chai.assert.equal(attr.prefix, null);
		chai.assert.equal(attr.localName, 'test');
		chai.assert.equal(attr.name, 'test');
		chai.assert.equal(attr.value, '');
	});

	it('can be created using Document#createAttributeNS()', () => {
		const attr = document.createAttributeNS('http://www.example.com/ns', 'ns:test');
		chai.assert.equal(attr.nodeType, 2);
		chai.assert.equal(attr.nodeName, 'ns:test');
		chai.assert.equal(attr.nodeValue, '');

		chai.assert.equal(attr.namespaceURI, 'http://www.example.com/ns');
		chai.assert.equal(attr.prefix, 'ns');
		chai.assert.equal(attr.localName, 'test');
		chai.assert.equal(attr.name, 'ns:test');
		chai.assert.equal(attr.value, '');
	});

	it('can set its value using nodeValue', () => {
		const attr = document.createAttribute('test');
		attr.nodeValue = 'value';
		chai.assert.equal(attr.nodeValue, 'value');
		chai.assert.equal(attr.value, 'value');

		attr.nodeValue = null;
		chai.assert.equal(attr.nodeValue, '');
		chai.assert.equal(attr.value, '');
	});

	it('can set its value using value', () => {
		const attr = document.createAttribute('test');
		attr.value = 'value';
		chai.assert.equal(attr.nodeValue, 'value');
		chai.assert.equal(attr.value, 'value');
	});

	it('can set its value when part of an element', () => {
		const element = document.createElement('test');
		element.setAttribute('attr', 'value');
		const attr = element.getAttributeNode('attr')!;
		chai.assert.equal(attr.value, 'value');

		attr.value = 'new value';
		chai.assert.equal(element.getAttribute('attr'), 'new value');
	});

	it('can be cloned', () => {
		const attr = document.createAttributeNS('http://www.example.com/ns', 'ns:test');
		attr.value = 'some value';

		const copy = attr.cloneNode() as slimdom.Attr;
		chai.assert.equal(copy.nodeType, 2);
		chai.assert.equal(copy.nodeName, 'ns:test');
		chai.assert.equal(copy.nodeValue, 'some value');

		chai.assert.equal(copy.namespaceURI, 'http://www.example.com/ns');
		chai.assert.equal(copy.prefix, 'ns');
		chai.assert.equal(copy.localName, 'test');
		chai.assert.equal(copy.name, 'ns:test');
		chai.assert.equal(copy.value, 'some value');

		chai.assert.notEqual(copy, attr);
	});

	it('can lookup a prefix or namespace on its owner element', () => {
		const attr = document.createAttribute('attr');
		chai.assert.equal(attr.lookupNamespaceURI('prf'), null);
		chai.assert.equal(attr.lookupPrefix('http://www.example.com/ns'), null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.setAttributeNode(attr);
		chai.assert.equal(attr.lookupNamespaceURI('prf'), 'http://www.example.com/ns');
		chai.assert.equal(attr.lookupPrefix('http://www.example.com/ns'), 'prf');
	});
});
