import * as slimdom from '../src/index';

describe('Attr', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createAttribute()', () => {
		const attr = document.createAttribute('test');
		expect(attr.nodeType).toBe(2);
		expect(attr.nodeName).toBe('test');
		expect(attr.nodeValue).toBe('');

		expect(attr.namespaceURI).toBe(null);
		expect(attr.prefix).toBe(null);
		expect(attr.localName).toBe('test');
		expect(attr.name).toBe('test');
		expect(attr.value).toBe('');
	});

	it('can be created using Document#createAttributeNS()', () => {
		const attr = document.createAttributeNS('http://www.example.com/ns', 'ns:test');
		expect(attr.nodeType).toBe(2);
		expect(attr.nodeName).toBe('ns:test');
		expect(attr.nodeValue).toBe('');

		expect(attr.namespaceURI).toBe('http://www.example.com/ns');
		expect(attr.prefix).toBe('ns');
		expect(attr.localName).toBe('test');
		expect(attr.name).toBe('ns:test');
		expect(attr.value).toBe('');
	});

	it('can set its value using nodeValue', () => {
		const attr = document.createAttribute('test');
		attr.nodeValue = 'value';
		expect(attr.nodeValue).toBe('value');
		expect(attr.textContent).toBe('value');
		expect(attr.value).toBe('value');

		attr.nodeValue = null;
		expect(attr.nodeValue).toBe('');
		expect(attr.textContent).toBe('');
		expect(attr.value).toBe('');
	});

	it('can set its value using textContent', () => {
		const attr = document.createAttribute('test');
		attr.textContent = 'value';
		expect(attr.nodeValue).toBe('value');
		expect(attr.textContent).toBe('value');
		expect(attr.value).toBe('value');

		attr.textContent = null;
		expect(attr.nodeValue).toBe('');
		expect(attr.textContent).toBe('');
		expect(attr.value).toBe('');
	});

	it('can set its value using value', () => {
		const attr = document.createAttribute('test');
		attr.value = 'value';
		expect(attr.nodeValue).toBe('value');
		expect(attr.textContent).toBe('value');
		expect(attr.value).toBe('value');
	});

	it('can set its value when part of an element', () => {
		const element = document.createElement('test');
		element.setAttribute('attr', 'value');
		const attr = element.getAttributeNode('attr')!;
		expect(attr.value).toBe('value');

		attr.value = 'new value';
		expect(element.getAttribute('attr')).toBe('new value');
	});

	it('can be cloned', () => {
		const attr = document.createAttributeNS('http://www.example.com/ns', 'ns:test');
		attr.value = 'some value';

		const copy = attr.cloneNode();
		expect(copy.nodeType).toBe(2);
		expect(copy.nodeName).toBe('ns:test');
		expect(copy.nodeValue).toBe('some value');

		expect(copy.namespaceURI).toBe('http://www.example.com/ns');
		expect(copy.prefix).toBe('ns');
		expect(copy.localName).toBe('test');
		expect(copy.name).toBe('ns:test');
		expect(copy.value).toBe('some value');

		expect(copy).not.toBe(attr);
	});

	it('can lookup a prefix or namespace on its owner element', () => {
		const attr = document.createAttribute('attr');
		expect(attr.lookupNamespaceURI('prf')).toBe(null);
		expect(attr.lookupPrefix('http://www.example.com/ns')).toBe(null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.setAttributeNode(attr);
		expect(attr.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(attr.lookupPrefix('http://www.example.com/ns')).toBe('prf');
	});
});
