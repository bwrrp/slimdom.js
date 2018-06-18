import * as slimdom from '../../src/index';

describe('Element#innerHTML', () => {
	let document: slimdom.Document;
	beforeEach(() => {
		document = new slimdom.Document();
	});

	it("serializes the element's children", () => {
		const el = document.createElement('test');
		el.setAttribute('attr', 'value');
		el.appendChild(document.createTextNode('test'));
		const child = el.appendChild(document.createElement('child'));
		child.setAttribute('childAttr', 'childValue');
		expect(el.innerHTML).toBe('test<child childAttr="childValue"/>');
	});
});
