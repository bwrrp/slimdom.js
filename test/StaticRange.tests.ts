import * as slimdom from '../src/index';

describe('StaticRange', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can create a range that does not update automatically', () => {
		const root = document.appendChild(document.createElement('root'));
		const r = new slimdom.StaticRange({
			startContainer: root,
			startOffset: 0,
			endContainer: root,
			endOffset: 0,
		});

		expect(r.startContainer).toBe(root);
		expect(r.startOffset).toBe(0);
		expect(r.endContainer).toBe(root);
		expect(r.endOffset).toBe(0);
		expect(r.collapsed).toBe(true);

		document.removeChild(root);

		expect(r.startContainer).toBe(root);
		expect(r.startOffset).toBe(0);
		expect(r.endContainer).toBe(root);
		expect(r.endOffset).toBe(0);
		expect(r.collapsed).toBe(true);
	});

	it('does not automatically correct inverted ranges', () => {
		const root = document.appendChild(document.createElement('root'));
		const r = new slimdom.StaticRange({
			startContainer: document,
			startOffset: 1,
			endContainer: root,
			endOffset: 0,
		});

		expect(r.startContainer).toBe(document);
		expect(r.startOffset).toBe(1);
		expect(r.endContainer).toBe(root);
		expect(r.endOffset).toBe(0);
		expect(r.collapsed).toBe(false);

		document.removeChild(root);

		expect(r.startContainer).toBe(document);
		expect(r.startOffset).toBe(1);
		expect(r.endContainer).toBe(root);
		expect(r.endOffset).toBe(0);
		expect(r.collapsed).toBe(false);
	});

	it('throws when attempting to create a range in an attribute', () => {
		const root = document.appendChild(document.createElement('root'));
		root.setAttribute('attr', 'value');
		const attr = root.getAttributeNode('attr')!;
		expect(() => {
			new slimdom.StaticRange({
				startContainer: attr,
				startOffset: 0,
				endContainer: attr,
				endOffset: 0,
			});
		}).toThrow('InvalidNodeTypeError');
	});

	it('throws when attempting to create a range in a doctype', () => {
		const doctype = document.implementation.createDocumentType('html', '', '');
		expect(() => {
			new slimdom.StaticRange({
				startContainer: document,
				startOffset: 0,
				endContainer: doctype,
				endOffset: 0,
			});
		}).toThrow('InvalidNodeTypeError');
	});
});
