import * as chai from 'chai';
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
		const child = el.appendChild(document.createElement('child')) as slimdom.Element;
		child.setAttribute('childAttr', 'childValue');
		chai.assert.equal(el.innerHTML, 'test<child childAttr="childValue"/>');
	});
});
