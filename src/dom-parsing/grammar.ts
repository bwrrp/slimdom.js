import {
	codepoint,
	complete,
	consume,
	cut,
	delimited,
	error,
	except,
	filterUndefined,
	followed,
	map,
	okWithValue,
	optional,
	or,
	Parser,
	ParseResult,
	peek,
	plusConsumed,
	preceded,
	range,
	recognize,
	star,
	starConsumed,
	streaming,
	streamingComplete,
	streamingFilterUndefined,
	streamingOptional,
	streamingStar,
	streamingThen,
	then,
	token,
} from 'prsc';
import {
	AttDefEvent,
	AttlistDeclEvent,
	AttributeEvent,
	AttValueEvent,
	CDSectEvent,
	CharRefEvent,
	CommentEvent,
	DefaultDeclEvent,
	DefaultDeclType,
	DoctypedeclEvent,
	EmptyElemTagEvent,
	EntityDeclEvent,
	EntityRefEvent,
	EntityValueEvent,
	ETagEvent,
	ExternalEntityEvent,
	ExternalIDEvent,
	MarkupdeclEvent,
	MarkupdeclEventType,
	ParserEventType,
	PEReferenceEvent,
	PIEvent,
	ReferenceEvent,
	STagEvent,
	TextEvent,
	XMLDeclEvent,
} from './parserEvents';

const TAB = token('\t');
const LF = token('\n');
const CR = token('\r');
const SPACE = token(' ');
const UNDERSCORE = token('_');
const DASH = token('-');
const PERIOD = token('.');
const DOUBLE_QUOTE = token('"');
const SINGLE_QUOTE = token("'");
const ANGLE_BRACKET_OPEN = token('<');
const ANGLE_BRACKET_CLOSE = token('>');
const AMPERSAND = token('&');
const EQUALS = token('=');
const SQUARE_BRACKET_OPEN = token('[');
const SQUARE_BRACKET_CLOSE = token(']');
const SEMICOLON = token(';');
const PERCENT = token('%');
const PARENTHESIS_OPEN = token('(');
const PARENTHESIS_CLOSE = token(')');
const PLUS = token('+');
const COMMA = token(',');
const QUESTION_MARK = token('?');
const ASTERISK = token('*');
const VERTICAL_BAR = token('|');

const SECT_END = token(']]>');
const COMMENT_START = token('<!--');
const COMMENT_END = token('-->');
const DOUBLE_DASH = token('--');
const PI_START = token('<?');
const PI_END = token('?>');
const ONE_POINT = token('1.');
const VERSION = token('version');
const ENCODING = token('encoding');
const STANDALONE = token('standalone');
const YES = token('yes');
const NO = token('no');
const XML_DECL_START = token('<?xml');
const DOCTYPE_START = token('<!DOCTYPE');
const SYSTEM = token('SYSTEM');
const PUBLIC = token('PUBLIC');
const ETAG_START = token('</');
const EMPTY_ELEMENT_END = token('/>');
const CHARREF_START = token('&#');
const CHARREF_HEX_START = token('&#x');
const ELEMENT_DECL_START = token('<!ELEMENT');
const EMPTY = token('EMPTY');
const ANY = token('ANY');
const PCDATA = token('#PCDATA');
const ATTLIST_DECL_START = token('<!ATTLIST');
const NOTATION = token('NOTATION');
const REQUIRED = token('#REQUIRED');
const IMPLIED = token('#IMPLIED');
const FIXED = token('#FIXED');
// const CONDITIONAL_SECT_START = token('<![');
// const INCLUDE = token('INCLUDE');
// const IGNORE = token('IGNORE');
const ENTITY_DECL_START = token('<!ENTITY');
const NDATA = token('NDATA');
const NOTATION_DECL_START = token('<!NOTATION');

// A-Z
const UPPER_A_CP = 0x41;
const UPPER_Z_CP = 0x5a;
const UPPER_ALPHA = range(UPPER_A_CP, UPPER_Z_CP);

// a-z
const LOWER_A_CP = 0x61;
const LOWER_Z_CP = 0x7a;
const LOWER_ALPHA = range(LOWER_A_CP, LOWER_Z_CP);

// 0-9
const ZERO_CP = 0x30;
const NINE_CP = 0x39;
const DIGIT = range(ZERO_CP, NINE_CP);

const HEX_DIGIT = or([DIGIT, range(0x41, 0x46), range(0x61, 0x66)], ['hexadecimal digit']);

// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
function isValidChar(cp: number): boolean {
	return (
		cp === 0x9 ||
		cp === 0xa ||
		cp === 0xd ||
		(0x20 <= cp && cp <= 0xd7ff) ||
		(0xe000 <= cp && cp <= 0xfffd) ||
		(0x10000 <= cp && cp <= 0x10ffff)
	);
}
const Char = codepoint(isValidChar, ['valid character']);

export const CompleteChars = complete(starConsumed(Char));

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
const S = recognize(plusConsumed(or([SPACE, TAB, CR, LF], ['whitespace character'])));

export const CompleteWhitespace = complete(starConsumed(S));

// [4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF]
//     | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF]
//     | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
const COLON_CP = 0x3a;
const UNDERSCORE_CP = 0x5f;
function isValidNameStartChar(cp: number): boolean {
	return (
		cp === COLON_CP ||
		(UPPER_A_CP <= cp && cp <= UPPER_Z_CP) ||
		cp === UNDERSCORE_CP ||
		(LOWER_A_CP <= cp && cp <= LOWER_Z_CP) ||
		(0xc0 <= cp && cp <= 0xd6) ||
		(0xd8 <= cp && cp <= 0xf6) ||
		(0xf8 <= cp && cp <= 0x2ff) ||
		(0x370 <= cp && cp <= 0x37d) ||
		(0x37f <= cp && cp <= 0x1fff) ||
		(0x200c <= cp && cp <= 0x200d) ||
		(0x2070 <= cp && cp <= 0x218f) ||
		(0x2c00 <= cp && cp <= 0x2fef) ||
		(0x3001 <= cp && cp <= 0xd7ff) ||
		(0xf900 <= cp && cp <= 0xfdcf) ||
		(0xfdf0 <= cp && cp <= 0xfffd) ||
		(0x10000 <= cp && cp <= 0xeffff)
	);
}
const NameStartChar = codepoint(isValidNameStartChar, ['valid name start character']);

// [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
const DASH_CP = 0x2d;
const PERIOD_CP = 0x2e;
function isValidNameChar(cp: number): boolean {
	return (
		isValidNameStartChar(cp) ||
		cp === DASH_CP ||
		cp === PERIOD_CP ||
		(ZERO_CP <= cp && cp <= NINE_CP) ||
		cp === 0xb7 ||
		(0x0300 <= cp && cp <= 0x036f) ||
		(0x203f <= cp && cp <= 0x2040)
	);
}
const NameChar = codepoint(isValidNameChar, ['valid name character']);

// [5] Name ::= NameStartChar (NameChar)*
const Name = recognize(then(NameStartChar, starConsumed(NameChar), () => undefined));

export const CompleteName = complete(Name);

// [6] Names ::= Name (#x20 Name)*
// const Names = then(Name, star(preceded(SPACE, Name)), (first, next) => [first, ...next]);

// [7] Nmtoken ::= (NameChar)+
const Nmtoken = recognize(plusConsumed(NameChar));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// const NmTokens = then(Nmtoken, star(preceded(SPACE, Nmtoken)), (first, next) => [first, ...next]);

// [66] CharRef ::= '&#' [0-9]+ ';'
//      | '&#x' [0-9a-fA-F]+ ';'
const CharRef: Parser<CharRefEvent> = map(
	or([
		map(
			delimited(CHARREF_HEX_START, recognize(plusConsumed(HEX_DIGIT)), SEMICOLON, true),
			(n) => parseInt(n, 16)
		),
		map(delimited(CHARREF_START, recognize(plusConsumed(DIGIT)), SEMICOLON), (n) =>
			parseInt(n, 10)
		),
	]),
	(cp) => ({ type: ParserEventType.CharRef, char: String.fromCodePoint(cp) })
);

// [68] EntityRef ::= '&' Name ';'
const EntityRef: Parser<EntityRefEvent> = map(delimited(AMPERSAND, Name, SEMICOLON), (name) => ({
	type: ParserEventType.EntityRef,
	name,
}));

// [67] Reference ::= EntityRef | CharRef
const Reference: Parser<ReferenceEvent> = or<ReferenceEvent>([EntityRef, CharRef]);

// [69] PEReference ::= '%' Name ';'
const PEReference: Parser<PEReferenceEvent> = map(delimited(PERCENT, Name, SEMICOLON), (name) => ({
	type: ParserEventType.PEReference,
	name,
}));

// [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"'
//     | "'" ([^%&'] | PEReference | Reference)* "'"
const PERCENT_CP = 0x25;
const EntityValue = or([
	delimited(
		DOUBLE_QUOTE,
		star(
			or<EntityValueEvent>([
				recognize(
					plusConsumed(
						codepoint(
							(cp) =>
								cp !== PERCENT_CP && cp !== AMPERSAND_CP && cp !== DOUBLE_QUOTE_CP,
							['entity text']
						)
					)
				),
				PEReference,
				Reference,
			])
		),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		star(
			or<EntityValueEvent>([
				recognize(
					plusConsumed(
						codepoint(
							(cp) =>
								cp !== PERCENT_CP && cp !== AMPERSAND_CP && cp !== SINGLE_QUOTE_CP,
							['entity text']
						)
					)
				),
				PEReference,
				Reference,
			])
		),
		SINGLE_QUOTE,
		true
	),
]);

// [10] AttValue ::= '"' ([^<&"] | Reference)* '"'
//      | "'" ([^<&'] | Reference)* "'"
const DOUBLE_QUOTE_CP = 0x22;
const SINGLE_QUOTE_CP = 0x27;
const AttValue: Parser<AttValueEvent[]> = or([
	delimited(
		DOUBLE_QUOTE,
		star(
			or<AttValueEvent>([
				recognize(
					plusConsumed(
						codepoint(
							(cp) =>
								cp !== ANGLE_BRACKET_OPEN_CP &&
								cp !== AMPERSAND_CP &&
								cp !== DOUBLE_QUOTE_CP,
							['attribute value']
						)
					)
				),
				Reference,
			])
		),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		star(
			or<AttValueEvent>([
				recognize(
					plusConsumed(
						codepoint(
							(cp) =>
								cp !== ANGLE_BRACKET_OPEN_CP &&
								cp !== AMPERSAND_CP &&
								cp !== SINGLE_QUOTE_CP,
							['attribute value']
						)
					)
				),
				Reference,
			])
		),
		SINGLE_QUOTE,
		true
	),
]);

export const EntityReplacementTextInLiteral = complete(
	star(
		or<AttValueEvent>([
			recognize(
				plusConsumed(
					codepoint(
						(cp) => cp !== ANGLE_BRACKET_OPEN_CP && cp !== AMPERSAND_CP,
						['entity replacement text']
					)
				)
			),
			Reference,
		])
	)
);

// [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
const SystemLiteral = or([
	delimited(
		DOUBLE_QUOTE,
		recognize(starConsumed(codepoint((cp) => cp !== DOUBLE_QUOTE_CP, ['system literal']))),
		DOUBLE_QUOTE
	),
	delimited(
		SINGLE_QUOTE,
		recognize(starConsumed(codepoint((cp) => cp !== SINGLE_QUOTE_CP, ['system literal']))),
		SINGLE_QUOTE
	),
]);

// [13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
function isValidPubidChar(cp: number): boolean {
	return (
		cp === 0x20 ||
		cp === 0xd ||
		cp === 0xa ||
		(LOWER_A_CP <= cp && cp <= LOWER_Z_CP) ||
		(UPPER_A_CP <= cp && cp <= UPPER_Z_CP) ||
		(ZERO_CP <= cp && cp <= NINE_CP) ||
		(0x21 <= cp && cp <= 0x2f && cp !== 0x22 && cp !== 0x26) ||
		(0x3a <= cp && cp <= 0x40 && cp !== 0x3c && cp !== 0x3e) ||
		cp === 0x5f
	);
}
const PubidChar = codepoint(isValidPubidChar, ['valid public ID character']);

export const CompletePubidChars = complete(starConsumed(PubidChar));

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
const PubidLiteral = or([
	delimited(
		DOUBLE_QUOTE,
		recognize(starConsumed(except(PubidChar, DOUBLE_QUOTE, ['public id']))),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		recognize(starConsumed(except(PubidChar, SINGLE_QUOTE, ['public id']))),
		SINGLE_QUOTE,
		true
	),
]);

// [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
// CharData is only ever used as optional, it doesn't make sense to have it accept the empty string
// For efficiency, hardcode the disallowed codepoints
const ANGLE_BRACKET_OPEN_CP = 0x3c;
const AMPERSAND_CP = 0x26;
const SQUARE_BRACKET_CLOSE_CP = 0x5d;
const CharData: Parser<TextEvent> = recognize(
	plusConsumed(
		or(
			[
				// Fast path: filtered codepoint
				codepoint(
					(cp) =>
						cp !== ANGLE_BRACKET_OPEN_CP &&
						cp !== AMPERSAND_CP &&
						cp !== SQUARE_BRACKET_CLOSE_CP,
					[]
				),
				// Square bracket is allowed if it's not a SECT_END
				except(consume(SQUARE_BRACKET_CLOSE), SECT_END, []),
			],
			['character data']
		)
	)
);

// [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
const Comment: Parser<CommentEvent> = map(
	delimited(
		COMMENT_START,
		recognize(starConsumed(except(Char, DOUBLE_DASH, ['comment content may not contain --']))),
		COMMENT_END,
		true
	),
	(data) => ({ type: ParserEventType.Comment, data })
);
// [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
// (validation handled in parsing logic)
const PITarget = Name;

// [16] PI ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
const PI: Parser<PIEvent> = delimited(
	PI_START,
	then(
		PITarget,
		optional(preceded(S, recognize(starConsumed(except(Char, PI_END, ['PI data']))))),
		(target, data) => ({ type: ParserEventType.PI, target, data })
	),
	PI_END,
	true
);

// [19] CDStart ::= '<![CDATA['
const CDStart = token('<![CDATA[');

// [20] CData ::= (Char* - (Char* ']]>' Char*))
const CData = recognize(starConsumed(except(Char, SECT_END, ['CData'])));

// [21] CDEnd ::= ']]>'
const CDEnd = SECT_END;

// [18] CDSect ::= CDStart CData CDEnd
const CDSect: Parser<CDSectEvent> = map(delimited(CDStart, CData, CDEnd, true), (data) => ({
	type: ParserEventType.CDSect,
	data,
}));

// [25] Eq ::= S? '=' S?
const Eq = delimited(optional(S), EQUALS, optional(S));

// [26] VersionNum ::= '1.' [0-9]+
const VersionNum = recognize(preceded(ONE_POINT, plusConsumed(DIGIT)));

// [24] VersionInfo ::= S 'version' Eq ("'" VersionNum "'" | '"' VersionNum '"')
const VersionInfo = preceded(
	S,
	preceded(
		VERSION,
		preceded(
			Eq,
			or([
				delimited(DOUBLE_QUOTE, VersionNum, DOUBLE_QUOTE, true),
				delimited(SINGLE_QUOTE, VersionNum, SINGLE_QUOTE, true),
			])
		)
	)
);

// [81] EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
const EncName = recognize(
	preceded(
		or([UPPER_ALPHA, LOWER_ALPHA]),
		starConsumed(
			or([
				UPPER_ALPHA,
				LOWER_ALPHA,
				DIGIT,
				consume(PERIOD),
				consume(UNDERSCORE),
				consume(DASH),
			])
		)
	)
);

// [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' | "'" EncName "'" )
const EncodingDecl = preceded(
	S,
	preceded(
		ENCODING,
		preceded(
			Eq,
			or([
				delimited(DOUBLE_QUOTE, EncName, DOUBLE_QUOTE, true),
				delimited(SINGLE_QUOTE, EncName, SINGLE_QUOTE, true),
			])
		)
	)
);

// [32] SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') '"'))
const YesOrNo = or([map(YES, () => true), map(NO, () => false)]);
const SDDecl = preceded(
	S,
	preceded(
		STANDALONE,
		preceded(
			Eq,
			or([
				delimited(DOUBLE_QUOTE, YesOrNo, DOUBLE_QUOTE, true),
				delimited(SINGLE_QUOTE, YesOrNo, SINGLE_QUOTE, true),
			])
		)
	)
);

// [23] XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
const XMLDecl: Parser<XMLDeclEvent> = delimited(
	XML_DECL_START,
	followed(
		then(
			VersionInfo,
			then(optional(EncodingDecl), optional(SDDecl), (e, s) => [e, s] as const),
			(version, [encoding, standalone]) => ({
				type: ParserEventType.XMLDecl,
				version,
				encoding,
				standalone,
			})
		),
		optional(S)
	),
	PI_END,
	true
);

// [41] Attribute ::= Name Eq AttValue
const Attribute: Parser<AttributeEvent> = then(
	Name,
	preceded(cut(Eq), cut(AttValue)),
	(name, value) => ({
		name,
		value,
	})
);

// [40] STag ::= '<' Name (S Attribute)* S? '>'
const Attributes = followed(star(preceded(S, Attribute)), optional(S));

const STag: Parser<STagEvent> = delimited(
	ANGLE_BRACKET_OPEN,
	then(Name, Attributes, (name, attributes) => ({
		type: ParserEventType.STag,
		name,
		attributes,
	})),
	ANGLE_BRACKET_CLOSE
);

// [42] ETag ::= '</' Name S? '>'
const ETag: Parser<ETagEvent> = map(
	delimited(ETAG_START, followed(Name, optional(S)), ANGLE_BRACKET_CLOSE, true),
	(name) => ({
		type: ParserEventType.ETag,
		name,
	})
);

// [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
const EmptyElemTag: Parser<EmptyElemTagEvent> = delimited(
	ANGLE_BRACKET_OPEN,
	then(Name, Attributes, (name, attributes) => ({
		type: ParserEventType.EmptyElemTag,
		name,
		attributes,
	})),
	EMPTY_ELEMENT_END
);

const Multiplicity = or([QUESTION_MARK, ASTERISK, PLUS]);

// [48] cp ::= (Name | choice | seq) ('?' | '*' | '+')?
const cp = then(or([Name, choiceIndirect, seqIndirect]), optional(Multiplicity), () => undefined);

// [49] choice ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
const choice = delimited(
	followed(PARENTHESIS_OPEN, optional(S)),
	then(
		cp,
		plusConsumed(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), cut(cp))),
		() => undefined
	),
	preceded(optional(S), PARENTHESIS_CLOSE)
);

function choiceIndirect(input: string, offset: number): ParseResult<undefined> {
	return choice(input, offset);
}

// [50] seq ::= '(' S? cp ( S? ',' S? cp )* S? ')'
const seq = delimited(
	followed(PARENTHESIS_OPEN, optional(S)),
	then(
		cp,
		starConsumed(preceded(delimited(optional(S), COMMA, optional(S)), cut(cp))),
		() => undefined
	),
	preceded(optional(S), PARENTHESIS_CLOSE)
);

function seqIndirect(input: string, offset: number): ParseResult<undefined> {
	return seq(input, offset);
}

// [47] children ::= (choice | seq) ('?' | '*' | '+')?
const children = then(or([choice, seq]), optional(Multiplicity), () => undefined);

// [51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*'
//      | '(' S? '#PCDATA' S? ')'
const Mixed = preceded(
	preceded(followed(PARENTHESIS_OPEN, optional(S)), PCDATA),
	or([
		consume(
			followed(
				starConsumed(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Name)),
				followed(PARENTHESIS_CLOSE, ASTERISK)
			)
		),
		consume(followed(optional(S), PARENTHESIS_CLOSE)),
	])
);

// [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
const contentspec = or([consume(EMPTY), consume(ANY), consume(Mixed), consume(children)]);

// [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
const elementdecl = delimited(
	followed(ELEMENT_DECL_START, S),
	then(followed(Name, S), followed(contentspec, optional(S)), () => undefined),
	ANGLE_BRACKET_CLOSE,
	true
);

// [55] StringType ::= 'CDATA'
const StringType = token('CDATA');

// [56] TokenizedType ::= 'ID'
//      | 'IDREF'
//      | 'IDREFS'
//      | 'ENTITY'
//      | 'ENTITIES'
//      | 'NMTOKEN'
//      | 'NMTOKENS'
const TokenizedType = or([
	token('ID'),
	token('IDREF'),
	token('IDREFS'),
	token('ENTITY'),
	token('ENTITIES'),
	token('NMTOKEN'),
	token('NMTOKENS'),
]);

// [58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'
const NotationType = preceded(
	followed(NOTATION, S),
	cut(
		delimited(
			followed(PARENTHESIS_OPEN, optional(S)),
			then(
				Name,
				starConsumed(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Name)),
				() => undefined
			),
			preceded(optional(S), PARENTHESIS_CLOSE),
			true
		)
	)
);

// [59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
const Enumeration = delimited(
	followed(PARENTHESIS_OPEN, optional(S)),
	then(
		Nmtoken,
		starConsumed(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Nmtoken)),
		() => undefined
	),
	preceded(optional(S), PARENTHESIS_CLOSE)
);

// [57] EnumeratedType ::= NotationType | Enumeration
const EnumeratedType = or([NotationType, Enumeration]);

// [54] AttType ::= StringType | TokenizedType | EnumeratedType
// We only need to know whether the attribute's type is 'CDATA'
const AttType = or([
	map(StringType, () => true),
	map(TokenizedType, () => false),
	map(EnumeratedType, () => false),
]);

// [60] DefaultDecl ::= '#REQUIRED' | '#IMPLIED'
//      | (('#FIXED' S)? AttValue)
const DefaultDecl = or<DefaultDeclEvent>([
	map(REQUIRED, () => ({ type: DefaultDeclType.REQUIRED })),
	map(IMPLIED, () => ({ type: DefaultDeclType.IMPLIED })),
	then(
		map(optional(followed(FIXED, S)), (v) => v !== null),
		AttValue,
		(fixed, value) => ({ type: DefaultDeclType.VALUE, fixed, value })
	),
]);

// [53] AttDef ::= S Name S AttType S DefaultDecl
const AttDef: Parser<AttDefEvent> = then(
	preceded(S, Name),
	cut(then(preceded(S, AttType), preceded(S, DefaultDecl), (isCData, def) => ({ isCData, def }))),
	(name, { isCData, def }) => ({ name, isCData, def })
);

// [52] AttlistDecl ::= '<!ATTLIST' S Name AttDef* S? '>'
const AttlistDecl: Parser<AttlistDeclEvent> = delimited(
	followed(ATTLIST_DECL_START, S),
	then(Name, cut(star(AttDef)), (name, attdefs) => ({
		type: MarkupdeclEventType.AttlistDecl,
		name,
		attdefs,
	})),
	preceded(optional(S), ANGLE_BRACKET_CLOSE),
	true
);

// [62] includeSect ::= '<![' S? 'INCLUDE' S? '[' extSubsetDecl ']]>'
// const includeSect = delimited(
// 	delimited(
// 		CONDITIONAL_SECT_START,
// 		delimited(optional(S), INCLUDE, optional(S)),
// 		SQUARE_BRACKET_OPEN
// 	),
// 	extSubsetDeclIndirect,
// 	SECT_END
// );

// [65] Ignore ::= Char* - (Char* ('<![' | ']]>') Char*)
// const Ignore = star(except(Char, or([CONDITIONAL_SECT_START, SECT_END]), ['ignore sect contents']));

// [64] ignoreSectContents ::= Ignore ('<![' ignoreSectContents ']]>' Ignore)*
// const ignoreSectContents = then(
// 	Ignore,
// 	star(
// 		then(
// 			delimited(CONDITIONAL_SECT_START, ignoreSectContentsIndirect, SECT_END),
// 			Ignore,
// 			() => undefined
// 		)
// 	),
// 	() => undefined
// );

// function ignoreSectContentsIndirect(input: string, offset: number): ParseResult<void> {
// 	return ignoreSectContents(input, offset);
// }

// [63] ignoreSect ::= '<![' S? 'IGNORE' S? '[' ignoreSectContents* ']]>'
// const ignoreSect = delimited(
// 	delimited(
// 		CONDITIONAL_SECT_START,
// 		delimited(optional(S), IGNORE, optional(S)),
// 		SQUARE_BRACKET_OPEN
// 	),
// 	star(ignoreSectContents),
// 	SECT_END
// );

// [61] conditionalSect ::= includeSect | ignoreSect
// const conditionalSect = or([consume(includeSect), consume(ignoreSect)]);

// [75] ExternalID ::= 'SYSTEM' S SystemLiteral
//      | 'PUBLIC' S PubidLiteral S SystemLiteral
const ExternalID: Parser<ExternalIDEvent> = or<ExternalIDEvent>([
	map(preceded(SYSTEM, preceded(S, SystemLiteral)), (systemId) => ({
		publicId: null,
		systemId,
	})),
	preceded(
		PUBLIC,
		then(preceded(S, PubidLiteral), preceded(S, SystemLiteral), (publicId, systemId) => ({
			publicId,
			systemId,
		}))
	),
]);

// [76] NDataDecl ::= S 'NDATA' S Name
const NDataDecl = preceded(delimited(S, NDATA, S), Name);

// [73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)
const EntityDef = or<EntityValueEvent[] | ExternalEntityEvent>([
	EntityValue,
	then(ExternalID, optional(NDataDecl), (ids, ndata) => ({
		ids,
		ndata,
	})),
]);

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
const GEDecl: Parser<EntityDeclEvent | void> = delimited(
	ENTITY_DECL_START,
	then(preceded(S, Name), cut(preceded(S, EntityDef)), (name, value) => ({
		type: MarkupdeclEventType.EntityDecl,
		name,
		value,
	})),
	preceded(optional(S), ANGLE_BRACKET_CLOSE)
);

// [74] PEDef ::= EntityValue | ExternalID
const PEDef = or([consume(EntityValue), consume(ExternalID)]);

// [72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
const PEDecl = delimited(
	followed(ENTITY_DECL_START, preceded(S, PERCENT)),
	then(preceded(S, Name), preceded(S, PEDef), () => undefined),
	preceded(optional(S), ANGLE_BRACKET_CLOSE),
	true
);

// [70] EntityDecl ::= GEDecl | PEDecl
const EntityDecl = preceded(peek(ENTITY_DECL_START), cut(or([GEDecl, PEDecl])));

// [77] TextDecl ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
// const TextDecl = delimited(
// 	XML_DECL_START,
// 	then(optional(VersionInfo), EncodingDecl, () => undefined),
// 	preceded(optional(S), PI_END)
// );

// [78] extParsedEnt ::= TextDecl? content
// const extParsedEnt = then(optional(TextDecl), content, () => undefined);

// [83] PublicID ::= 'PUBLIC' S PubidLiteral
const PublicID: Parser<ExternalIDEvent> = map(
	followed(followed(PUBLIC, S), PubidLiteral),
	(publicId) => ({ publicId, systemId: null })
);

// [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
const NotationDecl = delimited(
	NOTATION_DECL_START,
	then(delimited(S, Name, S), or([consume(ExternalID), consume(PublicID)]), () => undefined),
	preceded(optional(S), ANGLE_BRACKET_CLOSE),
	true
);

// [29] markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment
const markupdecl = or<MarkupdeclEvent | void>([
	consume(elementdecl),
	AttlistDecl,
	EntityDecl,
	consume(NotationDecl),
	consume(PI),
	consume(Comment),
]);

// [28a] DeclSep ::= PEReference | S
const DeclSep = or([consume(PEReference), consume(S)]);

// [28b] intSubset ::= (markupdecl | DeclSep)*
const intSubset: Parser<MarkupdeclEvent[]> = filterUndefined(
	star(or<MarkupdeclEvent | void>([markupdecl, DeclSep]))
);

// [31] extSubsetDecl ::= ( markupdecl | conditionalSect | DeclSep)*
// const extSubsetDecl = star(or([consume(markupdecl), consume(conditionalSect), consume(DeclSep)]));

// function extSubsetDeclIndirect(input: string, offset: number): ParseResult<void> {
// 	return extSubset(input, offset);
// }

// [30] extSubset ::= TextDecl? extSubsetDecl
// TODO: productions for the external subset apply after parameter entity references are included
// const extSubset = then(optional(TextDecl), extSubsetDecl, () => undefined);

// [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
const doctypedecl: Parser<DoctypedeclEvent> = delimited(
	DOCTYPE_START,
	preceded(
		S,
		then(
			Name,
			then(
				followed(optional(preceded(S, ExternalID)), optional(S)),
				optional(
					followed(
						delimited(SQUARE_BRACKET_OPEN, intSubset, SQUARE_BRACKET_CLOSE, true),
						optional(S)
					)
				),
				(ids, intSubset) => ({ ids, intSubset })
			),
			(name, { ids, intSubset }) => ({
				type: ParserEventType.Doctypedecl,
				name,
				ids,
				intSubset,
			})
		)
	),
	ANGLE_BRACKET_CLOSE
);

// [27] Misc ::= Comment | PI | S
const Misc = or<CommentEvent | PIEvent | void>([Comment, PI, consume(S)]);

const MiscStar = streamingStar(streamingFilterUndefined(streaming(Misc)));

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
const prolog = streamingThen(
	streamingThen(streamingOptional(streaming(XMLDecl)), MiscStar),
	streamingOptional(streamingThen(streaming(doctypedecl), MiscStar))
);

// [43] content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
// Here's where we deviate a little from the spec grammar in order to avoid the recursion around
// elements. Instead, consider start and end tags as separate events and handle / check nesting in
// the caller. CharData is already greedy, so we can include it into the big or.
const contentEvent = or<
	| string
	| STagEvent
	| ETagEvent
	| EmptyElemTagEvent
	| ReferenceEvent
	| CDSectEvent
	| PIEvent
	| CommentEvent
>([CharData, STag, ETag, EmptyElemTag, Reference, CDSect, PI, Comment]);

const content = streamingStar(streaming(contentEvent));

export const contentComplete = streamingComplete(content);

// [39] element ::= EmptyElemTag
//      | STag content ETag
const elementStart: Parser<STagEvent | EmptyElemTagEvent> = or<STagEvent | EmptyElemTagEvent>([
	STag,
	EmptyElemTag,
]);

const element = streamingThen(streaming(elementStart), content);

// [1] document ::= prolog element Misc*
// As element leads to content, which is a superset of Misc*, we can omit the last Misc*
export const document = streamingComplete(streamingThen(prolog, element));
