import slimdom from '../src/index';

import Comment from '../src/Comment';
import Document from '../src/Document';

import * as chai from 'chai';

describe('Comment', () => {
	let document: Document;
	let comment: Comment;
	beforeEach(() => {
		document = slimdom.createDocument();
		comment = document.createComment('somedata');
	});

	it('has nodeType 8', () => chai.assert.equal(comment.nodeType, 8));

	it('has data', () => {
		chai.assert.equal(comment.nodeValue, 'somedata');
		chai.assert.equal(comment.data, 'somedata');
	});

	it('can be cloned', () => {
		var clone = comment.cloneNode(true) as Comment;
		chai.assert.equal(clone.nodeType, 8);
		chai.assert.equal(clone.nodeValue, 'somedata');
		chai.assert.equal(clone.data, 'somedata');
		chai.assert.notEqual(clone, comment);
	});
});
