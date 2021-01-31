import * as slimdom from '../src/index';

describe('Text', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('can be created using Document#createTextNode()', () => {
		const text = document.createTextNode('some data');
		expect(text.nodeType).toBe(3);
		expect(text.nodeName).toBe('#text');
		expect(text.nodeValue).toBe('some data');
		expect(text.data).toBe('some data');

		expect(text.ownerDocument).toBe(document);
	});

	it('can be created using its constructor (with data)', () => {
		const text = new slimdom.Text('some data');
		expect(text.nodeType).toBe(3);
		expect(text.nodeName).toBe('#text');
		expect(text.nodeValue).toBe('some data');
		expect(text.data).toBe('some data');

		expect(text.ownerDocument).toBe(slimdom.document);
	});

	it('can be created using its constructor (without arguments)', () => {
		const text = new slimdom.Text();
		expect(text.nodeType).toBe(3);
		expect(text.nodeName).toBe('#text');
		expect(text.nodeValue).toBe('');
		expect(text.data).toBe('');

		expect(text.ownerDocument).toBe(slimdom.document);
	});

	it('can set its data using nodeValue', () => {
		const text = document.createTextNode('some data');
		text.nodeValue = 'other data';
		expect(text.nodeValue).toBe('other data');
		expect(text.data).toBe('other data');

		text.nodeValue = null;
		expect(text.nodeValue).toBe('');
		expect(text.data).toBe('');
	});

	it('can set its data using data', () => {
		const text = document.createTextNode('some data');
		text.data = 'other data';
		expect(text.nodeValue).toBe('other data');
		expect(text.data).toBe('other data');
	});

	it('can be cloned', () => {
		const text = document.createTextNode('some data');
		var copy = text.cloneNode();
		expect(copy.nodeType).toBe(3);
		expect(copy.nodeName).toBe('#text');
		expect(copy.nodeValue).toBe('some data');
		expect(copy.data).toBe('some data');
		expect(copy).not.toBe(text);
	});

	it('can lookup a prefix or namespace on its parent element', () => {
		const text = document.createTextNode('some data');
		expect(text.lookupNamespaceURI('prf')).toBe(null);
		expect(text.lookupPrefix('http://www.example.com/ns')).toBe(null);

		const element = document.createElementNS('http://www.example.com/ns', 'prf:test');
		element.appendChild(text);
		expect(text.lookupNamespaceURI('prf')).toBe('http://www.example.com/ns');
		expect(text.lookupPrefix('http://www.example.com/ns')).toBe('prf');
	});

	it('can substring its data', () => {
		const text = document.createTextNode('text');
		expect(text.substringData(0, 2)).toBe('te');
		expect(text.substringData(2, 2)).toBe('xt');
		expect(text.substringData(1, 2)).toBe('ex');
		expect(text.substringData(2, 9999)).toBe('xt');

		expect(() => text.substringData(-123, 1)).toThrow('IndexSizeError');
		expect(() => text.substringData(123, 1)).toThrow('IndexSizeError');
	});

	it('can appendData', () => {
		const text = document.createTextNode('text');
		text.appendData('123');
		expect(text.data).toBe('text123');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(7);
	});

	it('can insertData', () => {
		const text = document.createTextNode('text');
		text.insertData(2, '123');
		expect(text.data).toBe('te123xt');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(7);

		text.insertData(0, '123');
		expect(text.data).toBe('123te123xt');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(10);

		text.insertData(text.length, '123');
		expect(text.data).toBe('123te123xt123');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(13);

		expect(() => text.insertData(-123, '123')).toThrow('IndexSizeError');
		expect(() => text.insertData(123, '123')).toThrow('IndexSizeError');
	});

	it('can deleteData', () => {
		const text = document.createTextNode('text');
		text.deleteData(0, 0);
		expect(text.data).toBe('text');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(4);

		text.deleteData(0, 1);
		expect(text.data).toBe('ext');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(3);

		text.deleteData(text.length, 2);
		expect(text.data).toBe('ext');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(3);

		text.deleteData(1, 1);
		expect(text.data).toBe('et');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(2);

		text.deleteData(1, 9999);
		expect(text.data).toBe('e');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(1);

		expect(() => text.deleteData(-123, 2)).toThrow('IndexSizeError');
		expect(() => text.deleteData(123, 2)).toThrow('IndexSizeError');
	});

	it('can replaceData', () => {
		const text = document.createTextNode('text');
		text.replaceData(0, 0, '');
		expect(text.data).toBe('text');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(4);

		text.replaceData(0, 10, 'asd');
		expect(text.data).toBe('asd');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(3);

		text.replaceData(text.length, 10, 'fgh');
		expect(text.data).toBe('asdfgh');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(6);

		text.replaceData(3, 4, 'asd');
		expect(text.data).toBe('asdasd');
		expect(text.nodeValue).toBe(text.data);
		expect(text.length).toBe(6);

		expect(() => text.replaceData(-123, 2, 'text')).toThrow('IndexSizeError');
		expect(() => text.replaceData(123, 2, 'text')).toThrow('IndexSizeError');
	});

	describe('splitting', () => {
		it('can be split', () => {
			const text = document.createTextNode('text');
			const otherHalf = text.splitText(2);
			expect(text.data).toBe('te');
			expect(text.nodeValue).toBe(text.data);
			expect(otherHalf.data).toBe('xt');
			expect(otherHalf.nodeValue).toBe(otherHalf.data);

			expect(() => text.splitText(-123)).toThrow('IndexSizeError');
			expect(() => text.splitText(123)).toThrow('IndexSizeError');
		});

		describe('under a parent', () => {
			let text: slimdom.Text;
			let element: slimdom.Element;
			beforeEach(() => {
				element = document.createElement('parent');
				text = document.createTextNode('text');
				element.appendChild(text);
			});

			it('is split correctly', () => {
				const otherHalf = text.splitText(2);
				expect(text.data).toBe('te');
				expect(text.nodeValue).toBe(text.data);
				expect(otherHalf.data).toBe('xt');
				expect(otherHalf.nodeValue).toBe(otherHalf.data);
			});

			it('both halves are children of the parent', () => {
				const otherHalf = text.splitText(2);
				expect(text.parentNode).toBe(element);
				expect(otherHalf.parentNode).toBe(element);
			});

			it('both halves are siblings', () => {
				const otherHalf = text.splitText(2);
				expect(text.nextSibling).toBe(otherHalf);
				expect(otherHalf.previousSibling).toBe(text);
			});

			it('updates ranges after the split point', () => {
				const range1 = new slimdom.Range();
				const range2 = new slimdom.Range();
				range1.setStart(text, 3);
				range1.setEnd(text, 4);
				range2.setStart(element, 1);
				range2.collapse(true);
				const otherHalf = text.splitText(2);
				expect(range1.startContainer).toBe(otherHalf);
				expect(range1.startOffset).toBe(1);
				expect(range1.endContainer).toBe(otherHalf);
				expect(range1.endOffset).toBe(2);
				expect(range2.startContainer).toBe(element);
				expect(range2.startOffset).toBe(2);
				expect(range2.endContainer).toBe(element);
				expect(range2.endOffset).toBe(2);
			});
		});
	});

	describe('wholeText', () => {
		it('returns the concatenation of the data of the contiguous text nodes of this', () => {
			const element = document.createElement('parent');
			element.append('These', ' ', 'are', ' some text nodes');
			expect((element.childNodes[0] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[1] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[2] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[3] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
		});

		it('stops at any non-Text node', () => {
			const element = document.createElement('parent');
			element.append('These', document.createComment(' '), 'are', ' some text nodes');
			expect((element.childNodes[0] as slimdom.Text).wholeText).toBe('These');
			expect((element.childNodes[2] as slimdom.Text).wholeText).toBe('are some text nodes');
			expect((element.childNodes[3] as slimdom.Text).wholeText).toBe('are some text nodes');
		});

		it('includes CDATA sections', () => {
			const element = document.createElement('parent');
			element.append('These', document.createCDATASection(' '), 'are', ' some text nodes');
			expect((element.childNodes[0] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[1] as slimdom.CDATASection).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[2] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
			expect((element.childNodes[3] as slimdom.Text).wholeText).toBe(
				'These are some text nodes'
			);
		});
	});

	describe('.before', () => {
		let text: slimdom.Text;
		let comment: slimdom.Comment;
		beforeEach(() => {
			text = document.createTextNode('text');
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			text.before(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes before the node', () => {
			const parent = document.createElement('parent');
			parent.appendChild(text);
			text.before('hello', comment);

			expect(text.previousSibling).toBe(comment);
			expect((text.previousSibling!.previousSibling as slimdom.Text).data).toBe('hello');
		});
	});

	describe('.after', () => {
		let text: slimdom.Text;
		let comment: slimdom.Comment;
		beforeEach(() => {
			text = document.createTextNode('text');
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			text.after(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can insert nodes after the node', () => {
			const parent = document.createElement('parent');
			parent.appendChild(text);
			text.after(comment, 'hello');

			expect(text.nextSibling).toBe(comment);
			expect((text.nextSibling!.nextSibling as slimdom.Text).data).toBe('hello');
		});
	});

	describe('.replaceWith', () => {
		let text: slimdom.Text;
		let comment: slimdom.Comment;
		beforeEach(() => {
			text = document.createTextNode('text');
			comment = document.createComment('comment');
		});

		it('does nothing if the node does not have a parent', () => {
			text.replaceWith(comment);
			expect(comment.parentNode).toBe(null);
		});

		it('can replace the node with nodes and/or text', () => {
			const parent = document.createElement('parent');
			parent.appendChild(text);
			text.replaceWith(comment, 'hello');

			expect(text.parentNode).toBe(null);
			expect(parent.firstChild).toBe(comment);
			expect((parent.lastChild as slimdom.Text).data).toBe('hello');
		});
	});

	describe('.remove', () => {
		let text: slimdom.Text;
		beforeEach(() => {
			text = document.createTextNode('text');
		});

		it('does nothing if the node does not have a parent', () => {
			text.remove();
			expect(text.parentNode).toBe(null);
		});

		it('can remove the node from its parent', () => {
			const parent = document.createElement('parent');
			parent.appendChild(text);
			text.remove();

			expect(text.parentNode).toBe(null);
			expect(parent.firstChild).toBe(null);
		});
	});
});
