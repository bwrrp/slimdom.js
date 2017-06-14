import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('Comment', () => {
	let document: slimdom.Document;
	let comment: slimdom.Comment;
	beforeEach(() => {
		document = new slimdom.Document();
		comment = document.createComment('somedata');
	});

	it('has nodeType 8', () => chai.assert.equal(comment.nodeType, 8));

	it('has data', () => {
		chai.assert.equal(comment.nodeValue, 'somedata');
		chai.assert.equal(comment.data, 'somedata');
	});

	it('can be cloned', () => {
		var clone = comment.cloneNode(true) as slimdom.Comment;
		chai.assert.equal(clone.nodeType, 8);
		chai.assert.equal(clone.nodeValue, 'somedata');
		chai.assert.equal(clone.data, 'somedata');
		chai.assert.notEqual(clone, comment);
	});
});
