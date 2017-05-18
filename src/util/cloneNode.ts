import Document from '../Document';
import Node from '../Node';

import { getNodeDocument } from './treeHelpers';

// 3.4. Interface Node

/**
 * To clone a node, with an optional document and clone children flag, run these steps:
 *
 * @param node          The node to clone
 * @param cloneChildren Whether to also clone node's descendants
 * @param document      The document used to create the copy
 */
export default function cloneNode (node: Node, cloneChildren: boolean = false, document?: Document): Node {
	// 1. If document is not given, let document be node’s node document.
	if (!document) {
		document = getNodeDocument(node);
	}

	// 2. If node is an element, then:
	// 2.1. Let copy be the result of creating an element, given document, node’s local name, node’s namespace,
	// node’s namespace prefix, and the value of node’s is attribute if present (or null if not). The synchronous
	// custom elements flag should be unset.
	// 2.2. For each attribute in node’s attribute list:
	// 2.2.1. Let copyAttribute be a clone of attribute.
	// 2.2.2. Append copyAttribute to copy.
	// 3. Otherwise, let copy be a node that implements the same interfaces as node, and fulfills these additional
	// requirements, switching on node:
	// Document: Set copy’s encoding, content type, URL, origin, type, and mode, to those of node.
	// DocumentType: Set copy’s name, public ID, and system ID, to those of node.
	// Attr: Set copy’s namespace, namespace prefix, local name, and value, to those of node.
	// Text, Comment: Set copy’s data, to that of node.
	// ProcessingInstruction: Set copy’s target and data to those of node.
	// Any other node: —
	// 4. Set copy’s node document and document to copy, if copy is a document, and set copy’s node document to document
	// otherwise.
	// (all handled by _copy method)
	let copy = node._copy(document);

	// 5. Run any cloning steps defined for node in other applicable specifications and pass copy, node, document and the
	// clone children flag if set, as parameters.
	// (cloning steps not implemented)

	// 6. If the clone children flag is set, clone all the children of node and append them to copy, with document as
	// specified and the clone children flag being set.
	if (cloneChildren) {
		for (let child = node.firstChild; child; child = child.nextSibling) {
			copy.appendChild(cloneNode(child, true, document))
		}
	}

	// 7. Return copy.
	return copy;
}
