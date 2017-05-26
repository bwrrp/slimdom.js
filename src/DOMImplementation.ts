import DocumentType from './DocumentType';
import XMLDocument from './XMLDocument';

import createElementNS from './util/createElementNS';
import { expectArity } from './util/errorHelpers';
import { validateQualifiedName } from './util/namespaceHelpers';
import { asNullableObject, asNullableString, treatNullAsEmptyString } from './util/typeHelpers';

export default class DOMImplementation {
	/**
	 * Returns a doctype, with the given qualifiedName, publicId, and systemId.
	 *
	 * (Non-standard) As this implementation does not associate a document with the global object, the returned
	 * doctype does not have an associated node document until it is inserted in one.
	 *
	 * @param qualifiedName Qualified name for the doctype
	 * @param publicId      Public ID for the doctype
	 * @param systemId      System ID for the doctype
	 *
	 * @return The new doctype node
	 */
	createDocumentType (qualifiedName: string, publicId: string, systemId: string): DocumentType {
		// 1. Validate qualifiedName.
		validateQualifiedName(qualifiedName);

		// 2. Return a new doctype, with qualifiedName as its name, publicId as its public ID, and systemId as its
		// system ID, and with its node document set to the associated document of the context object.
		return new DocumentType(null, qualifiedName, publicId, systemId);
	}

	/**
	 * Returns an XMLDocument, with a document element whose local name is qualifiedName and whose namespace is
	 * namespace (unless qualifiedName is the empty string), and with doctype, if it is given, as its doctype.
	 *
	 * @param namespace     The namespace for the root element
	 * @param qualifiedName The qualified name for the root element, or empty string to not create a root element
	 * @param doctype       The doctype for the new document, or null to not add a doctype
	 *
	 * @return The new XMLDocument
	 */
	createDocument (namespace: string | null, qualifiedName: string | null, doctype: DocumentType | null = null): XMLDocument {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		// [TreatNullAs=EmptyString] for qualifiedName
		qualifiedName = treatNullAsEmptyString(qualifiedName);
		doctype = asNullableObject(doctype, DocumentType);

		// 1. Let document be a new XMLDocument.
		const document = new XMLDocument();

		// 2. Let element be null.
		let element = null;

		// 3. If qualifiedName is not the empty string, then set element to the result of running the internal
		// createElementNS steps, given document, namespace, qualifiedName, and an empty dictionary.
		if (qualifiedName !== '') {
			element = createElementNS(document, namespace, qualifiedName);
		}

		// 4. If doctype is non-null, append doctype to document.
		if (doctype) {
			document.appendChild(doctype);
		}

		// 5. If element is non-null, append element to document.
		if (element) {
			document.appendChild(element);
		}

		// 6. document’s origin is context object’s associated document’s origin.
		// (origin not implemented)

		// 7. document’s content type is determined by namespace:
		// HTML namespace: application/xhtml+xml
		// SVG namespace: image/svg+xml
		// Any other namespace: application/xml
		// (content type not implemented)

		// 8. Return document.
		return document;
	}
}

export const implementation = new DOMImplementation();
