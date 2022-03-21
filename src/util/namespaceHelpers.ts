import { matchesNameProduction } from '../dom-parsing/grammar';
import Element from '../Element';
import { throwInvalidCharacterError, throwNamespaceError } from './errorHelpers';

// 1.5. Namespaces

export const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
export const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
export const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

/**
 * @param name - The name to check
 *
 * @returns True if the name is a valid QName, provided it is also a valid Name, otherwise false
 */
function isValidQName(name: string): boolean {
	// (QName is basically NCName | (NCName ':' NCName) where NCName is Name without ':', so here we
	// check that name contains at most a single colon, and that the other parts are valid Names)
	const parts = name.split(':');
	if (parts.length > 2) {
		// Too many colons
		return false;
	}
	// Each part should be a valid Name - we already know they don't contain ':', so a valid Name
	// here also means a valid NCName
	return parts.every((part) => matchesNameProduction(part));
}

/**
 * To validate a qualifiedName,
 *
 * @param qualifiedName - Qualified name to validate
 */
export function validateQualifiedName(qualifiedName: string): void {
	// throw an InvalidCharacterError if qualifiedName does not match the QName production.
	if (!isValidQName(qualifiedName)) {
		throwInvalidCharacterError('The qualified name is not a valid QName');
	}
}

export function splitQualifiedName(qualifiedName: string): {
	prefix: string | null;
	localName: string;
} {
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

	return { prefix, localName };
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
	// 3. Let prefix be null.
	// 4.  Let localName be qualifiedName.
	// 5. If qualifiedName contains a ":" (U+003A), then split the string on it and set prefix to
	// the part before and localName to the part after.
	const { prefix, localName } = splitQualifiedName(qualifiedName);

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
