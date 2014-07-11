define(
	[
		'slimdom/DOMImplementation'
	],
	function(
		DOMImplementation
		) {
		'use strict';

		describe('DOMImplementation', function() {
			var domImplementation;
			beforeEach(function() {
				domImplementation = new DOMImplementation();
			});

			describe('.createDocumentType()', function() {
				it('can create a document type', function() {
					var doctype = domImplementation.createDocumentType('someName', 'somePublicId', 'someSystemId');
					chai.expect(doctype.nodeType).to.equal(10);
					chai.expect(doctype.name).to.equal('someName');
					chai.expect(doctype.publicId).to.equal('somePublicId');
					chai.expect(doctype.systemId).to.equal('someSystemId');
				});
			});

			describe('.createDocument()', function() {
				it('can create a blank document', function() {
					var document = domImplementation.createDocument('');
					chai.expect(document.nodeType).to.equal(9);
					chai.expect(document.firstChild).to.equal(null);
				});

				it('can create a document with a given document type', function() {
					var doctype = domImplementation.createDocumentType('someName', 'somePublicId', 'someSystemId'),
						document = domImplementation.createDocument('', doctype);
					chai.expect(document.nodeType).to.equal(9);
					chai.expect(document.firstChild).to.equal(document.doctype);
					chai.expect(document.doctype).to.equal(doctype);
					chai.expect(document.documentElement).to.equal(null);
				});

				it('can create a document with a given root element', function() {
					var document = domImplementation.createDocument('someRootElementName');
					chai.expect(document.nodeType).to.equal(9);
					chai.expect(document.firstChild).to.equal(document.documentElement);
					chai.expect(document.documentElement.nodeName).to.equal('someRootElementName');
				});
			});
		});
	}
);
