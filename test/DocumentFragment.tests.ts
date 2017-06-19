import * as chai from 'chai';
import * as slimdom from '../src/index';

describe('DocumentFragment', () => {
	let document: slimdom.Document;
	let fragment: slimdom.DocumentFragment;
	beforeEach(() => {
		document = new slimdom.Document();
		fragment = document.createDocumentFragment();
	});

	it('can be created using Document#createDocumentFragment()', () => {
		const df = document.createDocumentFragment();
		chai.assert.equal(df.nodeType, 11);
		chai.assert.equal(df.nodeName, '#document-fragment');
		chai.assert.equal(df.nodeValue, null);
	});

	it('can not change its nodeValue', () => {
		fragment.nodeValue = 'test';
		chai.assert.equal(fragment.nodeValue, null);
	});

	it('can not lookup namespaces or prefixes', () => {
		fragment.appendChild(document.createElementNS('http://www.example.com/ns', 'prf:test'));
		chai.assert.equal(fragment.lookupNamespaceURI('prf'), null);
		chai.assert.equal(fragment.lookupPrefix('http://www.example.com/ns'), null);
	});

	it('initially has no childNodes', () => chai.assert.deepEqual(fragment.childNodes, []));

	it('initially has no children', () => chai.assert.deepEqual(fragment.children, []));

	it('correctly updates its relation properties when children are added', () => {
		const child1 = fragment.appendChild(document.createElement('child1')) as slimdom.Element;
		const text = fragment.appendChild(document.createTextNode('text'));
		const child2 = fragment.appendChild(document.createElement('child2')) as slimdom.Element;
		const pi = fragment.appendChild(document.createProcessingInstruction('target', 'data'));
		const child3 = fragment.appendChild(document.createElement('child3')) as slimdom.Element;
		chai.assert.deepEqual(fragment.childNodes, [child1, text, child2, pi, child3]);
		chai.assert.deepEqual(fragment.children, [child1, child2, child3]);
		chai.assert.equal(fragment.firstElementChild, child1);
		chai.assert.equal(fragment.firstElementChild!.nextElementSibling, child2);
		chai.assert.equal(fragment.lastElementChild!.previousElementSibling, child2);
		chai.assert.equal(fragment.lastElementChild, child3);
		fragment.removeChild(child2);
		chai.assert.deepEqual(fragment.childNodes, [child1, text, pi, child3]);
		chai.assert.deepEqual(fragment.children, [child1, child3]);
		chai.assert.equal(fragment.firstElementChild, child1);
		chai.assert.equal(fragment.firstElementChild!.nextElementSibling, child3);
		chai.assert.equal(fragment.lastElementChild!.previousElementSibling, child1);
		chai.assert.equal(fragment.lastElementChild, child3);
	});

	it('inserts its children if inserted under another node', () => {
		const child1 = fragment.appendChild(document.createElement('child1')) as slimdom.Element;
		const text = fragment.appendChild(document.createTextNode('text'));
		const child2 = fragment.appendChild(document.createElement('child2')) as slimdom.Element;
		const pi = fragment.appendChild(document.createProcessingInstruction('target', 'data'));
		const child3 = fragment.appendChild(document.createElement('child3')) as slimdom.Element;
		const parent = document.createElement('parent');
		const existingChild = parent.appendChild(document.createComment('test'));
		parent.insertBefore(fragment, existingChild);
		chai.assert.deepEqual(parent.childNodes, [child1, text, child2, pi, child3, existingChild]);
		chai.assert.deepEqual(parent.children, [child1, child2, child3]);
		chai.assert.equal(parent.firstElementChild, child1);
		chai.assert.equal(parent.firstElementChild!.nextElementSibling, child2);
		chai.assert.equal(parent.lastElementChild!.previousElementSibling, child2);
		chai.assert.equal(parent.lastElementChild, child3);
	});

	describe('.cloneNode', () => {
		beforeEach(() => {
			fragment.appendChild(document.createElement('root'));
		});

		it('can be cloned (shallow)', () => {
			const copy = fragment.cloneNode() as slimdom.DocumentFragment;

			chai.assert.equal(copy.nodeType, 11);
			chai.assert.equal(copy.nodeName, '#document-fragment');
			chai.assert.equal(copy.nodeValue, null);

			chai.assert.equal(copy.firstChild, null);

			chai.assert.notEqual(copy, fragment);
		});

		it('can be cloned (deep)', () => {
			const copy = fragment.cloneNode(true) as slimdom.DocumentFragment;

			chai.assert.equal(copy.nodeType, 11);
			chai.assert.equal(copy.nodeName, '#document-fragment');
			chai.assert.equal(copy.nodeValue, null);

			chai.assert.equal(copy.firstChild!.nodeName, 'root');

			chai.assert.notEqual(copy, document);
			chai.assert.notEqual(copy.firstChild, fragment.firstChild);
		});
	});
});
