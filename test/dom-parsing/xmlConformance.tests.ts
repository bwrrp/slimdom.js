import {
	CDATASection,
	Comment,
	Document,
	Element,
	Node,
	parseXmlDocument,
	parseXmlFragment,
	serializeToWellFormedString,
} from '../../src/index';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED_TESTS = [
	// invalid characters in utf8 not preserved when loading as string
	'not-wf-sa-168',
	'not-wf-sa-169',
	'not-wf-sa-170',
	'ibm-not-wf-P02-ibm02n30.xml',
	'ibm-not-wf-P02-ibm02n31.xml',
	'rmt-e2e-27',
	'rmt-ns10-006',
	'x-ibm-1-0.5-not-wf-P04-ibm04n21.xml',
	'x-ibm-1-0.5-not-wf-P04-ibm04n22.xml',
	'x-ibm-1-0.5-not-wf-P04-ibm04n23.xml',
	'x-ibm-1-0.5-not-wf-P04-ibm04n24.xml',
	'x-ibm-1-0.5-not-wf-P04a-ibm04an21.xml',
	'x-ibm-1-0.5-not-wf-P04a-ibm04an22.xml',
	'x-ibm-1-0.5-not-wf-P04a-ibm04an23.xml',
	'x-ibm-1-0.5-not-wf-P04a-ibm04an24.xml',
	// Encoding value in XML declaration is ignored as we're parsing from string
	'hst-lhs-007',
	'hst-lhs-008',
	'hst-lhs-009',
	'rmt-e2e-61',
	// Relative URI namespaces are deprecated in the spec but still supported here
	'rmt-ns10-004',
	'rmt-ns10-005',
	// Emulation of canonical serialization doesn't preserve PI in DTD as they're not supposed to
	// end up in the DOM
	'ibm-valid-P29-ibm29v01.xml',
	// Non-deterministic content models are ignored
	'rmt-e2e-34',
	// References to unparsed entities in entity values are ignored if the entity is not used
	'rmt-e2e-55',
	// Invalid values for xml:space are ignored
	'rmt-e2e-57',
	// TODO: unclear if this breaks a validity constraint or a well-formedness constraint
	'ibm-not-wf-P69-ibm69n05.xml',
];

function isCData(node: Node): node is CDATASection {
	return node.nodeType === Node.CDATA_SECTION_NODE;
}

function isComment(node: Node): node is Comment {
	return node.nodeType === Node.COMMENT_NODE;
}

function isElement(node: Node): node is Element {
	return node.nodeType === Node.ELEMENT_NODE;
}

function makeCanonical(doc: Document): void {
	doc.doctype?.remove();

	function convert(node: Node) {
		for (
			let child = node.firstChild, next = child?.nextSibling;
			child;
			child = next ?? null, next = child?.nextSibling
		) {
			if (isCData(child)) {
				const text = doc.createTextNode(child.data);
				child.replaceWith(text);
				child = text;
				continue;
			}

			if (isComment(child)) {
				child.remove();
				continue;
			}

			if (isElement(child)) {
				const attrs = child.attributes.slice().sort((a, b) => {
					return a.nodeName < b.nodeName ? -1 : 1;
				});
				// Remove and re-add in alphabetical order
				for (const a of attrs) {
					child.removeAttributeNS(a.namespaceURI, a.localName);
				}
				for (const a of attrs) {
					child.setAttributeNodeNS(a);
				}
			}

			convert(child);
		}
	}

	convert(doc);
}

function loadXml(path: string): string {
	// Do some very minimal encoding sniffing - UTF-16 LE files seem to start with a BOM
	const buf = readFileSync(path);
	if (buf[0] === 0xff && buf[1] === 0xfe) {
		return buf.toString('utf16le');
	}
	if (buf[0] === 0xfe && buf[1] === 0xff) {
		// Swapping BE makes it LE
		return buf.swap16().toString('utf16le');
	}
	return buf.toString('utf-8');
}

describe('XML Conformance Test Suite', () => {
	const basePath = process.env.XMLCONF_PATH || './temp/xmlconf';
	if (!existsSync(basePath)) {
		it.skip('test suite not found, set XMLCONF_PATH environment variable to its path', () => {});
		return;
	}

	function wrapExternalEntity(input: string): Element {
		const fragment = parseXmlFragment(input);
		const wrapper = fragment.ownerDocument!.createElement('XML');
		wrapper.appendChild(fragment);
		return wrapper;
	}

	function loadSuite(suitePath: string, manifestPath: string, fragment = false): void {
		const manifestXml = loadXml(join(basePath, suitePath, manifestPath));
		// Some of these manifests are external entities rather than full documents
		const manifest = fragment ? wrapExternalEntity(manifestXml) : parseXmlDocument(manifestXml);

		for (const test of manifest.getElementsByTagName('TEST')) {
			const id = test.getAttribute('ID')!;
			if (IGNORED_TESTS.includes(id)) {
				// Test not supported, so ignore it
				continue;
			}
			const uri = test.getAttribute('URI')!;
			if (uri.includes('/not-sa/') || uri.includes('/ext-sa/')) {
				// Test not standalone or depends on external entities - unsupported, so ignore it
				continue;
			}

			if (test.getAttribute('NAMESPACE') === 'no') {
				// Test does not support namespaces - we do, so ignore it
				continue;
			}

			if (test.getAttribute('VERSION') === '1.1') {
				// Test is for XML 1.1 - we only support 1.0, so ignore it
				continue;
			}

			const entities = test.getAttribute('ENTITIES');
			if (entities === 'parameter' || entities === 'general' || entities === 'both') {
				// Test depends on parameter / external general entities - unsupported, so ignore it
				continue;
			}

			const edition = test.getAttribute('EDITION');
			if (edition !== null && !edition.split(/\s+/g).includes('5')) {
				// Test not intended for the fifth edition spec, so ignore it
				continue;
			}

			const desc = test.textContent!.replace(/\s+/g, ' ').trim();
			const path = join(basePath, suitePath, uri);
			const outputPath = test.hasAttribute('OUTPUT')
				? join(basePath, suitePath, test.getAttribute('OUTPUT')!)
				: null;
			let type = test.getAttribute('TYPE');
			// Override an invalid test case to be non-wf
			// see https://lists.w3.org/Archives/Public/public-xml-testsuite/2013Dec/0000.html
			if (id === 'rmt-e3e-13' && type === 'invalid') {
				type = 'not-wf';
			}
			switch (type) {
				// For a non-validating parser, both valid and invalid tests should be accepted
				case 'valid':
				case 'invalid':
					it(`${id} - ${desc}`, () => {
						const xml = loadXml(path);
						const doc = parseXmlDocument(xml);
						if (outputPath) {
							const out = parseXmlDocument(loadXml(outputPath));
							// Although these should be in canonical format, it appears some have a doctype
							out.doctype?.remove();
							makeCanonical(doc);
							expect(serializeToWellFormedString(doc)).toEqual(
								serializeToWellFormedString(out)
							);
						}
					});
					break;

				case 'not-wf':
				case 'error':
					it(`${id} - ${desc}`, () => {
						const xml = loadXml(path);
						expect(() => parseXmlDocument(xml)).toThrowErrorMatchingSnapshot(id);
					});
					break;

				default:
					it.skip(`test type ${type} not supported - skipping test ${id}`, () => {});
					continue;
			}
		}
	}

	describe('James Clark XML 1.0 tests', () => {
		loadSuite('xmltest', 'xmltest.xml');
	});

	describe('Fuji Xerox Japanese Text Tests XML 1.0 Tests', () => {
		// All specify a requirement for parameter entities, so none of these actually run
		loadSuite('japanese', 'japanese.xml');
	});

	describe('Sun Microsystems XML Tests', () => {
		describe('valid', () => {
			loadSuite('sun', 'sun-valid.xml', true);
		});
		describe('invalid', () => {
			loadSuite('sun', 'sun-invalid.xml', true);
		});
		describe('not-wf', () => {
			loadSuite('sun', 'sun-not-wf.xml', true);
		});
		describe('error', () => {
			loadSuite('sun', 'sun-error.xml', true);
		});
	});

	describe('OASIS/NIST XML 1.0 Tests', () => {
		loadSuite('oasis', 'oasis.xml');
	});

	describe('IBM XML 1.0 Tests', () => {
		describe('invalid', () => {
			loadSuite('ibm', 'ibm_oasis_invalid.xml');
		});
		describe('not-wf', () => {
			loadSuite('ibm', 'ibm_oasis_not-wf.xml');
		});
		describe('valid', () => {
			loadSuite('ibm', 'ibm_oasis_valid.xml');
		});
	});

	describe("Richard Tobin's XML 1.0 2nd edition errata test suite 21 Jul 2003", () => {
		loadSuite('eduni/errata-2e', 'errata2e.xml');
	});

	describe("Richard Tobin's XML Namespaces 1.0 test suite 14 Feb 2003", () => {
		loadSuite('eduni/namespaces/1.0', 'rmt-ns10.xml');
	});

	describe("Richard Tobin's XML 1.0 3rd edition errata test suite 1 June 2006", () => {
		loadSuite('eduni/errata-3e', 'errata3e.xml');
	});

	describe('University of Edinburgh tests for XML 1.0 5th edition', () => {
		loadSuite('eduni/errata-4e', 'errata4e.xml');
	});

	describe("Richard Tobin's XML Namespaces 1.0/1.1 2nd edition test suite 1 June 2006", () => {
		loadSuite('eduni/namespaces/errata-1e', 'errata1e.xml');
	});

	describe('Bjoern Hoehrmann via HST 2013-09-18', () => {
		loadSuite('eduni/misc', 'ht-bh.xml');
	});
});
