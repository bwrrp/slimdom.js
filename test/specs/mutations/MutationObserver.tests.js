define(
	[
		'slimdom'
	],
	function(
		slimdom
		) {
		'use strict';

		describe('MutationObserver', function() {
			var document,
				element,
				text,
				observer,
				callback,
				clock;

			before(function() {
				clock = sinon.useFakeTimers();
			});

			after(function() {
				clock.restore();
			});

			beforeEach(function() {
				callback = sinon.spy();

				document = slimdom.createDocument();
				element = document.appendChild(document.createElement('root'));
				text = element.appendChild(document.createTextNode('text'));
				observer = new slimdom.MutationObserver(callback);
				observer.observe(element, {
					subtree: true,
					characterData: true,
					childList: true,
					attributes: true,
					userData: true
				});
			});

			afterEach(function() {
				observer.disconnect();
			});

			describe('synchronous usage', function() {
				it('responds to text changes', function(done) {
					text.data = 'meep';

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('characterData');
					chai.expect(queue[0].oldValue).to.equal('text');
					chai.expect(queue[0].target).to.equal(text);

					clock.tick(100);
					chai.expect(callback).to.not.have.been.called;
					done();
				});

				it('responds to attribute changes', function(done) {
					element.setAttribute('test', 'meep');

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('attributes');
					chai.expect(queue[0].attributeName).to.equal('test');
					chai.expect(queue[0].oldValue).to.be.null;
					chai.expect(queue[0].target).to.equal(element);

					clock.tick(100);
					chai.expect(callback).to.not.have.been.called;
					done();
				});

				it('ignores same-value attribute changes', function(done) {
					element.setAttribute('test', 'meep');
					var queue = observer.takeRecords();

					element.setAttribute('test', 'meep');

					queue = observer.takeRecords();
					chai.expect(queue).to.deep.equal([]);

					clock.tick(100);
					chai.expect(callback).to.not.have.been.called;
					done();
				});

				it('records previous attribute values', function(done) {
					element.setAttribute('test', 'meep');
					var queue = observer.takeRecords();

					element.setAttribute('test', 'maap');

					queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('attributes');
					chai.expect(queue[0].attributeName).to.equal('test');
					chai.expect(queue[0].oldValue).to.equal('meep');
					chai.expect(queue[0].target).to.equal(element);

					clock.tick(100);
					chai.expect(callback).to.not.have.been.called;
					done();
				});

				it('responds to userData changes', function(done) {
					var data = {};
					element.setUserData('test', data);

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('userData');
					chai.expect(queue[0].attributeName).to.equal('test');
					chai.expect(queue[0].oldValue).to.be.null;
					chai.expect(queue[0].target).to.equal(element);

					clock.tick(100);
					chai.expect(callback).to.not.have.been.called;
					done();
				});

				it('responds to insertions (appendChild)', function() {
					var newElement = document.createElement('meep');
					element.appendChild(newElement);

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('childList');
					chai.expect(queue[0].addedNodes).to.deep.equal([newElement]);
					chai.expect(queue[0].removedNodes).to.deep.equal([]);
					chai.expect(queue[0].previousSibling).to.equal(text);
					chai.expect(queue[0].nextSibling).to.be.null;
				});

				it('responds to insertions (replaceChild)', function() {
					var newElement = document.createElement('meep');
					element.replaceChild(newElement, text);

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('childList');
					chai.expect(queue[0].addedNodes).to.deep.equal([newElement]);
					chai.expect(queue[0].removedNodes).to.deep.equal([text]);
					chai.expect(queue[0].previousSibling).to.be.null;
					chai.expect(queue[0].nextSibling).to.be.null;
				});

				it('responds to moves (insertBefore)', function() {
					var newElement = document.createElement('meep');
					element.appendChild(newElement);
					observer.takeRecords();

					element.insertBefore(newElement, text);

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('childList');
					chai.expect(queue[0].addedNodes).to.deep.equal([]);
					chai.expect(queue[0].removedNodes).to.deep.equal([newElement]);
					chai.expect(queue[0].previousSibling).to.equal(text);
					chai.expect(queue[0].nextSibling).to.be.null;

					chai.expect(queue[1].type).to.equal('childList');
					chai.expect(queue[1].addedNodes).to.deep.equal([newElement]);
					chai.expect(queue[1].removedNodes).to.deep.equal([]);
					chai.expect(queue[1].previousSibling).to.be.null;
					chai.expect(queue[1].nextSibling).to.equal(text);
				});

				it('responds to moves (replaceChild)', function() {
					var newElement = document.createElement('meep');
					element.appendChild(newElement);
					observer.takeRecords();

					element.replaceChild(newElement, text);

					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('childList');
					chai.expect(queue[0].addedNodes).to.deep.equal([]);
					chai.expect(queue[0].removedNodes).to.deep.equal([newElement]);
					chai.expect(queue[0].previousSibling).to.equal(text);
					chai.expect(queue[0].nextSibling).to.be.null;

					chai.expect(queue[1].type).to.equal('childList');
					chai.expect(queue[1].addedNodes).to.deep.equal([newElement]);
					chai.expect(queue[1].removedNodes).to.deep.equal([text]);
					chai.expect(queue[1].previousSibling).to.be.null;
					chai.expect(queue[1].nextSibling).to.be.null;
				});

				it('continues tracking under a removed node until javascript re-enters the event loop', function() {
					var newElement = element.appendChild(document.createElement('meep')),
						newText = newElement.appendChild(document.createTextNode('test'));
					element.appendChild(newElement);
					observer.takeRecords();

					element.removeChild(newElement);
					observer.takeRecords();

					newText.replaceData(0, text.length, 'meep');
					var queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('characterData');
					chai.expect(queue[0].oldValue).to.equal('test');
					chai.expect(queue[0].target).to.equal(newText);

					newElement.removeChild(newText);
					queue = observer.takeRecords();
					chai.expect(queue[0].type).to.equal('childList');
					chai.expect(queue[0].target).to.equal(newElement);
					chai.expect(queue[0].removedNodes[0]).to.equal(newText);
				});
			});

			describe('asynchronous usage', function() {
				it('responds to text changes', function(done) {
					text.data = 'meep';

					clock.tick(100);
					chai.expect(callback).to.have.been.called;
					chai.expect(callback.args[0][0][0].type).to.equal('characterData');
					chai.expect(callback.args[0][0][0].oldValue).to.equal('text');
					chai.expect(callback.args[0][0][0].target).to.equal(text);
					done();
				});
			});
		});
	}
);
