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
				expect(element.nodeType).toBe(1);
			});

			it('is owned by the document', function() {
				expect(element.ownerDocument).toBe(document);
			});

			it('initially has no child nodes', function() {
				expect(element.firstChild).toBeNull();
				expect(element.lastChild).toBeNull();
				expect(element.childNodes).toEqual([]);
			});

			it('initially has no child elements', function() {
				expect(element.firstElementChild).toBeNull();
				expect(element.lastElementChild).toBeNull();
				// TODO: Element.children not yet supported
				//expect(element.children).toEqual([]);
				expect(element.childElementCount).toBe(0);
			});

			it('initially has no attributes', function() {
				expect(element.hasAttribute('test')).toBe(false);
				// TODO: should return null
				expect(element.getAttribute('test')).toBeUndefined();
				expect(element.attributes).toEqual([]);
			});

			describe('setting attributes', function() {
				beforeEach(function() {
					element.setAttribute('test', '123');
				});

				it('has the attribute', function() {
					expect(element.hasAttribute('test')).toBe(true);
				});

				it('returns the attribute value', function() {
					expect(element.getAttribute('test')).toBe('123');
				});

				it('has attributes', function() {
					// TODO: attributes should be an array according to spec
					expect(element.attributes).toEqual({test: '123'});
				});

				it('can overwrite the attribute', function() {
					element.setAttribute('test', '456');
					expect(element.hasAttribute('test')).toBe(true);
					expect(element.getAttribute('test')).toBe('456');
					// TODO: attributes should be an array according to spec
					expect(element.attributes).toEqual({test: '456'});
				});

				it('can remove the attribute', function() {
					element.removeAttribute('test');
					expect(element.hasAttribute('test')).toBe(false);
					// TODO: attributes should be an array according to spec
					expect(element.attributes).toEqual({});
				});

				it('ignores removing non-existent attributes', function() {
					expect(element.hasAttribute('other')).toBe(false);
					element.removeAttribute('other');
					expect(element.hasAttribute('other')).toBe(false);
					expect(element.hasAttribute('test')).toBe(true);
					// TODO: attributes should be an array according to spec
					expect(element.attributes).toEqual({test: '123'});
				});
			});

			describe('after appending a child element', function() {
				var child;
				beforeEach(function() {
					child = document.createElement('child');
					element.appendChild(child);
				});

				it('has child node references', function() {
					expect(element.firstChild).toBe(child);
					expect(element.lastChild).toBe(child);
					expect(element.childNodes).toEqual([child]);
				});

				it('has child element references', function() {
					expect(element.firstElementChild).toBe(child);
					expect(element.lastElementChild).toBe(child);
					// TODO: Element.children not yet supported
					//expect(element.children).toEqual([child]);
					expect(element.childElementCount).toBe(1);
				});

				describe('after removing the child element', function() {
					beforeEach(function() {
						element.removeChild(child);
					});

					it('has no child nodes', function() {
						expect(element.firstChild).toBeNull();
						expect(element.lastChild).toBeNull();
						expect(element.childNodes).toEqual([]);
					});

					it('has no child elements', function() {
						expect(element.firstElementChild).toBeNull();
						expect(element.lastElementChild).toBeNull();
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([]);
						expect(element.childElementCount).toBe(0);
					});
				});

				describe('after replacing the child element', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.replaceChild(otherChild, child);
					});

					it('has child node references', function() {
						expect(element.firstChild).toBe(otherChild);
						expect(element.lastChild).toBe(otherChild);
						expect(element.childNodes).toEqual([otherChild]);
					});

					it('has child element references', function() {
						expect(element.firstElementChild).toBe(otherChild);
						expect(element.lastElementChild).toBe(otherChild);
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([otherChild]);
						expect(element.childElementCount).toBe(1);
					});
				});

				describe('after inserting an element before the child', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.insertBefore(otherChild, child);
					});

					it('has child node references', function() {
						expect(element.firstChild).toBe(otherChild);
						expect(element.lastChild).toBe(child);
						expect(element.childNodes).toEqual([otherChild, child]);
					});

					it('has child element references', function() {
						expect(element.firstElementChild).toBe(otherChild);
						expect(element.lastElementChild).toBe(child);
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([otherChild, child]);
						expect(element.childElementCount).toBe(2);
					});

					it('has correct siblings on the children', function() {
						expect(child.nextSibling).toBeNull();
						expect(child.previousSibling).toBe(otherChild);
						expect(child.nextElementSibling).toBeNull();
						expect(child.previousElementSibling).toBe(otherChild);

						expect(otherChild.nextSibling).toBe(child);
						expect(otherChild.previousSibling).toBeNull();
						expect(otherChild.nextElementSibling).toBe(child);
						expect(otherChild.previousElementSibling).toBeNull();
					});
				});

				describe('after inserting an element after the child', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.appendChild(otherChild);
					});

					it('has child node references', function() {
						expect(element.firstChild).toBe(child);
						expect(element.lastChild).toBe(otherChild);
						expect(element.childNodes).toEqual([child, otherChild]);
					});

					it('has child element references', function() {
						expect(element.firstElementChild).toBe(child);
						expect(element.lastElementChild).toBe(otherChild);
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([child, otherChild]);
						expect(element.childElementCount).toBe(2);
					});

					it('has correct siblings on the children', function() {
						expect(child.nextSibling).toBe(otherChild);
						expect(child.previousSibling).toBeNull();
						expect(child.nextElementSibling).toBe(otherChild);
						expect(child.previousElementSibling).toBeNull();

						expect(otherChild.nextSibling).toBeNull();
						expect(otherChild.previousSibling).toBe(child);
						expect(otherChild.nextElementSibling).toBeNull();
						expect(otherChild.previousElementSibling).toBe(child);
					});
				});

				describe('after inserting the element at the same location', function() {
					var otherChild;
					beforeEach(function() {
						element.appendChild(child);
					});

					it('has child node references', function() {
						expect(element.firstChild).toBe(child);
						expect(element.lastChild).toBe(child);
						expect(element.childNodes).toEqual([child]);
					});

					it('has child element references', function() {
						expect(element.firstElementChild).toBe(child);
						expect(element.lastElementChild).toBe(child);
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([child]);
						expect(element.childElementCount).toBe(1);
					});

					it('has no siblings on child', function() {
						expect(child.nextSibling).toBeNull();
						expect(child.previousSibling).toBeNull();
						expect(child.nextElementSibling).toBeNull();
						expect(child.previousElementSibling).toBeNull();
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
					expect(element.firstChild).toBe(processingInstruction);
					expect(element.lastChild).toBe(processingInstruction);
					expect(element.childNodes).toEqual([processingInstruction]);
				});

				it('has no child elements', function() {
					expect(element.firstElementChild).toBeNull();
					expect(element.lastElementChild).toBeNull();
					// TODO: Element.children not yet supported
					//expect(element.children).toEqual([]);
					expect(element.childElementCount).toBe(0);
				});

				describe('after replacing with an element', function() {
					var otherChild;
					beforeEach(function() {
						otherChild = document.createElement('other');
						element.replaceChild(otherChild, element.firstChild);
					});

					it('has child node references', function() {
						expect(element.firstChild).toBe(otherChild);
						expect(element.lastChild).toBe(otherChild);
						expect(element.childNodes).toEqual([otherChild]);
					});

					it('has child element references', function() {
						expect(element.firstElementChild).toBe(otherChild);
						expect(element.lastElementChild).toBe(otherChild);
						// TODO: Element.children not yet supported
						//expect(element.children).toEqual([otherChild]);
						expect(element.childElementCount).toBe(1);
					});
				});
			});

			describe('normalization', function() {
				it('removes empty text nodes', function() {
					var textNode = element.appendChild(document.createTextNode(''));
					element.normalize();
					expect(textNode.parentNode).toBeNull();
				});

				it('combines adjacent text nodes', function() {
					element.appendChild(document.createTextNode('test'));
					element.appendChild(document.createTextNode('123'));
					element.appendChild(document.createTextNode('abc'));
					expect(element.childNodes.length).toBe(3);
					element.normalize();
					expect(element.childNodes.length).toBe(1);
					// TODO: data property not yet supported
					//expect(element.firstChild.data).toBe('test123abc');
					expect(element.firstChild.nodeValue).toBe('test123abc');
				});
			});
		});
	}
);
