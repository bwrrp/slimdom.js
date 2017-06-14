import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('ProcessingInstruction', () => {
	let document: slimdom.Document;
	let processingInstruction: slimdom.ProcessingInstruction;
	beforeEach(() => {
		document = new slimdom.Document();
		processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
	});

	it('has nodeType 7', () => chai.assert.equal(processingInstruction.nodeType, 7));

	it('has data', () => {
		chai.assert.equal(processingInstruction.nodeValue, 'somedata');
		chai.assert.equal(processingInstruction.data, 'somedata');
	});

	it('has a target', () => {
		chai.assert.equal(processingInstruction.target, 'sometarget');
	});

	it('can be cloned', () => {
		var clone = processingInstruction.cloneNode(true) as slimdom.ProcessingInstruction;
		chai.assert.equal(clone.nodeType, 7);
		chai.assert.equal(clone.nodeValue, 'somedata');
		chai.assert.equal(clone.data, 'somedata');
		chai.assert.equal(clone.target, 'sometarget');
		chai.assert.notEqual(clone, processingInstruction);
	});
});
