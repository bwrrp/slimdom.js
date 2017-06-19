import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('ProcessingInstruction', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createProcessingInstruction()', () => {
		const pi = document.createProcessingInstruction('sometarget', 'some data');
		chai.assert.equal(pi.nodeType, 7);
		chai.assert.equal(pi.nodeName, 'sometarget');
		chai.assert.equal(pi.nodeValue, 'some data');
		chai.assert.equal(pi.target, 'sometarget');
		chai.assert.equal(pi.data, 'some data');
		chai.assert.equal(pi.ownerDocument, document);
	});

	it('can be cloned', () => {
		const pi = document.createProcessingInstruction('sometarget', 'some data');
		var copy = pi.cloneNode() as slimdom.ProcessingInstruction;
		chai.assert.equal(copy.nodeType, 7);
		chai.assert.equal(copy.nodeName, 'sometarget');
		chai.assert.equal(copy.nodeValue, 'some data');
		chai.assert.equal(copy.target, 'sometarget');
		chai.assert.equal(copy.data, 'some data');
		chai.assert.equal(copy.ownerDocument, document);
		chai.assert.notEqual(copy, pi);
	});
});
