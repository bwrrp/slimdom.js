define(
	[
		'slimdom'
	],
	function(slimdom) {
		'use strict';

		describe('MutationObserver', function() {
			var document,
				element,
				text,
				observer,
				callback;

			beforeEach(function() {
				callback = jasmine.createSpy('callback');
				jasmine.Clock.useMock();

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
				it('responds to text changes', function() {
					// TODO: direct assignment not yet detected
					//text.data = 'meep';
					text.replaceData(0, text.length(), 'meep');

					var queue = observer.takeRecords();
					expect(queue[0].type).toBe('characterData');
					expect(queue[0].oldValue).toBe('text');
					expect(queue[0].target).toBe(text);

					jasmine.Clock.tick(100);
					expect(callback).not.toHaveBeenCalled();
				});

				it('responds to attribute changes', function() {
					element.setAttribute('test', 'meep');

					var queue = observer.takeRecords();
					expect(queue[0].type).toBe('attributes');
					expect(queue[0].attributeName).toBe('test');
					expect(queue[0].oldValue).toBeNull();
					expect(queue[0].target).toBe(element);

					jasmine.Clock.tick(100);
					expect(callback).not.toHaveBeenCalled();
				});

				it('ignores same-value attribute changes', function() {
					element.setAttribute('test', 'meep');
					var queue = observer.takeRecords();

					element.setAttribute('test', 'meep');

					queue = observer.takeRecords();
					expect(queue).toEqual([]);

					jasmine.Clock.tick(100);
					expect(callback).not.toHaveBeenCalled();
				});

				it('records previous attribute values', function() {
					element.setAttribute('test', 'meep');
					var queue = observer.takeRecords();

					element.setAttribute('test', 'maap');

					queue = observer.takeRecords();
					expect(queue[0].type).toBe('attributes');
					expect(queue[0].attributeName).toBe('test');
					expect(queue[0].oldValue).toBe('meep');
					expect(queue[0].target).toBe(element);

					jasmine.Clock.tick(100);
					expect(callback).not.toHaveBeenCalled();
				});

				it('responds to userData changes', function() {
					var data = {};
					element.setUserData('test', data);

					var queue = observer.takeRecords();
					expect(queue[0].type).toBe('userData');
					expect(queue[0].attributeName).toBe('test');
					expect(queue[0].oldValue).toBeNull();
					expect(queue[0].target).toBe(element);

					jasmine.Clock.tick(100);
					expect(callback).not.toHaveBeenCalled();
				});

				it('responds to hierarchy changes', function() {
					var newElement = document.createElement('meep');
					element.appendChild(newElement);

					var queue = observer.takeRecords();
					expect(queue[0].type).toBe('childList');
					expect(queue[0].addedNodes).toEqual([newElement]);
					expect(queue[0].removedNodes).toEqual([]);
					expect(queue[0].previousSibling).toBe(text);
					expect(queue[0].nextSibling).toBeNull();
				});

				it('continues tracking under a removed node until javascript re-enters the event loop', function() {
					var newElement = element.appendChild(document.createElement('meep')),
						newText = newElement.appendChild(document.createTextNode('test'));
					element.appendChild(newElement);
					observer.takeRecords();

					element.removeChild(newElement);
					observer.takeRecords();

					newText.replaceData(0, text.length(), 'meep');
					var queue = observer.takeRecords();
					expect(queue[0].type).toBe('characterData');
					expect(queue[0].oldValue).toBe('test');
					expect(queue[0].target).toBe(newText);

					newElement.removeChild(newText);
					queue = observer.takeRecords();
					expect(queue[0].type).toBe('childList');
					expect(queue[0].target).toBe(newElement);
					expect(queue[0].removedNodes[0]).toBe(newText);
				});
			});

			describe('asynchronous usage', function() {
				it('responds to text changes', function() {
					// TODO: direct assignment not yet detected
					//text.data = 'meep';
					text.replaceData(0, text.length(), 'meep');

					jasmine.Clock.tick(100);
					expect(callback).toHaveBeenCalled();
					var queue = callback.mostRecentCall.args[0];
					expect(queue[0].type).toBe('characterData');
					expect(queue[0].oldValue).toBe('text');
					expect(queue[0].target).toBe(text);
				});
			});
		});
	}
);
