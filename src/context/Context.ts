import Attr from '../Attr';
import CDATASection from '../CDATASection';
import Comment from '../Comment';
import Document from '../Document';
import DocumentFragment from '../DocumentFragment';
import DocumentType from '../DocumentType';
import DOMImplementation from '../DOMImplementation';
import Element from '../Element';
import Node from '../Node';
import ProcessingInstruction from '../ProcessingInstruction';
import Range from '../Range';
import Text from '../Text';
import XMLDocument from '../XMLDocument';

import NotifyList from '../mutation-observer/NotifyList';
import { NodeType } from '../util/NodeType';

export type AttrConstructor = new (
	namespace: string | null,
	prefix: string | null,
	localName: string,
	value: string,
	element: Element | null
) => Attr;
export type CDATASectionConstructor = new (data: string) => CDATASection;
export type CommentConstructor = new (data: string) => Comment;
export type DocumentConstructor = new () => Document;
export type DocumentFragmentConstructor = new () => DocumentFragment;
export type DocumentTypeConstructor = new (
	name: string,
	publicId?: string,
	systemId?: string
) => DocumentType;
export type DOMImplementationConstructor = new (document: Document) => DOMImplementation;
export type ElementConstructor = new (
	namespace: string | null,
	prefix: string | null,
	localName: string
) => Element;
export type ProcessingInstructionConstructor = new (
	target: string,
	data: string
) => ProcessingInstruction;
export type RangeConstructor = new () => Range;
export type TextConstructor = new (data: string) => Text;
export type XMLDocumentConstructor = new () => XMLDocument;

export interface Context {
	document: Document;

	_notifyList: NotifyList;
	_ranges: Range[];

	Attr: AttrConstructor;
	CDATASection: CDATASectionConstructor;
	Comment: CommentConstructor;
	Document: DocumentConstructor;
	DocumentFragment: DocumentFragmentConstructor;
	DocumentType: DocumentTypeConstructor;
	DOMImplementation: DOMImplementationConstructor;
	Element: ElementConstructor;
	ProcessingInstruction: ProcessingInstructionConstructor;
	Range: RangeConstructor;
	Text: TextConstructor;
	XMLDocument: XMLDocumentConstructor;
}

/**
 * The DefaultContext is comparable to the global object in that it tracks its associated document.
 * It also serves as a way to inject the constructors for the constructable types, avoiding cyclic
 * dependencies.
 */
export class DefaultContext implements Context {
	public document!: Document;

	/**
	 * The NotifyList instance is shared between all MutationObserver objects. It holds references
	 * to all MutationObserver instances that have collected records, and is responsible for
	 * invoking their callbacks when control returns to the event loop.
	 */
	public _notifyList: NotifyList = new NotifyList();
	public _ranges: Range[] = [];

	public Attr!: AttrConstructor;
	public CDATASection!: CDATASectionConstructor;
	public Comment!: CommentConstructor;
	public Document!: DocumentConstructor;
	public DocumentFragment!: DocumentFragmentConstructor;
	public DocumentType!: DocumentTypeConstructor;
	public DOMImplementation!: DOMImplementationConstructor;
	public Element!: ElementConstructor;
	public ProcessingInstruction!: ProcessingInstructionConstructor;
	public Range!: RangeConstructor;
	public Text!: TextConstructor;
	public XMLDocument!: XMLDocumentConstructor;
}

// TODO: make it possible to create multiple contexts by binding constructors to each instance
export const defaultContext = new DefaultContext();

export function getContext(instance: Node | Range): Context {
	return defaultContext;
}
