import Node from '../Node';
import { asObject } from '../util/typeHelpers';
import { produceXmlSerialization } from './serializationAlgorithms';

/**
 * @public
 */
export default class XMLSerializer {
	/**
	 * Constructs a new XMLSerializer object.
	 */
	public constructor() {}

	/**
	 * Serializes root into a string using an XML serialization. Throws a TypeError exception if
	 * root is not a Node.
	 *
	 * @param root - The node to serialize
	 *
	 * @returns The XML resulting from serialization
	 */
	public serializeToString(root: Node): string {
		root = asObject(root, Node);

		// Produce an XML serialization of root passing a value of false for the require well-formed
		// parameter, and return the result.
		const result: string[] = [];
		produceXmlSerialization(root, false, result);
		return result.join('');
	}
}

/**
 * Serializes root into a string using an XML serialization. Throws if the result would not be
 * well-formed XML.
 *
 * Non-standard: the dom-parsing spec does not provide a way to serialize arbitrary nodes while
 * enforcing well-formedness.
 *
 * @public
 *
 * @param root - The node to serialize
 *
 * @returns The XML resulting from serialization
 */
export function serializeToWellFormedString(root: Node): string {
	root = asObject(root, Node);

	// Produce an XML serialization of root passing a value of false for the require well-formed
	// parameter, and return the result.
	const result: string[] = [];
	produceXmlSerialization(root, true, result);
	return result.join('');
}
