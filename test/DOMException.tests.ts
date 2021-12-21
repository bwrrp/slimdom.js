import * as slimdom from '../src/index';

describe('DOMException', () => {
	it('Can be constructed manually', () => {
		const err = new slimdom.DOMException();
		expect(err.message).toBe('');
		expect(err.name).toBe('Error');
		expect(err.code).toBe(0);

		const err2 = new slimdom.DOMException('Bleh', 'NotFoundError');
		expect(err2.message).toBe('Bleh');
		expect(err2.name).toBe('NotFoundError');
		expect(err2.code).toBe(8);
	});

	it('Is instanceof Error', () => {
		const err = new slimdom.DOMException();
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(slimdom.DOMException);
	});

	it('Has a stack trace', () => {
		const err = new slimdom.DOMException();
		expect(err.stack).toBeDefined();
	});
});
