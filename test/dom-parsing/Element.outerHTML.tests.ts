import * as slimdom from '../../src/index';

describe('Element#outerHTML', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it('serializes the element and its descendants, but not its siblings', () => {
		const el = document.createElement('test');
		document.appendChild(el);
		document.appendChild(document.createComment('sibling'));
		el.setAttribute('attr', 'value');
		el.appendChild(document.createTextNode('test'));
		const child = el.appendChild(document.createElement('child'));
		child.setAttribute('childAttr', 'childValue');
		expect(el.outerHTML).toBe('<test attr="value">test<child childAttr="childValue"/></test>');
	});
});
