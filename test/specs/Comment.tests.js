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
				expect(comment.nodeType).toBe(8);
			});

			it('has data', function() {
				// TODO: data property not yet supported
				//expect(comment.data).toBe('somedata');
				expect(comment.nodeValue).toBe('somedata');
			});

			it('can be cloned', function() {
				var clone = comment.cloneNode(true);
				expect(clone.nodeType).toBe(8);
				// TODO: data property not yet supported
				//expect(clone.data).toBe('somedata');
				expect(clone.nodeValue).toBe('somedata');
				expect(clone).not.toBe(comment);
			});
		});
	}
);
