define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('Comment', function() {
			var document,
				comment;
			beforeEach(function() {
				document = slimdom.createDocument();
				comment = document.createComment('somedata');
			});

			it('has nodeType 8', function() {
				chai.expect(comment.nodeType).to.equal(8);
			});

			it('has data', function() {
				chai.expect(comment.nodeValue).to.equal('somedata');
				chai.expect(comment.data).to.equal('somedata');
			});

			it('can be cloned', function() {
				var clone = comment.cloneNode(true);
				chai.expect(clone.nodeType).to.equal(8);
				chai.expect(clone.nodeValue).to.equal('somedata');
				chai.expect(clone.data).to.equal('somedata');
				chai.expect(clone).to.not.equal(comment);
			});
		});
	}
);
