define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('Range', function() {
			var document,
				element,
				text,
				range;
			beforeEach(function() {
				document = slimdom.createDocument();
				element = document.appendChild(document.createElement('root'));
				text = element.appendChild(document.createTextNode('text'));
				range = document.createRange();
			});

			it('is initially collapsed at the start of the document', function() {
				expect(range.collapsed).toBe(true);
				expect(range.startContainer).toBe(document);
				expect(range.endContainer).toBe(document);
				expect(range.startOffset).toBe(0);
				expect(range.endOffset).toBe(0);
			});

			describe('setting positions', function() {
				it('start after end moves end', function() {
					range.setStart(element, 0);
					expect(range.startContainer).toBe(element);
					expect(range.startOffset).toBe(0);
					expect(range.endContainer).toBe(element);
					expect(range.endOffset).toBe(0);
					expect(range.collapsed).toBe(true);
				});

				it('end after start is ok', function() {
					range.setEnd(element, 1);
					expect(range.endContainer).toBe(element);
					expect(range.endOffset).toBe(1);
					expect(range.startContainer).toBe(document);
					expect(range.startOffset).toBe(0);
					expect(range.collapsed).toBe(false);
				});

				it('can selectNode', function() {
					range.selectNode(element);
					expect(range.startContainer).toBe(document);
					expect(range.startOffset).toBe(0);
					expect(range.endContainer).toBe(document);
					expect(range.endOffset).toBe(1);
					expect(range.collapsed).toBe(false);
				});

				it('can selectNodeContents', function() {
					range.selectNodeContents(element);
					expect(range.startContainer).toBe(element);
					expect(range.startOffset).toBe(0);
					expect(range.endContainer).toBe(element);
					expect(range.endOffset).toBe(1);
					expect(range.collapsed).toBe(false);
				});

				it('can be collapsed to start', function() {
					range.selectNodeContents(element);
					range.collapse(true);
					expect(range.startContainer).toBe(element);
					expect(range.startOffset).toBe(0);
					expect(range.endContainer).toBe(element);
					expect(range.endOffset).toBe(0);
					expect(range.collapsed).toBe(true);
				});

				it('can be collapsed to end', function() {
					range.selectNodeContents(element);
					range.collapse(false);
					expect(range.startContainer).toBe(element);
					expect(range.startOffset).toBe(1);
					expect(range.endContainer).toBe(element);
					expect(range.endOffset).toBe(1);
					expect(range.collapsed).toBe(true);
				});

				it('can be cloned', function() {
					range.selectNodeContents(element);
					var clone = range.cloneRange();
					range.setStart(document, 0);
					range.collapse(true);
					expect(clone.startContainer).toBe(element);
					expect(clone.startOffset).toBe(0);
					expect(clone.endContainer).toBe(element);
					expect(clone.endOffset).toBe(1);
					expect(clone.collapsed).toBe(false);
				});
			});

			describe('under mutations', function() {

				describe('in element', function() {
					beforeEach(function() {
						range.setStart(element, 0);
						range.setEnd(element, 1);
					});

					it('moves positions beyond an insert', function() {
						element.insertBefore(document.createElement('test'), element.firstChild);
						expect(range.startContainer).toBe(element);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(element);
						expect(range.endOffset).toBe(2);
					});

					it('moves positions beyond a remove', function() {
						element.removeChild(element.firstChild);
						expect(range.startContainer).toBe(element);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(element);
						expect(range.endOffset).toBe(0);
					});
				});

				describe('in text', function() {
					beforeEach(function() {
						range.setStart(text, 1);
						range.setEnd(text, 3);
					});

					it('moves positions beyond an insert', function() {
						text.insertData(0, '123');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(4);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(6);
					});

					it('moves positions inside and beyond a delete', function() {
						text.deleteData(0, 2);
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(1);
					});

					it('moves to the start of a replace when inside', function() {
						text.replaceData(1, 2, '123');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(1);
					});

					it('moves positions beyond a replace when the new text is shorter', function() {
						text.replaceData(0, 2, '1');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(2);
					});

					it('moves positions beyond a replace when the new text is longer', function() {
						text.replaceData(0, 2, '123');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(4);
					});

					it('ignores positions before or on an insert', function() {
						text.insertData(3, '123');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(3);
					});

					it('ignores positions before or at the start of a delete', function() {
						text.deleteData(3, 1);
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(3);
					});

					it('ignores positions before or at the start of a replace', function() {
						text.replaceData(3, 1, '123');
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(3);
					});

					it('moves with text splits', function() {
						var secondHalf = text.splitText(2);
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(secondHalf);
						expect(range.endOffset).toBe(1);
					});

					it('does not move with splits of detached text nodes', function() {
						element.removeChild(text);
						range.setStart(text, 1);
						range.setEnd(text, 2);
						var secondHalf = text.splitText(2);
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(1);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(2);
					});

					it('moves with text node deletes during normalization', function() {
						text.deleteData(0, 4);
						element.normalize(true);
						expect(range.startContainer).toBe(element);
						expect(range.startOffset).toBe(0);
						expect(range.endContainer).toBe(element);
						expect(range.endOffset).toBe(0);
					});

					it('moves with text node merges during normalization', function() {
						var otherText = element.appendChild(document.createTextNode('more'));
						range.setStartBefore(otherText);
						range.setEnd(otherText, 2);
						element.normalize(true);
						expect(range.startContainer).toBe(text);
						expect(range.startOffset).toBe(4);
						expect(range.endContainer).toBe(text);
						expect(range.endOffset).toBe(6);
					});
				});
			});
		});
	}
);
