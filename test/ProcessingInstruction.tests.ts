import * as slimdom from '../src/index';

describe('ProcessingInstruction', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createProcessingInstruction()', () => {
		const pi = document.createProcessingInstruction('sometarget', 'some data');
		expect(pi.nodeType).toBe(7);
		expect(pi.nodeName).toBe('sometarget');
		expect(pi.nodeValue).toBe('some data');
		expect(pi.target).toBe('sometarget');
		expect(pi.data).toBe('some data');
		expect(pi.ownerDocument).toBe(document);
	});

	it('can be cloned', () => {
		const pi = document.createProcessingInstruction('sometarget', 'some data');
		var copy = pi.cloneNode();
		expect(copy.nodeType).toBe(7);
		expect(copy.nodeName).toBe('sometarget');
		expect(copy.nodeValue).toBe('some data');
		expect(copy.target).toBe('sometarget');
		expect(copy.data).toBe('some data');
		expect(copy.ownerDocument).toBe(document);
		expect(copy).not.toBe(pi);
	});
});
