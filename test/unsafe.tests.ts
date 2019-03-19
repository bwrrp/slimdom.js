import {
	Document,
	unsafeCreateAttribute,
	unsafeCreateElement,
	unsafeAppendAttribute
} from '../src/index';

describe('unsafe methods', () => {
	describe('unsafeCreateAttribute', () => {
		it('can create an Attr while bypassing name checks', () => {
			const attr = unsafeCreateAttribute(null, 'prefix', '<', 'test', null);
			expect(attr.name).toBe('prefix:<');
		});
	});

	describe('unsafeCreateElement', () => {
		it('can create an Element while bypassing name checks', () => {
			const doc = new Document();
			const el = unsafeCreateElement(doc, '>', null);
			expect(el.nodeName).toBe('>');
		});
	});

	describe('unsafeAppendAttribute', () => {
		it('can add an attribute node to an element while bypassing the check for duplicates', () => {
			const doc = new Document();
			const el = doc.createElement('el');
			el.setAttribute('test', 'value');
			const attr = doc.createAttribute('test');
			unsafeAppendAttribute(attr, el);
			expect([...el.attributes].map(attr => attr.name)).toEqual(['test', 'test']);
		});
	});
});
