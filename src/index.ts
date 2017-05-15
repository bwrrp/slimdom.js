import Document from './Document';
import Node from './Node';
import Element from './Element';
import Range from './selections/Range';
import MutationObserver from './mutations/MutationObserver';

import DOMImplementation from './DOMImplementation';
import globals from './globals';

// Create a single DOMImplementation instance shared by the entire library
const implementation = globals.domImplementation = new DOMImplementation();

export default {
	/**
	 * The DOMImplementation instance.
	 */
	implementation,

	/**
	 * Creates a new Document and returns it.
	 *
	 * @return The newly created Document.
	 */
	createDocument (): Document {
		return implementation.createDocument(null, '');
	},

	/**
	 * The Document constructor.
	 */
	Document,

	/**
	 * The Node constructor.
	 */
	Node,

	/**
	 * The Element constructor.
	 */
	Element,

	/**
	* The Range constructor.
	*/
	Range,

	/**
	 * The MutationObserver constructor.
	 */
	MutationObserver
};
