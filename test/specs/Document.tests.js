/* jshint expr: true */
define(
	[
		'slimdom',
		'slimdom/DOMImplementation'
	],
	function(
		slimdom,
		DOMImplementation
		) {
		'use strict';

		describe('Document', function() {
			var document;
			beforeEach(function() {
				document = slimdom.createDocument();
			});

			it('has nodeType 9', function() {
				chai.expect(document.nodeType).to.equal(9);
			});

			it('exposes its DOMImplementation', function() {
				chai.expect(document.implementation).to.be.an.instanceOf(DOMImplementation);
			});

			it('initially has no doctype', function() {
				chai.expect(document.doctype).to.be.null;
			});

			it('initially has no documentElement', function() {
				chai.expect(document.documentElement).to.be.null;
			});

			it('initially has no childNodes', function() {
				chai.expect(document.childNodes).to.deep.equal([]);
			});

			it('can have user data', function() {
				// TODO: should return undefined
				chai.expect(document.getUserData('test')).to.be.null;
				document.setUserData('test', {abc: 123});
				chai.expect(document.getUserData('test')).to.deep.equal({abc: 123});
			});

			describe('after appending a child element', function() {
				var element;
				beforeEach(function() {
					element = document.createElement('test');
					document.appendChild(element);
				});

				it('has a documentElement', function() {
					chai.expect(document.documentElement).to.equal(element);
				});

				it('has childNodes', function() {
					chai.expect(document.childNodes).to.deep.equal([element]);
				});

				it('the child element is adopted into the document', function() {
					chai.expect(element.ownerDocument).to.equal(document);
				});

				describe('after removing the element', function() {
					beforeEach(function() {
						document.removeChild(element);
					});

					it('has no documentElement', function() {
						chai.expect(document.documentElement).to.be.null;
					});

					it('has no childNodes', function() {
						chai.expect(document.childNodes).to.deep.equal([]);
					});
				});

				describe('after replacing the element', function() {
					var otherElement;
					beforeEach(function() {
						otherElement = document.createElement('other');
						document.replaceChild(otherElement, element);
					});

					it('has the other element as documentElement', function() {
						chai.expect(document.documentElement).to.equal(otherElement);
					});

					it('has childNodes', function() {
						chai.expect(document.childNodes).to.deep.equal([otherElement]);
					});
				});
			});

			describe('after appending a processing instruction', function() {
				var processingInstruction;
				beforeEach(function() {
					processingInstruction = document.createProcessingInstruction('sometarget', 'somedata');
					document.appendChild(processingInstruction);
				});

				it('has no documentElement', function() {
					chai.expect(document.documentElement).to.be.null;
				});

				it('has childNodes', function() {
					chai.expect(document.childNodes).to.deep.equal([processingInstruction]);
				});

				describe('after replacing with an element', function() {
					var otherElement;
					beforeEach(function() {
						otherElement = document.createElement('other');
						document.replaceChild(otherElement, document.firstChild);
					});

					it('has the other element as documentElement', function() {
						chai.expect(document.documentElement).to.equal(otherElement);
					});

					it('has childNodes', function() {
						chai.expect(document.childNodes).to.deep.equal([otherElement]);
					});
				});
			});

			describe('cloning', function() {
				var clone;
				beforeEach(function() {
					document.appendChild(document.createElement('root'));
					clone = document.cloneNode(true);
				});

				it('is a new document', function() {
					chai.expect(clone.nodeType).to.equal(9);
					chai.expect(clone).not.to.equal(document);
				});

				it('has a new document element', function() {
					chai.expect(clone.documentElement.nodeType).to.equal(1);
					chai.expect(clone.documentElement.nodeName).to.equal('root');
					chai.expect(clone.documentElement).to.not.equal(document.documentElement);
				});
			});
		});
	}
);
