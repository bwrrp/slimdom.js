import Document from './Document';
import DocumentType from './DocumentType';
import { createElement } from './Element';
import XMLDocument from './XMLDocument';
import { getContext } from './context/Context';
import createElementNS from './util/createElementNS';
import { expectArity } from './util/errorHelpers';
import { HTML_NAMESPACE, validateQualifiedName } from './util/namespaceHelpers';
import { asNullableObject, asNullableString, treatNullAsEmptyString } from './util/typeHelpers';

/**
 * @public
 */
export default class DOMImplementation {
	private _document: Document;

	/**
	 * (non-standard) Use Document#implementation to access instances of this class
	 *
	 * @param document - The document to associate with this instance
	 */
	constructor(document: Document) {
		this._document = document;
	}

	/**
	 * Returns a doctype, with the given qualifiedName, publicId, and systemId.
	 *
	 * @param qualifiedName - Qualified name for the doctype
	 * @param publicId      - Public ID for the doctype
	 * @param systemId      - System ID for the doctype
	 *
	 * @returns The new doctype node
	 */
	createDocumentType(qualifiedName: string, publicId: string, systemId: string): DocumentType {
		expectArity(arguments, 3);
		qualifiedName = String(qualifiedName);
		publicId = String(publicId);
		systemId = String(systemId);

		// 1. Validate qualifiedName.
		validateQualifiedName(qualifiedName);

		// 2. Return a new doctype, with qualifiedName as its name, publicId as its public ID, and
		// systemId as its system ID, and with its node document set to the associated document of
		// this.
		const context = getContext(this._document);
		const doctype = new context.DocumentType(qualifiedName, publicId, systemId);
		doctype.ownerDocument = this._document;
		return doctype;
	}

	/**
	 * Returns an XMLDocument, with a document element whose local name is qualifiedName and whose
	 * namespace is namespace (unless qualifiedName is the empty string), and with doctype, if it is
	 * given, as its doctype.
	 *
	 * @param namespace     - The namespace for the root element
	 * @param qualifiedName - The qualified name for the root element, or empty string to not create
	 *                        a root element
	 * @param doctype       - The doctype for the new document, or null to not add a doctype
	 *
	 * @returns The new XMLDocument
	 */
	createDocument(
		namespace: string | null,
		qualifiedName: string | null,
		doctype: DocumentType | null = null
	): XMLDocument {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		// [TreatNullAs=EmptyString] for qualifiedName
		qualifiedName = treatNullAsEmptyString(qualifiedName);
		doctype = asNullableObject(doctype, DocumentType);

		// 1. Let document be a new XMLDocument.
		const context = getContext(this._document);
		const document = new context.XMLDocument();

		// 2. Let element be null.
		let element = null;

		// 3. If qualifiedName is not the empty string, then set element to the result of running
		// the internal createElementNS steps, given document, namespace, qualifiedName, and an
		// empty dictionary.
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

		// 6. document’s origin is this’s associated document’s origin.
		// (origin not implemented)

		// 7. document’s content type is determined by namespace:
		// HTML namespace: application/xhtml+xml
		// SVG namespace: image/svg+xml
		// Any other namespace: application/xml
		// (content type not implemented)

		// 8. Return document.
		return document;
	}

	/**
	 * Returns a HTML document with a basic tree already constructed.
	 *
	 * @param title - Optional title for the new HTML document
	 *
	 * @returns The new document
	 */
	createHTMLDocument(title?: string | null): Document {
		title = asNullableString(title);

		// 1. Let doc be a new document that is an HTML document.
		const context = getContext(this._document);
		const doc = new context.Document();

		// 2. Set doc’s content type to "text/html".
		// (content type not implemented)

		// 3. Append a new doctype, with "html" as its name and with its node document set to doc,
		// to doc.
		const doctype = new context.DocumentType('html');
		doctype.ownerDocument = doc;
		doc.appendChild(doctype);

		// 4. Append the result of creating an element given doc, html, and the HTML namespace, to
		// doc.
		const htmlElement = createElement(doc, 'html', HTML_NAMESPACE);
		doc.appendChild(htmlElement);

		// 5. Append the result of creating an element given doc, head, and the HTML namespace, to
		// the html element created earlier.
		const headElement = createElement(doc, 'head', HTML_NAMESPACE);
		htmlElement.appendChild(headElement);

		// 6. If title is given:
		if (title !== null) {
			// 6.1. Append the result of creating an element given doc, title, and the HTML
			// namespace, to the head element created earlier.
			const titleElement = createElement(doc, 'title', HTML_NAMESPACE);
			headElement.appendChild(titleElement);

			// 6.2. Append a new Text node, with its data set to title (which could be the empty
			// string) and its node document set to doc, to the title element created earlier.
			titleElement.appendChild(doc.createTextNode(title));
		}

		// 7. Append the result of creating an element given doc, body, and the HTML namespace, to
		// the html element created earlier.
		htmlElement.appendChild(createElement(doc, 'body', HTML_NAMESPACE));

		// 8. doc’s origin is this’s associated document’s origin.
		// (origin not implemented)

		// 9. Return doc.
		return doc;
	}
}
