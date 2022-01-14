import { collectScripts, parseHtml, resolveAssetPath } from './runTest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('wpt: runTest helpers', () => {
	describe('resolveAssetPath', () => {
		it('handles the legacy webidl path', () => {
			expect(resolveAssetPath('/resources/WebIDLParser.js', 'meep/test.html', 'root')).toBe(
				resolve('root/resources/webidl2/lib/webidl2.js')
			);
		});

		it('handles rooted paths', () => {
			expect(resolveAssetPath('/resources/lib.js', 'meep/test.html', 'root')).toBe(
				resolve('root/resources/lib.js')
			);
		});

		it('handles relative paths', () => {
			expect(resolveAssetPath('resources/lib.js', 'meep/test.html', 'root')).toBe(
				resolve('meep/resources/lib.js')
			);
		});
	});

	describe('collectScripts', () => {
		it('handles inline scripts as well as script files', () => {
			const document = parseHtml(
				'<html><script>inline();</script><script src="preprocessor.js">Nope;</script>'
			);
			expect(collectScripts(document, resolve(__dirname, 'test.html'), 'root')).toBe(
				['inline();', readFileSync(resolve(__dirname, 'preprocessor.js'), 'utf-8')].join(
					'\n'
				)
			);
		});
	});
});
