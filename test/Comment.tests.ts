import slimdom from '../src/index';

describe('Comment', () => {
	let document, comment;
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
		var clone = comment.cloneNode(true);
		chai.assert.equal(clone.nodeType, 8);
		chai.assert.equal(clone.nodeValue, 'somedata');
		chai.assert.equal(clone.data, 'somedata');
		chai.assert.notEqual(clone, comment);
	});
});
