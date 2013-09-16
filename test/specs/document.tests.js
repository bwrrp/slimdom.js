define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('Document', function() {
			var document;
			beforeEach(function() {
				document = slimdom.createDocument();
			});

			it('has nodeType 9', function() {
				expect(document.nodeType).toBe(9);
			});

			it('initially has no documentElement', function() {
				expect(document.documentElement).toBeNull();
			});

			it('initially has no childNodes', function() {
				expect(document.childNodes).toEqual([]);
			});

			it('can have user data', function() {
				// TODO: should return undefined
				expect(document.getUserData('test')).toBeNull();
				document.setUserData('test', {abc: 123});
				expect(document.getUserData('test')).toEqual({abc: 123});
			});

			describe('after appending a child element', function() {
				var element;
				beforeEach(function() {
					element = document.createElement('test');
					document.appendChild(element);
				});

				it('has a documentElement', function() {
					expect(document.documentElement).toBe(element);
				});

				it('has childNodes', function() {
					expect(document.childNodes).toEqual([element]);
				});

				it('the child element is adopted into the document', function() {
					expect(element.ownerDocument).toBe(document);
				});

				describe('after removing the element', function() {
					beforeEach(function() {
						document.removeChild(element);
					});

					it('has no documentElement', function() {
						expect(document.documentElement).toBeNull();
					});

					it('has no childNodes', function() {
						expect(document.childNodes).toEqual([]);
					});
				});

				describe('after replacing the element', function() {
					var otherElement;
					beforeEach(function() {
						otherElement = document.createElement('other');
						document.replaceChild(otherElement, element);
					});

					it('has the other element as documentElement', function() {
						expect(document.documentElement).toBe(otherElement);
					});

					it('has childNodes', function() {
						expect(document.childNodes).toEqual([otherElement]);
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
					expect(document.documentElement).toBeNull();
				});

				it('has childNodes', function() {
					expect(document.childNodes).toEqual([processingInstruction]);
				});

				describe('after replacing with an element', function() {
					var otherElement;
					beforeEach(function() {
						otherElement = document.createElement('other');
						document.replaceChild(otherElement, document.firstChild);
					});

					it('has the other element as documentElement', function() {
						expect(document.documentElement).toBe(otherElement);
					});

					it('has childNodes', function() {
						expect(document.childNodes).toEqual([otherElement]);
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
					expect(clone.nodeType).toBe(9);
					expect(clone).not.toBe(document);
				});

				it('has a new document element', function() {
					expect(clone.documentElement.nodeType).toBe(1);
					expect(clone.documentElement.nodeName).toBe('root');
					expect(clone.documentElement).not.toBe(document.documentElement);
				});
			});
		});
	}
);
