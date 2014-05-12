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
				chai.expect(range.collapsed).to.equal(true);
				chai.expect(range.startContainer).to.equal(document);
				chai.expect(range.endContainer).to.equal(document);
				chai.expect(range.startOffset).to.equal(0);
				chai.expect(range.endOffset).to.equal(0);
			});

			describe('setting positions', function() {
				it('start after end moves end', function() {
					range.setStart(element, 0);
					chai.expect(range.startContainer).to.equal(element);
					chai.expect(range.startOffset).to.equal(0);
					chai.expect(range.endContainer).to.equal(element);
					chai.expect(range.endOffset).to.equal(0);
					chai.expect(range.collapsed).to.equal(true);
				});

				it('end after start is ok', function() {
					range.setEnd(element, 1);
					chai.expect(range.endContainer).to.equal(element);
					chai.expect(range.endOffset).to.equal(1);
					chai.expect(range.startContainer).to.equal(document);
					chai.expect(range.startOffset).to.equal(0);
					chai.expect(range.collapsed).to.equal(false);
				});

				it('can selectNode', function() {
					range.selectNode(element);
					chai.expect(range.startContainer).to.equal(document);
					chai.expect(range.startOffset).to.equal(0);
					chai.expect(range.endContainer).to.equal(document);
					chai.expect(range.endOffset).to.equal(1);
					chai.expect(range.collapsed).to.equal(false);
				});

				it('can selectNodeContents', function() {
					range.selectNodeContents(element);
					chai.expect(range.startContainer).to.equal(element);
					chai.expect(range.startOffset).to.equal(0);
					chai.expect(range.endContainer).to.equal(element);
					chai.expect(range.endOffset).to.equal(1);
					chai.expect(range.collapsed).to.equal(false);
				});

				it('can be collapsed to start', function() {
					range.selectNodeContents(element);
					range.collapse(true);
					chai.expect(range.startContainer).to.equal(element);
					chai.expect(range.startOffset).to.equal(0);
					chai.expect(range.endContainer).to.equal(element);
					chai.expect(range.endOffset).to.equal(0);
					chai.expect(range.collapsed).to.equal(true);
				});

				it('can be collapsed to end', function() {
					range.selectNodeContents(element);
					range.collapse(false);
					chai.expect(range.startContainer).to.equal(element);
					chai.expect(range.startOffset).to.equal(1);
					chai.expect(range.endContainer).to.equal(element);
					chai.expect(range.endOffset).to.equal(1);
					chai.expect(range.collapsed).to.equal(true);
				});

				it('can be cloned', function() {
					range.selectNodeContents(element);
					var clone = range.cloneRange();
					range.setStart(document, 0);
					range.collapse(true);
					chai.expect(clone.startContainer).to.equal(element);
					chai.expect(clone.startOffset).to.equal(0);
					chai.expect(clone.endContainer).to.equal(element);
					chai.expect(clone.endOffset).to.equal(1);
					chai.expect(clone.collapsed).to.equal(false);
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
						chai.expect(range.startContainer).to.equal(element);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(element);
						chai.expect(range.endOffset).to.equal(2);
					});

					it('moves positions beyond a remove', function() {
						element.removeChild(element.firstChild);
						chai.expect(range.startContainer).to.equal(element);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(element);
						chai.expect(range.endOffset).to.equal(0);
					});
				});

				describe('in text', function() {
					beforeEach(function() {
						range.setStart(text, 1);
						range.setEnd(text, 3);
					});

					it('moves positions beyond an insert', function() {
						text.insertData(0, '123');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(4);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(6);
					});

					it('moves positions inside and beyond a delete', function() {
						text.deleteData(0, 2);
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(1);
					});

					it('moves to the start of a replace when inside', function() {
						text.replaceData(1, 2, '123');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(1);
					});

					it('moves positions beyond a replace when the new text is shorter', function() {
						text.replaceData(0, 2, '1');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(2);
					});

					it('moves positions beyond a replace when the new text is longer', function() {
						text.replaceData(0, 2, '123');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(4);
					});

					it('ignores positions before or on an insert', function() {
						text.insertData(3, '123');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(3);
					});

					it('ignores positions before or at the start of a delete', function() {
						text.deleteData(3, 1);
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(3);
					});

					it('ignores positions before or at the start of a replace', function() {
						text.replaceData(3, 1, '123');
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(3);
					});

					it('moves with text splits', function() {
						var secondHalf = text.splitText(2);
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(secondHalf);
						chai.expect(range.endOffset).to.equal(1);
					});

					it('does not move with splits of detached text nodes', function() {
						element.removeChild(text);
						range.setStart(text, 1);
						range.setEnd(text, 2);
						var secondHalf = text.splitText(2);
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(1);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(2);
					});

					it('moves with text node deletes during normalization', function() {
						text.deleteData(0, 4);
						element.normalize(true);
						chai.expect(range.startContainer).to.equal(element);
						chai.expect(range.startOffset).to.equal(0);
						chai.expect(range.endContainer).to.equal(element);
						chai.expect(range.endOffset).to.equal(0);
					});

					it('moves with text node merges during normalization', function() {
						var otherText = element.appendChild(document.createTextNode('more'));
						range.setStartBefore(otherText);
						range.setEnd(otherText, 2);
						element.normalize(true);
						chai.expect(range.startContainer).to.equal(text);
						chai.expect(range.startOffset).to.equal(4);
						chai.expect(range.endContainer).to.equal(text);
						chai.expect(range.endOffset).to.equal(6);
					});
				});
			});
		});
	}
);
