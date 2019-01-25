import Attr from './Attr';
import Document from './Document';
import { createElement, default as Element } from './Element';
import { appendAttribute } from './util/attrMutations';

/**
 * Create an Attr node without the usual validation of the given names.
 *
 * @public
 *
 * @param namespace - The namespace URI for the new node
 * @param prefix    - The prefix for the new node
 * @param localName - The local name for the new node
 * @param value     - The value for the new node
 * @param element   - The owner element for the new node
 *
 * @returns A new Attr node with the given values
 */
export function unsafeCreateAttribute(
	namespace: string | null,
	prefix: string | null,
	localName: string,
	value: string,
	ownerElement: Element | null
): Attr {
	return new Attr(namespace, prefix, localName, value, ownerElement);
}

/**
 * Create an Element node without the usual validation of the given names.
 *
 * @public
 *
 * @param document  - The node document for the new element
 * @param localName - The local name for the new element
 * @param namespace - The namespace URI for the new element, or null for the null namespace
 * @param prefix    - The prefix for the new element, or null for no prefix
 *
 * @returns The new element
 */
export function unsafeCreateElement(
	document: Document,
	localName: string,
	namespace: string | null,
	prefix: string | null = null
): Element {
	return createElement(document, localName, namespace, prefix);
}

/**
 * Append an attribute attribute to an element without the usual checks.
 *
 * @public
 *
 * @param attribute - The attribute to append
 * @param element   - The element to append attribute to
 */
export function unsafeAppendAttribute(attribute: Attr, element: Element): void {
	appendAttribute(attribute, element);
}
