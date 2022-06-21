export type Input = ArrayLike<number>;

export type WithPosition<TEvent, TInput = Input> = TEvent & {
	input: TInput;
	start: number;
	end: number;
};

export const enum ParserEventType {
	CharRef,
	EntityRef,
	PEReference,
	Comment,
	PI,
	CDSect,
	XMLDecl,
	STag,
	ETag,
	EmptyElemTag,
	Doctypedecl,
}

export type CharRefEvent = WithPosition<{ type: ParserEventType.CharRef; cp: number }>;

export type EntityRefEvent = WithPosition<{ type: ParserEventType.EntityRef; name: string }>;

export type ReferenceEvent = CharRefEvent | EntityRefEvent;

export type PEReferenceEvent = WithPosition<{ type: ParserEventType.PEReference; name: string }>;

export type TextEvent = string;

export type AttValueEvent = TextEvent | ReferenceEvent;

export type CommentEvent = { type: ParserEventType.Comment; data: string };

export type PIEvent = { type: ParserEventType.PI; target: string; data: string | null };

export type CDSectEvent = WithPosition<{ type: ParserEventType.CDSect; data: string }>;

export type XMLDeclEvent = {
	type: ParserEventType.XMLDecl;
	version: string;
	encoding: string | null;
	standalone: boolean | null;
};

export type AttributeEvent = { name: WithPosition<{ name: string }>; value: AttValueEvent[] };

export type STagEvent = {
	type: ParserEventType.STag;
	name: WithPosition<{ name: string }>;
	attributes: AttributeEvent[];
};

export type ETagEvent = WithPosition<{ type: ParserEventType.ETag; name: string }>;

export type EmptyElemTagEvent = {
	type: ParserEventType.EmptyElemTag;
	name: WithPosition<{ name: string }>;
	attributes: AttributeEvent[];
};

export type ExternalIDEvent = { publicId: string | null; systemId: string | null };

export const enum MarkupdeclEventType {
	AttlistDecl,
	GEDecl,
	PEDecl,
}

export const enum DefaultDeclType {
	REQUIRED,
	IMPLIED,
	VALUE,
}

export type DefaultDeclEvent =
	| { type: DefaultDeclType.REQUIRED }
	| { type: DefaultDeclType.IMPLIED }
	| { type: DefaultDeclType.VALUE; fixed: boolean; value: AttValueEvent[] };

export type AttDefEvent = {
	name: WithPosition<{ name: string }>;
	isCData: boolean;
	def: DefaultDeclEvent;
};

export type AttlistDeclEvent = {
	type: MarkupdeclEventType.AttlistDecl;
	name: string;
	attdefs: AttDefEvent[];
};

export type EntityValueEvent = TextEvent | ReferenceEvent | PEReferenceEvent;

export type ExternalEntityEvent = { ids: ExternalIDEvent; ndata: string | null };

export type EntityDeclEvent = {
	type: MarkupdeclEventType.GEDecl | MarkupdeclEventType.PEDecl;
	name: string;
	value: EntityValueEvent[] | ExternalEntityEvent;
};

export type MarkupdeclEvent = AttlistDeclEvent | EntityDeclEvent;

export type DoctypedeclEvent = {
	type: ParserEventType.Doctypedecl;
	name: string;
	ids: ExternalIDEvent | null;
	intSubset: MarkupdeclEvent[] | null;
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
