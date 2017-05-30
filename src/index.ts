import XMLDocument from './XMLDocument';

export { default as Attr } from './Attr';
export { default as CharacterData } from './CharacterData';
export { default as Comment } from './Comment';
export { default as Document } from './Document';
export { default as DocumentFragment } from './DocumentFragment';
export { default as DocumentType } from './DocumentType';
export { default as DOMImplementation } from './DOMImplementation';
export { default as Element } from './Element';
export { default as Node } from './Node';
export { default as ProcessingInstruction } from './ProcessingInstruction';
export { default as Range } from './Range';
export { default as Text } from './Text';
export { default as XMLDocument } from './XMLDocument';
export { default as MutationObserver } from './mutation-observer/MutationObserver';

export function createDocument (): XMLDocument {
	return new XMLDocument();
}
