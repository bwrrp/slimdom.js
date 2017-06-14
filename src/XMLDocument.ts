import Document from './Document';
import { getContext } from './context/Context';

export default class XMLDocument extends Document {
	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): XMLDocument {
		// Set copy’s encoding, content type, URL, origin, type, and mode, to those of node.
		// (properties not implemented)

		const context = getContext(document);
		return new context.XMLDocument();
	}
}
