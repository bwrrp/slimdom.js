define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('DocumentType', function() {
			var doctype;
			beforeEach(function() {
				doctype = slimdom.implementation.createDocumentType('somename', 'somePublicId', 'someSystemId');
			});

			it('has nodeType 10', function() {
				chai.expect(doctype.nodeType).to.equal(10);
			});

			it('has a name', function() {
				chai.expect(doctype.name).to.equal('somename');
			});

			it('has a publicId', function() {
				chai.expect(doctype.publicId).to.equal('somePublicId');
			});

			it('has a systemId', function() {
				chai.expect(doctype.systemId).to.equal('someSystemId');
			});

			it('can be cloned', function() {
				var clone = doctype.cloneNode(true);
				chai.expect(clone.nodeType).to.equal(10);
				chai.expect(clone.name).to.equal('somename');
				chai.expect(clone.publicId).to.equal('somePublicId');
				chai.expect(clone.systemId).to.equal('someSystemId');
				chai.expect(clone).to.not.equal(doctype);
			});
		});
	}
);
