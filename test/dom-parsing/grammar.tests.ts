import { document } from '../../src/dom-parsing/grammar';

describe('grammar', () => {
	function test(input: string, expectOk: boolean) {
		const res = document(input, 0);
		expect(res.success).toBe(expectOk);
		expect(res.offset).toBe(input.length);
	}

	it('works', () => {
		test('<?xml version="1.0"?><!-- --><root attr="value">henk</root>', true);
	});
});
