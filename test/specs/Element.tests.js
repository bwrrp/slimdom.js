/* jshint expr: true */
define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('Element', function() {
			var document,
				element;
			beforeEach(function() {
				document = slimdom.createDocument();
				element = document.createElement('root');
			});

			it('has nodeType 1', function() {
				chai.expect(element.nodeType).to.equal(1);
			});

			it('is owned by the document', function() {
				chai.expect(element.ownerDocument).to.equal(document);
			});

			it('initially has no child nodes', function() {
				chai.expect(element.firstChild).to.be.null;
				chai.expect(element.lastChild).to.be.null;
				chai.expect(element.childNodes).to.deep.equal([]);
			});

			it('initially has no child elements', function() {
				chai.expect(element.firstElementChild).to.be.null;
				chai.expect(element.lastElementChild).to.be.null;
				// TODO: Element.children not yet supported
				//chai.expect(element.children).to.deep.equal([]);
				chai.expect(element.childElementCount).to.equal(0);
			});

			it('initially has no attributes', function() {
				chai.expect(element.hasAttribute('test')).to.equal(false);
				chai.expect(element.getAttribute('test')).to.be.null;
				chai.expect(element.attributes).to.deep.equal([]);
			});

			describe('setting attributes', function() {
				beforeEach(function() {
					element.setAttribute('firstAttribute', 'first');
					element.setAttribute('test', '123');
					element.setAttribute('lastAttribute', 'last');
				});

				it('has the attribute', function() {
					chai.expect(element.hasAttribute('firstAttribute')).to.equal(true);
					chai.expect(element.hasAttribute('test')).to.equal(true);
					chai.expect(element.hasAttribute('lastAttribute')).to.equal(true);
					chai.expect(element.hasAttribute('noSuchAttribute')).to.equal(false);
				});

				it('returns the attribute value', function() {
					chai.expect(element.getAttribute('firstAttribute')).to.equal('first');
					chai.expect(element.getAttribute('test')).to.equal('123');
					chai.expect(element.getAttribute('lastAttribute')).to.equal('last');
					chai.expect(element.getAttribute('noSuchAttribute')).to.be.null;
				});

				it('has attributes', function() {
					chai.expect(element.attributes).to.deep.equal([
						{name: 'firstAttribute', value: 'first'},
						{name: 'test', value: '123'},
						{name: 'lastAttribute', value: 'last'}
					]);
				});

				it('can overwrite the attribute', function() {
					element.setAttribute('test', '456');
					chai.expect(element.hasAttribute('test')).to.equal(true);
					chai.expect(element.getAttribute('test')).to.equal('456');
					chai.expect(element.attributes).to.deep.equal([
						{name: 'firstAttribute', value: 'first'},
						{name: 'test', value: '456'},
						{name: 'lastAttribute', value: 'last'}
					]);
				});

				it('can remove the attribute', function() {
					element.removeAttribute('test');
					chai.expect(element.hasAttribute('firstAttribute')).to.equal(true);
					chai.expect(element.hasAttribute('test')).to.equal(false);
					chai.expect(element.hasAttribute('lastAttribute')).to.equal(true);
					chai.expect(element.attributes).to.deep.equal([
						{name: 'firstAttribute', value: 'first'},
						{name: 'lastAttribute', value: 'last'}
					]);
				});

				it('ignores removing non-existent attributes', function() {
					chai.expect(element.hasAttribute('other')).to.equal(false);
					element.removeAttribute('other');
					chai.expect(element.hasAttribute('other')).to.equal(false);
					chai.expect(element.hasAttribute('test')).to.equal(true);
					chai.expect(element.attributes).to.deep.equal([
						{name: 'firstAttribute', value: 'first'},
						{name: 'test', value: '123'},
						{name: 'lastAttribute', value: 'last'}
					]);
				});
			});

			describe('after appending a child element', function() {
				var child;
				beforeEach(function() {
					child = document.createElement('child');
					element.appendChild(child);
				});

				it('has child node references', function() {
					chai.expect(element.firstChild).to.equal(child);
					chai.expect(element.lastChild).to.equal(child);
					chai.expect(element.childNodes).to.deep.equal([child]);
				});

				it('has child element references', function() {
					chai.expect(element.firstElementChild).to.equal(child);
					chai.expect(element.lastElementChild).to.equal(child);
					// TODO: Element.children not yet supported
					//chai.expect(element.children).to.deep.equal([child]);
					chai.expect(element.childElementCount).to.equal(1);
				});

				describe('after removing the child element', function() {
					beforeEach(function() {
						element.removeChild(child);
					});

					it('has no child nodes', function() {
						chai.expect(element.firstChild).to.be.null;
						chai.expect(element.lastChild).to.be.null;
						chai.expect(element.childNodes).to.deep.equal([]);
					});

					it('has no child elements', function() {
						chai.expect(element.firstElementChild).to.be.null;
						chai.expect(element.lastElementChild).to.be.null;
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([]);
						chai.expect(element.childElementCount).to.equal(0);
					});
				});

				describe('after replacing the child element', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.replaceChild(otherChild, child);
					});

					it('has child node references', function() {
						chai.expect(element.firstChild).to.equal(otherChild);
						chai.expect(element.lastChild).to.equal(otherChild);
						chai.expect(element.childNodes).to.deep.equal([otherChild]);
					});

					it('has child element references', function() {
						chai.expect(element.firstElementChild).to.equal(otherChild);
						chai.expect(element.lastElementChild).to.equal(otherChild);
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([otherChild]);
						chai.expect(element.childElementCount).to.equal(1);
					});
				});

				describe('after inserting an element before the child', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.insertBefore(otherChild, child);
					});

					it('has child node references', function() {
						chai.expect(element.firstChild).to.equal(otherChild);
						chai.expect(element.lastChild).to.equal(child);
						chai.expect(element.childNodes).to.deep.equal([otherChild, child]);
					});

					it('has child element references', function() {
						chai.expect(element.firstElementChild).to.equal(otherChild);
						chai.expect(element.lastElementChild).to.equal(child);
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([otherChild, child]);
						chai.expect(element.childElementCount).to.equal(2);
					});

					it('has correct siblings on the children', function() {
						chai.expect(child.nextSibling).to.be.null;
						chai.expect(child.previousSibling).to.equal(otherChild);
						chai.expect(child.nextElementSibling).to.be.null;
						chai.expect(child.previousElementSibling).to.equal(otherChild);

						chai.expect(otherChild.nextSibling).to.equal(child);
						chai.expect(otherChild.previousSibling).to.be.null;
						chai.expect(otherChild.nextElementSibling).to.equal(child);
						chai.expect(otherChild.previousElementSibling).to.be.null;
					});
				});

				describe('after inserting an element after the child', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.appendChild(otherChild);
					});

					it('has child node references', function() {
						chai.expect(element.firstChild).to.equal(child);
						chai.expect(element.lastChild).to.equal(otherChild);
						chai.expect(element.childNodes).to.deep.equal([child, otherChild]);
					});

					it('has child element references', function() {
						chai.expect(element.firstElementChild).to.equal(child);
						chai.expect(element.lastElementChild).to.equal(otherChild);
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([child, otherChild]);
						chai.expect(element.childElementCount).to.equal(2);
					});

					it('has correct siblings on the children', function() {
						chai.expect(child.nextSibling).to.equal(otherChild);
						chai.expect(child.previousSibling).to.be.null;
						chai.expect(child.nextElementSibling).to.equal(otherChild);
						chai.expect(child.previousElementSibling).to.be.null;

						chai.expect(otherChild.nextSibling).to.be.null;
						chai.expect(otherChild.previousSibling).to.equal(child);
						chai.expect(otherChild.nextElementSibling).to.be.null;
						chai.expect(otherChild.previousElementSibling).to.equal(child);
					});
				});

				describe('after inserting the element at the same location', function() {
					var otherChild;
					beforeEach(function() {
						element.appendChild(child);
					});

					it('has child node references', function() {
						chai.expect(element.firstChild).to.equal(child);
						chai.expect(element.lastChild).to.equal(child);
						chai.expect(element.childNodes).to.deep.equal([child]);
					});

					it('has child element references', function() {
						chai.expect(element.firstElementChild).to.equal(child);
						chai.expect(element.lastElementChild).to.equal(child);
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([child]);
						chai.expect(element.childElementCount).to.equal(1);
					});

					it('has no siblings on child', function() {
						chai.expect(child.nextSibling).to.be.null;
						chai.expect(child.previousSibling).to.be.null;
						chai.expect(child.nextElementSibling).to.be.null;
						chai.expect(child.previousElementSibling).to.be.null;
					});
				});
			});

			describe('after appending a processing instruction', function() {
				var processingInstruction;
				beforeEach(function() {
					processingInstruction = document.createProcessingInstruction('test', 'test');
					element.appendChild(processingInstruction);
				});

				it('has child node references', function() {
					chai.expect(element.firstChild).to.equal(processingInstruction);
					chai.expect(element.lastChild).to.equal(processingInstruction);
					chai.expect(element.childNodes).to.deep.equal([processingInstruction]);
				});

				it('has no child elements', function() {
					chai.expect(element.firstElementChild).to.be.null;
					chai.expect(element.lastElementChild).to.be.null;
					// TODO: Element.children not yet supported
					//chai.expect(element.children).to.deep.equal([]);
					chai.expect(element.childElementCount).to.equal(0);
				});

				describe('after replacing with an element', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.replaceChild(otherChild, element.firstChild);
					});

					it('has child node references', function() {
						chai.expect(element.firstChild).to.equal(otherChild);
						chai.expect(element.lastChild).to.equal(otherChild);
						chai.expect(element.childNodes).to.deep.equal([otherChild]);
					});

					it('has child element references', function() {
						chai.expect(element.firstElementChild).to.equal(otherChild);
						chai.expect(element.lastElementChild).to.equal(otherChild);
						// TODO: Element.children not yet supported
						//chai.expect(element.children).to.deep.equal([otherChild]);
						chai.expect(element.childElementCount).to.equal(1);
					});
				});
			});

			describe('normalization', function() {
				it('removes empty text nodes', function() {
					var textNode = element.appendChild(document.createTextNode(''));
					element.normalize();
					chai.expect(textNode.parentNode).to.be.null;
				});

				it('combines adjacent text nodes', function() {
					element.appendChild(document.createTextNode('test'));
					element.appendChild(document.createTextNode('123'));
					element.appendChild(document.createTextNode('abc'));
					chai.expect(element.childNodes.length).to.equal(3);
					element.normalize();
					chai.expect(element.childNodes.length).to.equal(1);
					chai.expect(element.firstChild.nodeValue).to.equal('test123abc');
					chai.expect(element.firstChild.data).to.equal('test123abc');
				});
			});
		});
	}
);
