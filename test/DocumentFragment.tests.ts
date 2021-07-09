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
		expect(df.nodeType).toBe(11);
		expect(df.nodeName).toBe('#document-fragment');
		expect(df.nodeValue).toBe(null);
		expect(df.ownerDocument).toBe(document);
	});

	it('can be created using its constructor', () => {
		const df = new slimdom.DocumentFragment();
		expect(df.nodeType).toBe(11);
		expect(df.nodeName).toBe('#document-fragment');
		expect(df.nodeValue).toBe(null);
		expect(df.ownerDocument).toBe(slimdom.document);
	});

	it('can not change its nodeValue', () => {
		fragment.nodeValue = 'test';
		expect(fragment.nodeValue).toBe(null);
	});

	it('can change its textContent, replacing its existing children', () => {
		fragment
			.appendChild(document.createElement('oldChild'))
			.appendChild(document.createTextNode('old'));
		fragment.appendChild(document.createCDATASection('text'));
		expect(fragment.textContent).toBe('oldtext');

		fragment.textContent = 'test';
		expect(fragment.textContent).toBe('test');
		expect(fragment.childNodes.length).toBe(1);
		expect(fragment.firstChild!.nodeType).toBe(3);

		fragment.textContent = null;
		expect(fragment.textContent).toBe('');
		expect(fragment.childNodes.length).toBe(0);
	});

	it('can not lookup namespaces or prefixes', () => {
		fragment.appendChild(document.createElementNS('http://www.example.com/ns', 'prf:test'));
		expect(fragment.lookupNamespaceURI('prf')).toBe(null);
		expect(fragment.lookupPrefix('http://www.example.com/ns')).toBe(null);
	});

	it('initially has no childNodes', () => expect(fragment.childNodes).toEqual([]));

	it('initially has no children', () => expect(fragment.children).toEqual([]));

	it('correctly updates its relation properties when children are added', () => {
		const child1 = fragment.appendChild(document.createElement('child1'));
		const text = fragment.appendChild(document.createTextNode('text'));
		const child2 = fragment.appendChild(document.createElement('child2'));
		const pi = fragment.appendChild(document.createProcessingInstruction('target', 'data'));
		const child3 = fragment.appendChild(document.createElement('child3'));
		expect(fragment.childNodes).toEqual([child1, text, child2, pi, child3]);
		expect(fragment.children).toEqual([child1, child2, child3]);
		expect(fragment.firstElementChild).toBe(child1);
		expect(fragment.firstElementChild!.nextElementSibling).toBe(child2);
		expect(fragment.lastElementChild!.previousElementSibling).toBe(child2);
		expect(fragment.lastElementChild).toBe(child3);
		fragment.removeChild(child2);
		expect(fragment.childNodes).toEqual([child1, text, pi, child3]);
		expect(fragment.children).toEqual([child1, child3]);
		expect(fragment.firstElementChild).toBe(child1);
		expect(fragment.firstElementChild!.nextElementSibling).toBe(child3);
		expect(fragment.lastElementChild!.previousElementSibling).toBe(child1);
		expect(fragment.lastElementChild).toBe(child3);
	});

	it('inserts its children if inserted under another node', () => {
		const child1 = fragment.appendChild(document.createElement('child1'));
		const text = fragment.appendChild(document.createTextNode('text'));
		const child2 = fragment.appendChild(document.createElement('child2'));
		const pi = fragment.appendChild(document.createProcessingInstruction('target', 'data'));
		const child3 = fragment.appendChild(document.createElement('child3'));
		const parent = document.createElement('parent');
		const existingChild = parent.appendChild(document.createComment('test'));
		parent.insertBefore(fragment, existingChild);
		expect(parent.childNodes).toEqual([child1, text, child2, pi, child3, existingChild]);
		expect(parent.children).toEqual([child1, child2, child3]);
		expect(parent.firstElementChild).toBe(child1);
		expect(parent.firstElementChild!.nextElementSibling).toBe(child2);
		expect(parent.lastElementChild!.previousElementSibling).toBe(child2);
		expect(parent.lastElementChild).toBe(child3);
	});

	describe('.cloneNode', () => {
		beforeEach(() => {
			fragment.appendChild(document.createElement('root'));
		});

		it('can be cloned (shallow)', () => {
			const copy = fragment.cloneNode();

			expect(copy.nodeType).toBe(11);
			expect(copy.nodeName).toBe('#document-fragment');
			expect(copy.nodeValue).toBe(null);

			expect(copy.firstChild).toBe(null);

			expect(copy).not.toBe(fragment);
		});

		it('can be cloned (deep)', () => {
			const copy = fragment.cloneNode(true);

			expect(copy.nodeType).toBe(11);
			expect(copy.nodeName).toBe('#document-fragment');
			expect(copy.nodeValue).toBe(null);

			expect(copy.firstChild!.nodeName).toBe('root');

			expect(copy).not.toBe(document);
			expect(copy.firstChild).not.toBe(fragment.firstChild);
		});
	});

	describe('.prepend', () => {
		it('can add nodes at the start', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			fragment.prepend(comment, 'text', pi);

			expect(fragment.firstChild).toBe(comment);
			expect(fragment.firstChild!.nextSibling!.nodeType).toBe(slimdom.Node.TEXT_NODE);
			expect((fragment.firstChild!.nextSibling as slimdom.Text).data).toBe('text');
			expect(fragment.firstChild!.nextSibling!.nextSibling).toBe(pi);
		});
	});

	describe('.append', () => {
		it('can add nodes at the end', () => {
			const comment = document.createComment('test');
			const pi = document.createProcessingInstruction('target', 'data');
			fragment.append(comment, 'text', pi);

			expect(fragment.lastChild!.previousSibling!.previousSibling).toBe(comment);
			expect(fragment.lastChild!.previousSibling!.nodeType).toBe(slimdom.Node.TEXT_NODE);
			expect((fragment.lastChild!.previousSibling as slimdom.Text).data).toBe('text');
			expect(fragment.lastChild).toBe(pi);
		});
	});

	describe('.replaceChildren', () => {
		it('can replace all children', () => {
			const comment = fragment.appendChild(document.createComment('test'));
			const pi = document.createProcessingInstruction('target', 'data');
			fragment.replaceChildren(pi, 'text');

			expect(fragment.firstChild).toBe(pi);
			expect(fragment.lastChild!.nodeType).toBe(slimdom.Node.TEXT_NODE);
			expect(fragment.lastChild!.nodeValue).toBe('text');
			expect(comment.parentNode).toBe(null);
		});
	});
});
