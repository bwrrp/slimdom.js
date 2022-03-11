export const enum ParserEventType {
	CharRef,
	EntityRef,
	Comment,
	PI,
	CDSect,
	XMLDecl,
	STag,
	ETag,
	EmptyElemTag,
	Doctypedecl,
}

export type CharRefEvent = { type: ParserEventType.CharRef; char: string };

export type EntityRefEvent = { type: ParserEventType.EntityRef; name: string };

export type ReferenceEvent = CharRefEvent | EntityRefEvent;

export type TextEvent = string;

export type AttValueEvent = TextEvent | ReferenceEvent;

export type CommentEvent = { type: ParserEventType.Comment; data: string };

export type PIEvent = { type: ParserEventType.PI; target: string; data: string | null };

export type CDSectEvent = { type: ParserEventType.CDSect; data: string };

export type XMLDeclEvent = {
	type: ParserEventType.XMLDecl;
	version: string;
	encoding: string | null;
	standalone: boolean | null;
};

export type AttributeEvent = { name: string; value: AttValueEvent[] };

export type STagEvent = { type: ParserEventType.STag; name: string; attributes: AttributeEvent[] };

export type ETagEvent = { type: ParserEventType.ETag; name: string };

export type EmptyElemTagEvent = {
	type: ParserEventType.EmptyElemTag;
	name: string;
	attributes: AttributeEvent[];
};

export type ExternalIDEvent = { publicId: string | null; systemId: string | null };

export type DoctypedeclEvent = {
	type: ParserEventType.Doctypedecl;
	name: string;
	ids: ExternalIDEvent | null;
};

export type DocumentParseEvent =
	| string
	| CommentEvent
	| PIEvent
	| XMLDeclEvent
	| DoctypedeclEvent
	| STagEvent
	| ETagEvent
	| EmptyElemTagEvent
	| ReferenceEvent
	| CDSectEvent;
