import Element from '../Element';
import Node from '../Node';
import { throwInvalidCharacterError, throwNamespaceError } from './errorHelpers';

// 1.5. Namespaces

export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
export const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
export const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

/*
// NAME_REGEX_XML_1_0_FIFTH_EDITION generated using regenerate:
const regenerate = require('regenerate');

const NameStartChar = regenerate()
	.add(':')
	.addRange('A', 'Z')
	.add('_')
	.addRange('a', 'z')
	.addRange(0xC0, 0xD6)
	.addRange(0xD8, 0xF6)
	.addRange(0xF8, 0x2FF)
	.addRange(0x370, 0x37D)
	.addRange(0x37F, 0x1FFF)
	.addRange(0x200C, 0x200D)
	.addRange(0x2070, 0x218F)
	.addRange(0x2C00, 0x2FEF)
	.addRange(0x3001, 0xD7FF)
	.addRange(0xF900, 0xFDCF)
	.addRange(0xFDF0, 0xFFFD)
	.addRange(0x10000, 0xEFFFF);

const NameChar = NameStartChar.clone()
	.add('-')
	.add('.')
	.addRange('0', '9')
	.add(0xB7)
	.addRange(0x0300, 0x036F)
	.addRange(0x203F, 0x2040);

return `^(?:${NameStartChar.toString()})(?:${NameChar.toString()})*$`;
*/
const NAME_REGEX_XML_1_0_FIFTH_EDITION =
	/^(?:[:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])(?:[\-\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;

/**
 * Returns true if name matches the Name production.
 *
 * @param name - The name to check
 *
 * @returns true if name matches Name, otherwise false
 */
export function matchesNameProduction(name: string): boolean {
	return NAME_REGEX_XML_1_0_FIFTH_EDITION.test(name);
}

/**
 * As we're already testing against Name, testing QName validity can be reduced to checking if the
 * name contains at most a single colon which is not at the first or last position.
 *
 * @param name - The name to check
 *
 * @returns True if the name is a valid QName, provided it is also a valid Name, otherwise false
 */
function isValidQName(name: string): boolean {
	const parts = name.split(':');
	if (parts.length > 2) {
		return false;
	}
	if (parts.length === 1) {
		return true;
	}
	// First part should not be empty, and the second part should be a valid name
	return parts[0].length > 0 && matchesNameProduction(parts[1]);
}

/**
 * To validate a qualifiedName,
 *
 * @param qualifiedName - Qualified name to validate
 */
export function validateQualifiedName(qualifiedName: string): void {
	// throw an InvalidCharacterError if qualifiedName does not match the QName production.
	// (QName is basically (Name without ':') ':' (Name without ':'), so just check the position of
	// the ':')
	if (!isValidQName(qualifiedName) || !matchesNameProduction(qualifiedName)) {
		throwInvalidCharacterError('The qualified name is not a valid QName');
	}
}

/**
 * To validate and extract a namespace and qualifiedName, run these steps:
 *
 * @param namespace     - Namespace for the qualified name
 * @param qualifiedName - Qualified name to validate and extract the components of
 *
 * @returns Namespace, prefix and localName
 */
export function validateAndExtract(
	namespace: string | null,
	qualifiedName: string
): { namespace: string | null; prefix: string | null; localName: string } {
	// 1. If namespace is the empty string, set it to null.
	if (namespace === '') {
		namespace = null;
	}

	// 2. Validate qualifiedName.
	validateQualifiedName(qualifiedName);

	// 3. Let prefix be null.
	let prefix: string | null = null;

	// 4.  Let localName be qualifiedName.
	let localName = qualifiedName;

	// 5. If qualifiedName contains a ":" (U+003A), then split the string on it and set prefix to
	// the part before and localName to the part after.
	const index = qualifiedName.indexOf(':');
	if (index >= 0) {
		prefix = qualifiedName.substring(0, index);
		localName = qualifiedName.substring(index + 1);
	}

	// 6. If prefix is non-null and namespace is null, then throw a NamespaceError.
	if (prefix !== null && namespace === null) {
		throwNamespaceError('Qualified name with prefix can not have a null namespace');
	}

	// 7. If prefix is "xml" and namespace is not the XML namespace, then throw a NamespaceError.
	if (prefix === 'xml' && namespace !== XML_NAMESPACE) {
		throwNamespaceError('xml prefix can only be used for the XML namespace');
	}

	// 8. If either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace,
	// then throw a NamespaceError.
	if ((qualifiedName === 'xmlns' || prefix === 'xmlns') && namespace !== XMLNS_NAMESPACE) {
		throwNamespaceError('xmlns prefix or qualifiedName must use the XMLNS namespace');
	}

	// 9. If namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns", then
	// throw a NamespaceError.
	if (namespace === XMLNS_NAMESPACE && qualifiedName !== 'xmlns' && prefix !== 'xmlns') {
		throwNamespaceError('xmlns prefix or qualifiedName must be used for the XMLNS namespace');
	}

	// 10. Return namespace, prefix, and localName.
	return { namespace, prefix, localName };
}

/**
 * To locate a namespace prefix for an element using namespace, run these steps:
 *
 * @param element    - The element at which to start the lookup
 * @param namespace  - Namespace for which to look up the prefix
 *
 * @returns The prefix, or null if there isn't one
 */
export function locateNamespacePrefix(element: Element, namespace: string | null): string | null {
	// 1. If element’s namespace is namespace and its namespace prefix is non-null, then return its
	// namespace prefix.
	if (element.namespaceURI === namespace && element.prefix !== null) {
		return element.prefix;
	}

	// 2. If element has an attribute whose namespace prefix is "xmlns" and value is namespace, then
	// return element’s first such attribute’s local name.
	const attr = Array.from(element.attributes).find(
		(attr) => attr.prefix === 'xmlns' && attr.value === namespace
	);
	if (attr) {
		return attr.localName;
	}

	// 3. If element’s parent element is non-null, then return the result of running locate a
	// namespace prefix on that element using namespace.
	if (element.parentElement !== null) {
		return locateNamespacePrefix(element.parentElement, namespace);
	}

	// 4. Return null.
	return null;
}
