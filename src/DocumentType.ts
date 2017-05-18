import Node from './Node';

/**
 * The DocumentType interface represents a Node containing a doctype.
 */
export default class DocumentType extends Node {
	public name: string;
	public publicId: string;
	public systemId: string;

	/**
	 * @param name     The name of the document type
	 * @param publicId The public identifier of the doctype
	 * @param systemId The system identifier of the doctype
	 */
	constructor (name: string, publicId: string, systemId: string) {
		super(Node.DOCUMENT_TYPE_NODE);

		this.name = name;
		this.publicId = publicId;
		this.systemId = systemId;
	}

	public cloneNode (deep: boolean = true, copy?: DocumentType): DocumentType {
		copy = copy || new DocumentType(this.name, this.publicId, this.systemId);
		return super.cloneNode(deep, copy) as DocumentType;
	}
}
