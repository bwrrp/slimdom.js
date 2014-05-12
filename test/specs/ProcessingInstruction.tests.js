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
				chai.expect(processingInstruction.nodeType).to.equal(7);
			});

			it('has data', function() {
				chai.expect(processingInstruction.nodeValue).to.equal('somedata');
				chai.expect(processingInstruction.data).to.equal('somedata');
			});

			it('has a target', function() {
				chai.expect(processingInstruction.target).to.equal('sometarget');
			});

			it('can be cloned', function() {
				var clone = processingInstruction.cloneNode(true);
				chai.expect(clone.nodeType).to.equal(7);
				chai.expect(clone.nodeValue).to.equal('somedata');
				chai.expect(clone.data).to.equal('somedata');
				chai.expect(clone.target).to.equal('sometarget');
				chai.expect(clone).not.to.equal(processingInstruction);
			});
		});
	}
);
