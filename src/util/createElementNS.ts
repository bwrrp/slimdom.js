import Document from '../Document';
import { createElement, default as Element } from '../Element';
import { validateAndExtract } from './namespaceHelpers';

// 3.5. Interface Document

/**
 * The internal createElementNS steps, given document, namespace, qualifiedName, and options, are as
 * follows:
 *
 * @param document      - The node document for the new element
 * @param namespace     - The namespace for the new element
 * @param qualifiedName - The qualified name for the new element
 *
 * @returns The new element
 */
export default function createElementNS(
	document: Document,
	namespace: string | null,
	qualifiedName: string
): Element {
	// 1. Let namespace, prefix, and localName be the result of passing namespace and qualifiedName
	// to validate and extract.
	const { namespace: validatedNamespace, prefix, localName } = validateAndExtract(
		namespace,
		qualifiedName
	);

	// 2. Let is be the value of is member of options, or null if no such member exists.
	// (custom elements not implemented)

	// 3. Let element be the result of creating an element given document, localName, namespace,
	// prefix, is, and with the synchronous custom elements flag set.
	const element = createElement(document, localName, validatedNamespace, prefix);

	// 4. If is is non-null, then set an attribute value for element using "is" and is.
	// (custom elements not implemented)

	// 5. Return element.
	return element;
}
