define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('ProcessingInstruction', function() {
			var document,
				processingInstruction;
			beforeEach(function() {
				document = slimdom.createDocument();
				processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
			});

			it('has nodeType 7', function() {
				expect(processingInstruction.nodeType).toBe(7);
			});

			it('has data', function() {
				// TODO: data property not yet supported
				//expect(processingInstruction.data).toBe('somedata');
				expect(processingInstruction.nodeValue).toBe('somedata');
			});

			it('has a target', function() {
				expect(processingInstruction.target).toBe('sometarget');
			});

			it('can be cloned', function() {
				var clone = processingInstruction.cloneNode(true);
				expect(clone.nodeType).toBe(7);
				// TODO: data property not yet supported
				//expect(clone.data).toBe('somedata');
				expect(clone.nodeValue).toBe('somedata');
				expect(clone.target).toBe('sometarget');
				expect(clone).not.toBe(processingInstruction);
			});
		});
	}
);
