import Document from './Document';
import { getContext } from './context/Context';

/**
 * @public
 */
export default class XMLDocument extends Document {
	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public _copy(document: Document): XMLDocument {
		// Set copy’s encoding, content type, URL, origin, type, and mode, to those of node.
		// (properties not implemented)

		const context = getContext(document);
		return new context.XMLDocument();
	}
}
