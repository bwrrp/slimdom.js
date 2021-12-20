import * as slimdom from '../../../src/index';

import './windowStub';

import Sizzle = require('sizzle');

describe('Example: sizzle integration', () => {
	it('can use CSS selectors using Sizzle', () => {
		const document = new slimdom.Document();
		const root = document.appendChild(document.createElement('root'));
		const p1 = root.appendChild(document.createElement('p'));
		const p2 = root.appendChild(document.createElement('p'));
		const p3 = root.appendChild(document.createElement('p'));
		const div = root.appendChild(document.createElement('div'));
		const p4 = div.appendChild(document.createElement('p'));
		p1.setAttribute('id', 'header');
		p4.setAttribute('class', 'footer');

		expect(Sizzle('p', document)).toEqual([p1, p2, p3, p4]);
		expect(Sizzle('div p', document)).toEqual([p4]);
		expect(Sizzle('p ~ p', document)).toEqual([p2, p3]);
		expect(Sizzle('#header', document)).toEqual([p1]);
		expect(Sizzle('.footer', document)).toEqual([p4]);
	});
});
