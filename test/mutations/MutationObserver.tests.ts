import slimdom from '../../src/index';

import Document from '../../src/Document';
import Element from '../../src/Element';
import Text from '../../src/Text';
import MutationObserver from '../../src/mutations/MutationObserver';

import * as chai from 'chai';
import * as lolex from 'lolex';

describe('MutationObserver', () => {
	let clock: lolex.Clock;
	before(() => {
		clock = lolex.install();
	});

	after(() => {
		clock.uninstall();
	});

	let callbackCalled: boolean;
	let callbackArgs = [];
	function callback (...args) {
		callbackCalled = true;
		callbackArgs.push(args);
	}

	let document: Document;
	let element: Element;
	let text: Text;
	let observer: MutationObserver;
	beforeEach(() => {
		callbackCalled = false;
		callbackArgs.length = 0;

		document = slimdom.createDocument();
		element = document.appendChild(document.createElement('root')) as Element;
		text = element.appendChild(document.createTextNode('text')) as Text;
		observer = new slimdom.MutationObserver(callback);
		observer.observe(element, {
			subtree: true,
			characterData: true,
			childList: true,
			attributes: true,
			userData: true
		});
	});

	afterEach(() => {
		observer.disconnect();
	});

	describe('synchronous usage', () => {
		it('responds to text changes', () => {
			text.data = 'meep';

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'characterData');
			chai.assert.equal(queue[0].oldValue, 'text');
			chai.assert.equal(queue[0].target, text);

			clock.tick(100);
			chai.assert(!callbackCalled, 'callback was not called');
		});

		it('responds to attribute changes', () => {
			element.setAttribute('test', 'meep');

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'attributes');
			chai.assert.equal(queue[0].attributeName, 'test');
			chai.assert.equal(queue[0].oldValue, null);
			chai.assert.equal(queue[0].target, element);

			clock.tick(100);
			chai.assert(!callbackCalled, 'callback was not called');
		});

		it('ignores same-value attribute changes', () => {
			element.setAttribute('test', 'meep');
			let queue = observer.takeRecords();

			element.setAttribute('test', 'meep');

			queue = observer.takeRecords();
			chai.assert.deepEqual(queue, []);

			clock.tick(100);
			chai.assert(!callbackCalled, 'callback was not called');
		});

		it('records previous attribute values', () => {
			element.setAttribute('test', 'meep');
			let queue = observer.takeRecords();

			element.setAttribute('test', 'maap');

			queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'attributes');
			chai.assert.equal(queue[0].attributeName, 'test');
			chai.assert.equal(queue[0].oldValue, 'meep');
			chai.assert.equal(queue[0].target, element);

			clock.tick(100);
			chai.assert(!callbackCalled, 'callback was not called');
		});

		it('responds to userData changes', () => {
			const data = {};
			element.setUserData('test', data);

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'userData');
			chai.assert.equal(queue[0].attributeName, 'test');
			chai.assert.equal(queue[0].oldValue, null);
			chai.assert.equal(queue[0].target, element);

			clock.tick(100);
			chai.assert(!callbackCalled, 'callback was not called');
		});

		it('responds to insertions (appendChild)', () => {
			const newElement = document.createElement('meep');
			element.appendChild(newElement);

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'childList');
			chai.assert.deepEqual(queue[0].addedNodes, [ newElement ]);
			chai.assert.deepEqual(queue[0].removedNodes, []);
			chai.assert.equal(queue[0].previousSibling, text);
			chai.assert.equal(queue[0].nextSibling, null);
		});

		it('responds to insertions (replaceChild)', () => {
			const newElement = document.createElement('meep');
			element.replaceChild(newElement, text);

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'childList');
			chai.assert.deepEqual(queue[0].addedNodes, [ newElement ]);
			chai.assert.deepEqual(queue[0].removedNodes, [ text ]);
			chai.assert.equal(queue[0].previousSibling, null);
			chai.assert.equal(queue[0].nextSibling, null);
		});

		it('responds to moves (insertBefore)', () => {
			const newElement = document.createElement('meep');
			element.appendChild(newElement);
			observer.takeRecords();

			element.insertBefore(newElement, text);

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'childList');
			chai.assert.deepEqual(queue[0].addedNodes, []);
			chai.assert.deepEqual(queue[0].removedNodes, [ newElement ]);
			chai.assert.equal(queue[0].previousSibling, text);
			chai.assert.equal(queue[0].nextSibling, null);

			chai.assert.equal(queue[1].type, 'childList');
			chai.assert.deepEqual(queue[1].addedNodes, [ newElement ]);
			chai.assert.deepEqual(queue[1].removedNodes, []);
			chai.assert.equal(queue[1].previousSibling, null);
			chai.assert.equal(queue[1].nextSibling, text);
		});

		it('responds to moves (replaceChild)', () => {
			const newElement = document.createElement('meep');
			element.appendChild(newElement);
			observer.takeRecords();

			element.replaceChild(newElement, text);

			const queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'childList');
			chai.assert.deepEqual(queue[0].addedNodes, []);
			chai.assert.deepEqual(queue[0].removedNodes, [ newElement ]);
			chai.assert.equal(queue[0].previousSibling, text);
			chai.assert.equal(queue[0].nextSibling, null);

			chai.assert.equal(queue[1].type, 'childList');
			chai.assert.deepEqual(queue[1].addedNodes, [ newElement ]);
			chai.assert.deepEqual(queue[1].removedNodes, [ text ]);
			chai.assert.equal(queue[1].previousSibling, null);
			chai.assert.equal(queue[1].nextSibling, null);
		});

		it('continues tracking under a removed node until javascript re-enters the event loop', () => {
			const newElement = element.appendChild(document.createElement('meep'));
			const newText = newElement.appendChild(document.createTextNode('test')) as Text;
			element.appendChild(newElement);
			observer.takeRecords();

			element.removeChild(newElement);
			observer.takeRecords();

			newText.replaceData(0, text.length, 'meep');
			let queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'characterData');
			chai.assert.equal(queue[0].oldValue, 'test');
			chai.assert.equal(queue[0].target, newText);

			newElement.removeChild(newText);
			queue = observer.takeRecords();
			chai.assert.equal(queue[0].type, 'childList');
			chai.assert.equal(queue[0].target, newElement);
			chai.assert.equal(queue[0].removedNodes[0], newText);
		});
	});

	describe('asynchronous usage', () => {
		it('responds to text changes', () => {
			text.data = 'meep';

			clock.tick(100);
			chai.assert(callbackCalled, 'callback was called');
			chai.assert.equal(callbackArgs[0][0][0].type, 'characterData');
			chai.assert.equal(callbackArgs[0][0][0].oldValue, 'text');
			chai.assert.equal(callbackArgs[0][0][0].target, text);
		});
	});
});
