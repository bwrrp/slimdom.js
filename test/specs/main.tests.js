define(
	[
		'slimdom'
	],
	function(
		slimdom
		) {
		'use strict';

		describe('slimdom', function() {
			it('can create a document', function() {
				chai.expect(slimdom).to.respondTo('createDocument');
				var document = slimdom.createDocument();
				chai.expect(document).to.be.an.instanceof(slimdom.Document);
			});

			it('exposes the Document constructor', function() {
				chai.expect(slimdom).to.respondTo('Document');
				chai.expect(slimdom.Document).to.equal(slimdom.Document);
			});

			it('exposes the Node constructor', function() {
				chai.expect(slimdom).to.respondTo('Node');
				chai.expect(slimdom.Node).to.equal(slimdom.Node);
			});

			it('exposes the Element constructor', function() {
				chai.expect(slimdom).to.respondTo('Element');
				chai.expect(slimdom.Element).to.equal(slimdom.Element);
			});

			it('exposes the Range constructor', function() {
				chai.expect(slimdom).to.respondTo('Range');
				chai.expect(slimdom.Range).to.equal(slimdom.Range);
			});

			it('exposes the MutationObserver constructor', function() {
				chai.expect(slimdom).to.respondTo('MutationObserver');
				chai.expect(slimdom.MutationObserver).to.equal(slimdom.MutationObserver);
			});

		});
	}
);
