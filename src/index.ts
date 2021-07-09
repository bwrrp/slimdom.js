export { default as Attr } from './Attr';
export { default as CDATASection } from './CDATASection';
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
export { StaticRange } from './Range';
export { default as Text } from './Text';
export { default as XMLDocument } from './XMLDocument';
export { default as XMLSerializer } from './dom-parsing/XMLSerializer';
export { default as MutationObserver } from './mutation-observer/MutationObserver';
export { default as MutationRecord } from './mutation-observer/MutationRecord';

// Standard DOM does not expose a way to serialize arbitrary nodes as well-formed XML
export { serializeToWellFormedString } from './dom-parsing/XMLSerializer';

// Unsafe exports, required for connecting a HTML parser
export { unsafeCreateAttribute, unsafeCreateElement, unsafeAppendAttribute } from './unsafe';

// To avoid cyclic dependencies and enable multiple contexts with their own constructors later,
// inject all constructors as well as the global document into the default context (i.e., global
// object) here.
import { defaultContext } from './context/Context';

import Attr from './Attr';
import CDATASection from './CDATASection';
import Comment from './Comment';
import Document from './Document';
import DocumentFragment from './DocumentFragment';
import DocumentType from './DocumentType';
import DOMImplementation from './DOMImplementation';
import Element from './Element';
import ProcessingInstruction from './ProcessingInstruction';
import Range from './Range';
import Text from './Text';
import XMLDocument from './XMLDocument';

/**
 * The document associated with the global object. Used when calling constructors directly.
 *
 * Do not mutate this instance. When possible, it is recommended to use `new slimdom.Document` to
 * create a new document, and then use the factory methods on that instance to create other nodes.
 *
 * @public
 */
export const document = new Document();
defaultContext.document = document;

defaultContext.Attr = Attr;
defaultContext.CDATASection = CDATASection;
defaultContext.Comment = Comment;
defaultContext.Document = Document;
defaultContext.DocumentFragment = DocumentFragment;
defaultContext.DocumentType = DocumentType;
defaultContext.DOMImplementation = DOMImplementation;
defaultContext.Element = Element;
defaultContext.ProcessingInstruction = ProcessingInstruction;
defaultContext.Range = Range;
defaultContext.Text = Text;
defaultContext.XMLDocument = XMLDocument;
