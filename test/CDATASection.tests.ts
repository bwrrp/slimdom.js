import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('CDATASection', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created', () => {
		const cs = document.createCDATASection('some content');
		chai.assert.equal(cs.nodeType, 4);
		chai.assert.equal(cs.nodeName, '#cdata-section');
		chai.assert.equal(cs.nodeValue, 'some content');
		chai.assert.equal(cs.data, 'some content');
	});

	it('can be cloned', () => {
		const cs = document.createCDATASection('some content');
		const copy = cs.cloneNode() as slimdom.CDATASection;
		chai.assert.equal(copy.nodeType, 4);
		chai.assert.equal(copy.nodeName, '#cdata-section');
		chai.assert.equal(copy.nodeValue, 'some content');
		chai.assert.equal(copy.data, 'some content');
		chai.assert.notEqual(copy, cs);
	});
});
