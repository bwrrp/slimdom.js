import { implementation } from './DOMImplementation';
import XMLDocument from './XMLDocument';

export { implementation } from './DOMImplementation';
export { default as Node } from './Node';
export { default as Range } from './Range';
export { default as MutationObserver } from './mutation-observer/MutationObserver';

export function createDocument (): XMLDocument {
	return implementation.createDocument(null, '');
}
