import * as slimdom from '../src/index';

import Document from '../src/Document';
import ProcessingInstruction from '../src/ProcessingInstruction';

import * as chai from 'chai';

describe('ProcessingInstruction', () => {
	let document: Document;
	let processingInstruction: ProcessingInstruction;
	beforeEach(() => {
		document = slimdom.createDocument();
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
		var clone = processingInstruction.cloneNode(true) as ProcessingInstruction;
		chai.assert.equal(clone.nodeType, 7);
		chai.assert.equal(clone.nodeValue, 'somedata');
		chai.assert.equal(clone.data, 'somedata');
		chai.assert.equal(clone.target, 'sometarget');
		chai.assert.notEqual(clone, processingInstruction);
	});
});
