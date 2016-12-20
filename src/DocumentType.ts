import Node from './Node';

/**
 * The DocumentType interface represents a Node containing a doctype.
 */
export default class DocumentType extends Node {
	public name: string;
	public publicId: string;
	public systemId: string;

	constructor (name: string, publicId: string, systemId: string) {
		super(Node.DOCUMENT_TYPE_NODE);

		this.name = name;
		this.publicId = publicId;
		this.systemId = systemId;
	}

	public cloneNode (deep: boolean = true, _copy: Node = null) {
		_copy = _copy || new DocumentType(this.name, this.publicId, this.systemId);
		return super.cloneNode(deep, _copy);
	}
}
