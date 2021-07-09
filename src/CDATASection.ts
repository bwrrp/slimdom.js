import Document from './Document';
import Text from './Text';
import { getContext } from './context/Context';
import { NodeType } from './util/NodeType';

/**
 * @public
 */
export default class CDATASection extends Text {
	// Node

	public get nodeType(): number {
		return NodeType.CDATA_SECTION_NODE;
	}

	public get nodeName(): string {
		return '#cdata-section';
	}

	// CDATASection

	/**
	 * (non-standard) use Document#createCDATASection to create a CDATA section.
	 *
	 * @param data - The data for the node
	 */
	constructor(data: string) {
		super(data);
	}

	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public _copy(document: Document): CDATASection {
		// Set copy’s data, to that of node.
		const context = getContext(document);
		const copy = new context.CDATASection(this.data);
		copy.ownerDocument = document;
		return copy;
	}
}
