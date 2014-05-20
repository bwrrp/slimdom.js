define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('Text', function() {
			var document,
				text;
			beforeEach(function() {
				document = slimdom.createDocument();
				text = document.createTextNode('text');
			});

			it('has nodeType 3', function() {
				chai.expect(text.nodeType).to.equal(3);
			});

			it('has data', function() {
				chai.expect(text.data).to.equal('text');
			});

			it('can set data property', function() {
				// change the value
				var newValue = 'a new text value';
				text.data = newValue;
				chai.expect(text.data).to.equal(newValue);
				chai.expect(text.nodeValue).to.equal(newValue);
				chai.expect(text.length).to.equal(newValue.length);
			});

			it('has nodeValue', function() {
				chai.expect(text.nodeValue).to.equal('text');
			});

			it('can not set nodeValue property', function() {
				// change the value
				var newValue = 'a new text value';
				chai.expect(function() {
					text.nodeValue = newValue;
				}).to.throw();
			});

			it('has a length', function() {
				chai.expect(text.length).to.equal(4);
			});

			it('cannot write to length property', function() {
				chai.expect(function() {
					text.length = 12;
				}).to.throw();
			});

			// TODO: wholeText not yet supported
			//it('has wholeText', function() {
			//	chai.expect(text.wholeText).to.equal('text');
			//})

			it('can be cloned', function() {
				var clone = text.cloneNode(true);
				chai.expect(clone.nodeType).to.equal(3);
				chai.expect(clone.nodeValue).to.equal('text');
				chai.expect(clone.data).to.equal('text');
				chai.expect(clone).not.to.equal(text);
			});

			it('can substring its data', function() {
				chai.expect(text.substringData(0, 2)).to.equal('te');
				chai.expect(text.substringData(2, 2)).to.equal('xt');
				chai.expect(text.substringData(1, 2)).to.equal('ex');
				chai.expect(text.substringData(2)).to.equal('xt');
			});

			it('can appendData', function() {
				text.appendData('123');
				chai.expect(text.data).to.equal('text123');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(7);
			});

			it('can insertData', function() {
				text.insertData(2, '123');
				chai.expect(text.data).to.equal('te123xt');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(7);

				text.insertData(-100, '123');
				chai.expect(text.data).to.equal('123te123xt');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(10);

				text.insertData(100, '123');
				chai.expect(text.data).to.equal('123te123xt123');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(13);
			});

			it('can deleteData', function() {
				text.deleteData(0, 0);
				chai.expect(text.data).to.equal('text');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(4);

				text.deleteData(-100, 1);
				chai.expect(text.data).to.equal('text');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(4);

				text.deleteData(100, 2);
				chai.expect(text.data).to.equal('text');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(4);

				text.deleteData(1, 1);
				chai.expect(text.data).to.equal('txt');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(3);

				text.deleteData(2);
				chai.expect(text.data).to.equal('tx');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(2);
			});

			it('can replaceData', function() {
				text.replaceData(0, 0, '');
				chai.expect(text.data).to.equal('text');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(4);

				text.replaceData(-100, 10, 'asd');
				chai.expect(text.data).to.equal('asdtext');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(7);

				text.replaceData(100, 10, 'asd');
				chai.expect(text.data).to.equal('asdtextasd');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(10);

				text.replaceData(3, 4, 'asd');
				chai.expect(text.data).to.equal('asdasdasd');
				chai.expect(text.nodeValue).to.equal(text.data);
				chai.expect(text.length).to.equal(9);
			});

			describe('splitting', function() {
				it('can be split', function() {
					var otherHalf = text.splitText(2);
					chai.expect(text.data).to.equal('te');
					chai.expect(text.nodeValue).to.equal(text.data);
					chai.expect(otherHalf.data).to.equal('xt');
					chai.expect(otherHalf.nodeValue).to.equal(otherHalf.data);
				});
				
				describe('under a parent', function() {
					var element,
						otherHalf;
					beforeEach(function() {
						element = document.createElement('parent');
						element.appendChild(text);
						otherHalf = text.splitText(2);
					});

					it('is split correctly', function() {
						chai.expect(text.data).to.equal('te');
						chai.expect(text.nodeValue).to.equal(text.data);
						chai.expect(otherHalf.data).to.equal('xt');
						chai.expect(otherHalf.nodeValue).to.equal(otherHalf.data);
					});

					it('both halves are children of the parent', function() {
						chai.expect(text.parentNode).to.equal(element);
						chai.expect(otherHalf.parentNode).to.equal(element);
					});

					it('both halves are siblings', function() {
						chai.expect(text.nextSibling).to.equal(otherHalf);
						chai.expect(otherHalf.previousSibling).to.equal(text);
					});

					// TODO: wholeText not yet supported
					//it('has wholeText', function() {
					//	chai.expect(text.wholeText).to.equal('text');
					//	chai.expect(otherHalf.wholeText).to.equal('text');
					//});
				});
			});
		});
	}
);
