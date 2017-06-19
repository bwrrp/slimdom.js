import * as chai from 'chai';
import * as lolex from 'lolex';
import * as slimdom from '../src/index';

describe('MutationObserver', () => {
	let clock: lolex.Clock;
	before(() => {
		clock = lolex.install();
	});

	after(() => {
		clock.uninstall();
	});

	let document: slimdom.Document;
	let observer: slimdom.MutationObserver;
	let calls: { records: slimdom.MutationRecord[]; observer: slimdom.MutationObserver }[];
	let callbackCalled: boolean;
	function callback(records: slimdom.MutationRecord[], observer: slimdom.MutationObserver) {
		callbackCalled = true;
		calls.push({ records, observer });
	}

	beforeEach(() => {
		document = new slimdom.Document();
		observer = new slimdom.MutationObserver(callback);
		calls = [];
		callbackCalled = false;
	});

	afterEach(() => {
		observer.disconnect();
	});

	interface ExpectedRecord {
		type?: string;
		target?: slimdom.Node;
		oldValue?: string | null;
		attributeName?: string;
		attributeNamespace?: string | null;
		addedNodes?: slimdom.Node[];
		removedNodes?: slimdom.Node[];
		previousSibling?: slimdom.Node | null;
		nextSibling?: slimdom.Node | null;
	}

	function assertRecords(records: slimdom.MutationRecord[], expected: ExpectedRecord[]): void {
		chai.assert.equal(records.length, expected.length);
		expected.forEach((expectedRecord, i) => {
			const actualRecord = records[i];
			Object.keys(expectedRecord).forEach(key => {
				const expectedValue = (expectedRecord as any)[key];
				const actualValue = (actualRecord as any)[key];
				if (Array.isArray(expectedValue)) {
					chai.assert.deepEqual(actualValue, expectedValue, `property ${key} of record ${i}`);
				} else {
					chai.assert.equal(
						actualValue,
						expectedValue,
						`property ${key} of record ${i} is ${actualValue}, expected ${expectedValue}`
					);
				}
			});
		});
	}

	describe('.observe', () => {
		it("throws if options doesn't specify the types of mutation to observe", () => {
			const observer = new slimdom.MutationObserver(() => {});
			chai.assert.throws(() => observer.observe(document, {}), TypeError);
		});

		it('throws if asking for the old value of attributes without observing them', () => {
			const observer = new slimdom.MutationObserver(() => {});
			chai.assert.throws(
				() => observer.observe(document, { attributes: false, attributeOldValue: true, childList: true }),
				TypeError
			);
		});

		it('throws if asking for the old value of character data without observing them', () => {
			const observer = new slimdom.MutationObserver(() => {});
			chai.assert.throws(
				() => observer.observe(document, { characterData: false, characterDataOldValue: true, childList: true }),
				TypeError
			);
		});
	});

	type TestCase = (observer: slimdom.MutationObserver) => ExpectedRecord[] | null;
	const cases: { [description: string]: TestCase } = {
		'responds to text changes': observer => {
			const element = document.createElement('test');
			const text = element.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(element, { subtree: true, characterData: true });

			text.data = 'meep';

			return [{ type: 'characterData', oldValue: null, target: text }];
		},

		'records previous text values': observer => {
			const element = document.createElement('test');
			const text = element.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(element, { subtree: true, characterDataOldValue: true });

			text.data = 'meep';

			return [{ type: 'characterData', oldValue: 'text', target: text }];
		},

		'responds to attribute changes': observer => {
			const element = document.createElement('test');
			element.setAttribute('attr', 'value');
			observer.observe(element, { attributes: true });

			// Even same-value changes generate records
			element.setAttribute('attr', 'value');
			element.setAttributeNS('http://www.example.com/ns', 'prf:attr', 'value');

			return [
				{
					type: 'attributes',
					target: element,
					attributeName: 'attr',
					attributeNamespace: null,
					oldValue: null
				},
				{
					type: 'attributes',
					target: element,
					attributeName: 'attr',
					attributeNamespace: 'http://www.example.com/ns',
					oldValue: null
				}
			];
		},

		'records previous attribute values': observer => {
			const element = document.createElement('test');
			element.setAttribute('attr', 'value');
			observer.observe(element, { attributeOldValue: true });

			// Even same-value changes generate records
			element.setAttribute('attr', 'value');
			element.setAttributeNS('http://www.example.com/ns', 'prf:attr', 'value');

			return [
				{
					type: 'attributes',
					target: element,
					attributeName: 'attr',
					attributeNamespace: null,
					oldValue: 'value'
				},
				{
					type: 'attributes',
					target: element,
					attributeName: 'attr',
					attributeNamespace: 'http://www.example.com/ns',
					oldValue: null
				}
			];
		},

		'responds to insertions (appendChild)': observer => {
			const comment = document.appendChild(document.createComment('test'));
			const element = document.createElement('child');
			observer.observe(document, { childList: true });

			document.appendChild(element);

			return [
				{
					type: 'childList',
					target: document,
					addedNodes: [element],
					removedNodes: [],
					previousSibling: comment,
					nextSibling: null
				}
			];
		},

		'responds to insertions (replaceChild)': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const oldChild = parent.appendChild(document.createElement('old'));
			const newChild = document.createElement('new');
			observer.observe(document, { childList: true, subtree: true });
			parent.replaceChild(newChild, oldChild);

			return [
				{
					type: 'childList',
					target: parent,
					addedNodes: [newChild],
					removedNodes: [oldChild],
					nextSibling: null,
					previousSibling: null
				}
			];
		},

		'responds to moves (insertBefore)': observer => {
			const comment = document.appendChild(document.createComment('comment'));
			const element = document.appendChild(document.createElement('element'));
			const text = element.appendChild(document.createTextNode('text'));
			observer.observe(document, { childList: true, subtree: true });

			element.insertBefore(comment, text);

			return [
				{
					type: 'childList',
					target: document,
					addedNodes: [],
					removedNodes: [comment],
					nextSibling: element,
					previousSibling: null
				},
				{
					type: 'childList',
					target: element,
					addedNodes: [comment],
					removedNodes: [],
					nextSibling: text,
					previousSibling: null
				}
			];
		},

		'does not respond to attribute changes if the attributes option is not set': observer => {
			const element = document.createElement('test');
			observer.observe(element, { attributes: false, childList: true });
			element.setAttribute('test', 'value');

			return null;
		},

		'does not respond to character data changes if the characterData option is not set': observer => {
			const text = document.createTextNode('test');
			observer.observe(text, { childList: true, characterData: false });
			text.nodeValue = 'prrrt';

			return null;
		},

		'does not respond to childList changes if the childList option is not set': observer => {
			const element = document.createElement('test');
			observer.observe(element, { attributes: true, childList: false });
			element.appendChild(document.createElement('child'));

			return null;
		},

		'does not respond to subtree mutations if the subtree option is not set': observer => {
			const element = document.appendChild(document.createElement('test')) as slimdom.Element;
			observer.observe(document, { attributes: true, childList: true });
			element.appendChild(document.createElement('child'));
			element.setAttribute('test', 'value');

			return null;
		},

		'only responds once to subtree mutations, even when observing multiple ancestors': observer => {
			const element = document.appendChild(document.createElement('element'));
			observer.observe(document, { childList: true, subtree: true });
			observer.observe(element, { childList: true, subtree: true });
			const comment = element.appendChild(document.createComment('test'));

			return [
				{
					type: 'childList',
					target: element,
					addedNodes: [comment],
					removedNodes: [],
					previousSibling: null,
					nextSibling: null
				}
			];
		},

		'continues tracking under a removed node until javascript re-enters the event loop': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const child = parent.appendChild(document.createElement('child'));
			const text = child.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			document.removeChild(parent);
			parent.removeChild(child);
			text.data = 'test';

			return [
				{
					type: 'childList',
					target: document,
					removedNodes: [parent]
				},
				{
					type: 'childList',
					target: parent,
					removedNodes: [child]
				},
				{
					type: 'characterData',
					target: text,
					oldValue: 'text'
				}
			];
		},

		'does not add transient registered observers for non-subtree observers': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const child = parent.appendChild(document.createElement('child'));
			const text = child.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(document, { childList: true, characterDataOldValue: true, subtree: false });
			document.removeChild(parent);
			parent.removeChild(child);
			text.data = 'test';

			return [
				{
					type: 'childList',
					target: document,
					removedNodes: [parent]
				}
			];
		},

		'removes transient observers when observe is called for the same observer': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const child = parent.appendChild(document.createElement('child'));
			const text = child.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			document.removeChild(parent);
			observer.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			parent.removeChild(child);
			text.data = 'test';

			return [
				{
					type: 'childList',
					target: document,
					removedNodes: [parent]
				}
			];
		},

		'does not remove transient observers when observe is called for a different observer': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const child = parent.appendChild(document.createElement('child'));
			const text = child.appendChild(document.createTextNode('text')) as slimdom.Text;
			observer.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			const otherObserver = new slimdom.MutationObserver(callback);
			otherObserver.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			document.removeChild(parent);
			otherObserver.observe(document, { childList: true, characterDataOldValue: true, subtree: true });
			parent.removeChild(child);
			text.data = 'test';

			assertRecords(otherObserver.takeRecords(), [
				{
					type: 'childList',
					target: document,
					removedNodes: [parent]
				}
			]);

			return [
				{
					type: 'childList',
					target: document,
					removedNodes: [parent]
				},
				{
					type: 'childList',
					target: parent,
					removedNodes: [child]
				},
				{
					type: 'characterData',
					target: text,
					oldValue: 'text'
				}
			];
		},

		'does not remove transient observers when observe is called for a different subtree': observer => {
			const parent = document.appendChild(document.createElement('parent'));
			const child1 = parent.appendChild(document.createElement('child1'));
			const child2 = parent.appendChild(document.createElement('child2'));
			observer.observe(parent, { childList: true, subtree: true });
			observer.observe(child1, { childList: true, subtree: true });
			observer.observe(child2, { childList: true, subtree: true });
			parent.removeChild(child1);
			observer.observe(child2, { childList: true, subtree: true });
			const comment1 = child1.appendChild(document.createComment('test'));
			const comment2 = child2.appendChild(document.createComment('test'));

			return [
				{
					type: 'childList',
					target: parent,
					removedNodes: [child1]
				},
				{
					type: 'childList',
					target: child1,
					addedNodes: [comment1]
				},
				{
					type: 'childList',
					target: child2,
					addedNodes: [comment2]
				}
			];
		},

		'does not observe after being disconnected': observer => {
			observer.observe(document, { childList: true });
			observer.disconnect();
			document.appendChild(document.createComment('test'));

			return null;
		},

		'does not affect other observers when disconnected': observer => {
			const otherObserver = new slimdom.MutationObserver(callback);
			otherObserver.observe(document, { childList: true, subtree: true });
			observer.observe(document, { childList: true });
			observer.disconnect();
			const comment = document.appendChild(document.createComment('test'));

			assertRecords(otherObserver.takeRecords(), [
				{
					type: 'childList',
					target: document,
					addedNodes: [comment]
				}
			]);

			return null;
		}
	};

	describe('synchronous usage', () => {
		Object.keys(cases).forEach(description => {
			const testCase = cases[description];
			it(description, () => {
				const expected = testCase(observer) || [];

				const records = observer.takeRecords();
				assertRecords(records, expected);

				clock.tick(100);

				chai.assert(!callbackCalled, 'callback was not called');
			});
		});
	});

	describe('asynchronous usage', () => {
		let observer: slimdom.MutationObserver;
		beforeEach(() => {
			observer = new slimdom.MutationObserver(callback);
		});

		afterEach(() => {
			observer.disconnect();
		});

		Object.keys(cases).forEach(description => {
			const testCase = cases[description];
			it(description, () => {
				const expected = testCase(observer);

				clock.tick(100);

				if (expected !== null) {
					chai.assert(callbackCalled, 'callback was called');
					chai.assert.equal(calls.length, 1);
					chai.assert.equal(calls[0].observer, observer);
					assertRecords(calls[0].records, expected);
				} else {
					chai.assert(!callbackCalled, 'callback was not called');
				}
			});
		});
	});
});
