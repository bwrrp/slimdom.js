import DomTreeAdapter = require('dom-treeadapter');
import { parse } from 'parse5';
import * as slimdom from '../../src/index';

import { readFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';

import './stubs';
import { BlockReasonByTestName } from './blocklist';

export function parseHtml(html: string): slimdom.Document {
	const document = new slimdom.Document();
	const treeAdapter = DomTreeAdapter(document);
	// Patch DomTreeAdapter's createElement as the tests require us to bypass name restrictions
	treeAdapter.createElement = (
		tagName: string,
		namespaceUri: string | null,
		attrs: { name: string; value: string }[]
	) => {
		const [prefix, localName] = tagName.includes(':') ? tagName.split(':') : [null, tagName];
		const element = slimdom.unsafeCreateElement(document, localName, namespaceUri, prefix);
		attrs.forEach((attr) => {
			// Parse5 doesn't really seem to do much with attribute namespaces - let's assume they
			// are all unprefixed and therefore in the null namespace...
			const attribute = slimdom.unsafeCreateAttribute(
				null,
				null,
				attr.name,
				attr.value,
				element
			);
			attribute.ownerDocument = document;
			slimdom.unsafeAppendAttribute(attribute, element);
		});
		return element;
	};
	return parse(html, { treeAdapter }) as slimdom.Document;
}

export function resolveAssetPath(relativePath: string, htmlPath: string, rootPath: string): string {
	if (relativePath === '/resources/WebIDLParser.js') {
		// Historical alias, unfortunately not an actual file
		// https://github.com/w3c/web-platform-tests/issues/5608
		return resolve(rootPath, 'resources/webidl2/lib/webidl2.js');
	}
	if (relativePath.startsWith('/')) {
		return resolve(rootPath, relativePath.substring(1));
	}
	return resolve(dirname(htmlPath), relativePath);
}

export function collectScripts(
	document: slimdom.Document,
	htmlPath: string,
	rootPath: string
): string {
	return Array.from(document.getElementsByTagName('script'), (script) => {
		const src = script.getAttribute('src');
		if (src) {
			return readFileSync(resolveAssetPath(src, htmlPath, rootPath), 'utf-8');
		}

		return script.textContent;
	}).join('\n');
}

type StubEnvironment = { global: any; onLoadCallbacks: Function[]; onErrorCallback?: Function };

function createStubEnvironment(
	document: slimdom.Document,
	htmlPath: string,
	rootPath: string
): StubEnvironment {
	const { document: _, ...domInterfaces } = slimdom;
	const onLoadCallbacks: Function[] = [];
	let onErrorCallback: Function | undefined = undefined;
	let global: any = {
		document,
		location: { href: htmlPath },
		window: null,

		get frames() {
			const iframes = document.getElementsByTagName('iframe');
			iframes.forEach((iframe: any) => {
				if (!iframe.contentWindow) {
					const stubs = createStubEnvironment(
						document.implementation.createHTMLDocument(),
						htmlPath,
						rootPath
					);
					iframe.contentWindow = stubs.global.window;
					iframe.contentDocument = stubs.global.document;
					iframe.document = stubs.global.document;
				}
			});
			return iframes;
		},

		addEventListener(event: string, cb: Function) {
			switch (event) {
				case 'load':
					onLoadCallbacks.push(cb);
					break;

				case 'error':
					onErrorCallback = cb;
					break;
			}
		},

		...domInterfaces,
	};
	global.window = global;
	global.parent = global;
	global.self = global;

	return { global, onLoadCallbacks, onErrorCallback };
}

export function runTest(
	html: string,
	htmlPath: string,
	rootPath: string,
	blockReasonByTestName: BlockReasonByTestName
): void {
	const document = parseHtml(html);
	const script = collectScripts(document, htmlPath, rootPath);
	const scriptAsFunction = new Function('global', `with (global) { ${script} }`);

	const title = (document as any).title || basename(htmlPath);

	let stubEnvironment: StubEnvironment;
	beforeEach(() => {
		stubEnvironment = createStubEnvironment(document, htmlPath, rootPath);
	});

	it(title, (done: Function) => {
		try {
			scriptAsFunction(stubEnvironment.global);
			if (!stubEnvironment.global.add_completion_callback) {
				// No test harness found, assume file is not really a test case
				done();
				return;
			}

			stubEnvironment.global.add_completion_callback(function (
				tests: any[],
				testStatus: any
			) {
				const errors: string[] = [];
				tests.forEach((test) => {
					// Ignore results of blacklisted tests
					if (!blockReasonByTestName[test.name]) {
						if (test.status !== testStatus.OK) {
							errors.push(`${test.name}: ${test.message}`);
						}
					}
				});
				expect(errors.join('\n')).toBe('');
				expect(testStatus.status).toBe(testStatus.OK);
				done();
			});

			stubEnvironment.onLoadCallbacks.forEach((cb) => cb({}));
			if (typeof stubEnvironment.global.onload === 'function') {
				stubEnvironment.global.onload({});
			}

			// "Run" iframes
			(stubEnvironment.global.frames as any[]).forEach((iframe) => {
				if (iframe.onload) {
					iframe.onload();
				}
			});
		} catch (e) {
			if (stubEnvironment.onErrorCallback) {
				stubEnvironment.onErrorCallback(e);
			} else {
				throw e;
			}
		}
	});
}
