import * as slimdom from '../src/index';

describe('CDATASection', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created', () => {
		const cs = document.createCDATASection('some content');
		expect(cs.nodeType).toBe(4);
		expect(cs.nodeName).toBe('#cdata-section');
		expect(cs.nodeValue).toBe('some content');
		expect(cs.data).toBe('some content');
	});

	it('can be cloned', () => {
		const cs = document.createCDATASection('some content');
		const copy = cs.cloneNode() as slimdom.CDATASection;
		expect(copy.nodeType).toBe(4);
		expect(copy.nodeName).toBe('#cdata-section');
		expect(copy.nodeValue).toBe('some content');
		expect(copy.data).toBe('some content');
		expect(copy).not.toBe(cs);
	});
});
