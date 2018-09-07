import Attr from './Attr';
import Element from './Element';

/**
 * Create an Attr node without the usual validation of the given names.
 *
 * @param namespace
 * @param prefix
 * @param localName
 * @param value
 * @param element
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

export { createElement as unsafeCreateElement } from './Element';

export { appendAttribute as unsafeAppendAttribute } from './util/attrMutations';
