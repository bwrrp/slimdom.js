import Document from './Document';
import DocumentType from './DocumentType';

/**
 * The DOMImplementation interface represents an object providing methods which are not dependent on any
 * particular document. Such an object is returned by the Document.implementation property.
 */
export default class DOMImplementation {
	/**
	 * Returns a DocumentType object which can either be used with DOMImplementation.createDocument upon document
	 * creation or can be put into the document via methods like Node.insertBefore() or Node.replaceChild().
	 */
	public createDocumentType (qualifiedName: string, publicId: string, systemId: string): DocumentType {
		return new DocumentType(qualifiedName, publicId, systemId);
	}

	/**
	 * Creates and returns a new Document.
	 * 
	 * Note that namespaces are not currently supported; namespace and any prefix in qualifiedName will be ignored
	 */
	public createDocument (namespace: string | null, qualifiedName: string, doctype: DocumentType | null = null) {
		const document = new Document();
		let element = null;
		if (qualifiedName !== '') {
			// TODO: use createElementNS once it is supported
			element = document.createElement(qualifiedName);
		}

		if (doctype) {
			document.appendChild(doctype);
		}

		if (element) {
			document.appendChild(element);
		}

		return document;
	}
}
