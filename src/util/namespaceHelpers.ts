import { throwNamespaceError } from './errorHelpers';

// 1.5. Namespaces

const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

/**
 * To validate a qualifiedName,
 *
 * @param qualifiedName Qualified name to validate
 */
export function validateQualifiedName (qualifiedName: string): void {
	// TODO: throw an InvalidCharacterError if qualifiedName does not match the Name or QName production.
}

/**
 * To validate and extract a namespace and qualifiedName, run these steps:
 *
 * @param namespace     Namespace for the qualified name
 * @param qualifiedName Qualified name to validate and extract the components of
 *
 * @return Namespace, prefix and localName
 */
export function validateAndExtract (namespace: string | null, qualifiedName: string): { namespace: string | null, prefix: string | null, localName: string } {
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

	// 5. If qualifiedName contains a ":" (U+003E), then split the string on it and set prefix to the part before and
	// localName to the part after.
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

	// 8. If either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace, then throw a NamespaceError.
	if ((qualifiedName === 'xmlns' || prefix === 'xmlns') && namespace !== XMLNS_NAMESPACE) {
		throwNamespaceError('xmlns prefix or qualifiedName must use the XMLNS namespace');
	}

	// 9. If namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns", then throw a NamespaceError.
	if (namespace === XMLNS_NAMESPACE && qualifiedName !== 'xmlns' && prefix !== 'xmlns') {
		throwNamespaceError('xmlns prefix or qualifiedName must be used for the XMLNS namespace');
	}

	// 10. Return namespace, prefix, and localName.
	return { namespace, prefix, localName };
}
