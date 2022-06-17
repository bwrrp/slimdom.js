import {
	codepoint,
	codepoints,
	complete,
	consume,
	cut,
	delimited,
	except,
	filter,
	filterUndefined,
	followed,
	map,
	not,
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
	DocumentParseEvent,
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
	WithPosition,
	XMLDeclEvent,
} from './parserEvents';
import ParserStateMachine, { ParserState, ParserStateType } from './ParserStateMachine';

function withPosition<T>(parser: Parser<T>): Parser<WithPosition<T>> {
	return (input: string, offset: number) => {
		const start = offset;
		const res = parser(input, offset);
		if (!res.success) {
			return res;
		}
		return okWithValue(res.offset, { input, start, end: res.offset, ...res.value });
	};
}

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
// const Char = codepoint(isValidChar, ['valid character']);

export const CompleteChars = complete(codepoints(isValidChar));

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
function isValidWhitespace(cp: number): boolean {
	return cp === 0x20 || cp === 0x9 || cp === 0xd || cp === 0xa;
}
const S = codepoints(isValidWhitespace, ['whitespace']);

export const CompleteWhitespace = complete(codepoints(isValidWhitespace));

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
// const NameChar = codepoint(isValidNameChar, ['valid name character']);

// [5] Name ::= NameStartChar (NameChar)*
const Name = recognize(preceded(NameStartChar, codepoints(isValidNameChar)));

export const CompleteName = complete(Name);

const NCName = filter(Name, (name) => !name.includes(':'), ['name must not contain colon']);

// [6] Names ::= Name (#x20 Name)*
// const Names = then(Name, star(preceded(SPACE, Name)), (first, next) => [first, ...next]);

// [7] Nmtoken ::= (NameChar)+
const Nmtoken = recognize(codepoints(isValidNameChar, ['valid name character']));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// const NmTokens = then(Nmtoken, star(preceded(SPACE, Nmtoken)), (first, next) => [first, ...next]);

// [66] CharRef ::= '&#' [0-9]+ ';'
//      | '&#x' [0-9a-fA-F]+ ';'
const CharRef: Parser<CharRefEvent> = withPosition(
	map(
		filter(
			or([
				map(
					delimited(
						CHARREF_HEX_START,
						recognize(plusConsumed(HEX_DIGIT)),
						SEMICOLON,
						true
					),
					(n) => parseInt(n, 16)
				),
				map(
					delimited(CHARREF_START, recognize(plusConsumed(DIGIT)), SEMICOLON, true),
					(n) => parseInt(n, 10)
				),
			]),
			(cp) => isValidChar(cp),
			['character reference must reference a valid character']
		),
		(cp) => ({ type: ParserEventType.CharRef, cp })
	)
);

// [68] EntityRef ::= '&' Name ';'
// Namespaces spec makes this an NCName
const EntityRef: Parser<EntityRefEvent> = withPosition(
	map(delimited(AMPERSAND, NCName, cut(SEMICOLON)), (name) => ({
		type: ParserEventType.EntityRef,
		name,
	}))
);

// [67] Reference ::= EntityRef | CharRef
const Reference: Parser<ReferenceEvent> = or<ReferenceEvent>([EntityRef, CharRef]);

// [69] PEReference ::= '%' Name ';'
// Namespaces spec makes this an NCName
const PEReference: Parser<PEReferenceEvent> = withPosition(
	map(delimited(PERCENT, NCName, SEMICOLON), (name) => ({
		type: ParserEventType.PEReference,
		name,
	}))
);

// [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"'
//     | "'" ([^%&'] | PEReference | Reference)* "'"
const PERCENT_CP = 0x25;
const EntityValue = or([
	delimited(
		DOUBLE_QUOTE,
		star(
			or<EntityValueEvent>([
				recognize(
					codepoints(
						(cp) =>
							cp !== PERCENT_CP &&
							cp !== AMPERSAND_CP &&
							cp !== DOUBLE_QUOTE_CP &&
							isValidChar(cp),
						[]
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
					codepoints(
						(cp) =>
							cp !== PERCENT_CP &&
							cp !== AMPERSAND_CP &&
							cp !== SINGLE_QUOTE_CP &&
							isValidChar(cp),
						[]
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
					codepoints(
						(cp) =>
							cp !== ANGLE_BRACKET_OPEN_CP &&
							cp !== AMPERSAND_CP &&
							cp !== DOUBLE_QUOTE_CP &&
							isValidChar(cp),
						[]
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
					codepoints(
						(cp) =>
							cp !== ANGLE_BRACKET_OPEN_CP &&
							cp !== AMPERSAND_CP &&
							cp !== SINGLE_QUOTE_CP &&
							isValidChar(cp),
						[]
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
				codepoints(
					(cp) => cp !== ANGLE_BRACKET_OPEN_CP && cp !== AMPERSAND_CP && isValidChar(cp),
					[]
				)
			),
			Reference,
		])
	)
);

// [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
const SystemLiteral = filter(
	or([
		delimited(
			DOUBLE_QUOTE,
			recognize(codepoints((cp) => cp !== DOUBLE_QUOTE_CP && isValidChar(cp))),
			DOUBLE_QUOTE
		),
		delimited(
			SINGLE_QUOTE,
			recognize(codepoints((cp) => cp !== SINGLE_QUOTE_CP && isValidChar(cp))),
			SINGLE_QUOTE
		),
	]),
	(systemId) => !systemId.includes('#'),
	['system identifier must not contain a fragment identifier']
);

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
// const PubidChar = codepoint(isValidPubidChar, ['valid public ID character']);

export const CompletePubidChars = complete(codepoints(isValidPubidChar));

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
const PubidLiteral = or([
	delimited(
		DOUBLE_QUOTE,
		recognize(codepoints((cp) => cp !== DOUBLE_QUOTE_CP && isValidPubidChar(cp))),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		recognize(codepoints((cp) => cp !== SINGLE_QUOTE_CP && isValidPubidChar(cp))),
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
				// Fast path: filtered codepoints
				codepoints(
					(cp) =>
						cp !== ANGLE_BRACKET_OPEN_CP &&
						cp !== AMPERSAND_CP &&
						cp !== SQUARE_BRACKET_CLOSE_CP &&
						isValidChar(cp),
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
		recognize(
			starConsumed(
				or([
					// Fast path - any Char except "-"
					codepoints((cp) => cp !== DASH_CP && isValidChar(cp), []),
					// Dash may not be followed by another dash
					followed(consume(DASH), not(DASH, ['comment content may not contain --'])),
				])
			)
		),
		COMMENT_END,
		true
	),
	(data) => ({ type: ParserEventType.Comment, data })
);
// [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
// Namespaces spec makes this an NCName
const PITarget = filter(NCName, (target) => target.toLowerCase() !== 'xml', [
	'processing instruction target must not be "xml"',
]);

// [16] PI ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
const QUESTION_MARK_CP = 0x3f;
const PI: Parser<PIEvent> = delimited(
	PI_START,
	then(
		PITarget,
		optional(
			preceded(
				S,
				recognize(
					starConsumed(
						or([
							// Fast path - any Char except "?"
							codepoints((cp) => cp !== QUESTION_MARK_CP && isValidChar(cp), []),
							// Question mark must not be part of "?>"
							followed(consume(QUESTION_MARK), not(ANGLE_BRACKET_CLOSE, ['PI data'])),
						])
					)
				)
			)
		),
		(target, data) => ({ type: ParserEventType.PI, target, data })
	),
	PI_END,
	true
);

// [19] CDStart ::= '<![CDATA['
const CDStart = token('<![CDATA[');

// [20] CData ::= (Char* - (Char* ']]>' Char*))
const CData = recognize(
	starConsumed(
		or([
			// Fast path - any Char except ]
			codepoints((cp) => cp !== SQUARE_BRACKET_CLOSE_CP && isValidChar(cp), []),
			except(consume(SQUARE_BRACKET_CLOSE), SECT_END, ['CData']),
		])
	)
);

// [21] CDEnd ::= ']]>'
const CDEnd = SECT_END;

// [18] CDSect ::= CDStart CData CDEnd
const CDSect: Parser<CDSectEvent> = withPosition(
	map(delimited(CDStart, CData, CDEnd, true), (data) => ({
		type: ParserEventType.CDSect,
		data,
	}))
);

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

const NameWithPosition = withPosition(map(Name, (name) => ({ name })));

// [41] Attribute ::= Name Eq AttValue
const Attribute: Parser<AttributeEvent> = then(
	NameWithPosition,
	preceded(cut(Eq), cut(AttValue)),
	(name, value) => ({
		name,
		value,
	})
);

// [40] STag ::= '<' Name (S Attribute)* S? '>'
// [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
// Combined to avoid reparsing all of the attributes when a tag turns out to be empty
const Attributes = followed(star(preceded(S, Attribute)), optional(S));

const STagOrEmptyElemTag: Parser<STagEvent | EmptyElemTagEvent> = preceded(
	ANGLE_BRACKET_OPEN,
	then<STagEvent, boolean, STagEvent | EmptyElemTagEvent>(
		then(NameWithPosition, cut(Attributes), (name, attributes) => ({
			type: ParserEventType.STag,
			name,
			attributes,
		})),
		cut(or([map(EMPTY_ELEMENT_END, () => true), map(ANGLE_BRACKET_CLOSE, () => false)])),
		(event, isEmpty) =>
			isEmpty
				? {
						type: ParserEventType.EmptyElemTag,
						name: event.name,
						attributes: event.attributes,
				  }
				: event
	)
);

// [42] ETag ::= '</' Name S? '>'
const ETag: Parser<ETagEvent> = withPosition(
	map(delimited(ETAG_START, followed(Name, optional(S)), ANGLE_BRACKET_CLOSE, true), (name) => ({
		type: ParserEventType.ETag,
		name,
	}))
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
				preceded(optional(S), followed(PARENTHESIS_CLOSE, ASTERISK))
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
// Ordering is important here as some tokens are prefixes of others and we want the longest match
const TokenizedType = or([
	token('IDREFS'),
	token('IDREF'),
	token('ID'),
	token('ENTITY'),
	token('ENTITIES'),
	token('NMTOKENS'),
	token('NMTOKEN'),
]);

// [58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'
// Namespaces spec makes this use NCName
const NotationType = preceded(
	followed(NOTATION, S),
	cut(
		delimited(
			followed(PARENTHESIS_OPEN, optional(S)),
			then(
				NCName,
				starConsumed(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), NCName)),
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
	preceded(S, NameWithPosition),
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
// Namespaces spec makes this an NCName
const NDataDecl = preceded(delimited(S, NDATA, S), NCName);

// [73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)
const EntityDef = or<EntityValueEvent[] | ExternalEntityEvent>([
	EntityValue,
	then(ExternalID, optional(NDataDecl), (ids, ndata) => ({
		ids,
		ndata,
	})),
]);

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
// Namespaces spec makes this an NCName
const GEDecl: Parser<EntityDeclEvent | void> = delimited(
	ENTITY_DECL_START,
	then(preceded(S, NCName), cut(preceded(S, EntityDef)), (name, value) => ({
		type: MarkupdeclEventType.GEDecl,
		name,
		value,
	})),
	preceded(optional(S), ANGLE_BRACKET_CLOSE)
);

// [74] PEDef ::= EntityValue | ExternalID
const PEDef = or<EntityValueEvent[] | void>([EntityValue, consume(ExternalID)]);

// [72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
// Namespaces spec makes this an NCName
const PEDecl: Parser<EntityDeclEvent | void> = delimited(
	followed(ENTITY_DECL_START, preceded(S, PERCENT)),
	then(preceded(S, NCName), cut(preceded(S, PEDef)), (name, value) =>
		value
			? {
					type: MarkupdeclEventType.PEDecl,
					name,
					value,
			  }
			: undefined
	),
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
// Namespaces spec makes this an NCName
const NotationDecl = delimited(
	NOTATION_DECL_START,
	then(delimited(S, NCName, S), or([consume(ExternalID), consume(PublicID)]), () => undefined),
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
>([CharData, STagOrEmptyElemTag, ETag, Reference, CDSect, PI, Comment]);

const content: ParserState<DocumentParseEvent> = {
	parser: contentEvent,
	type: ParserStateType.star,
};

export function parseContent(input: string): Iterator<DocumentParseEvent> {
	return new ParserStateMachine(input, [content]);
}

// [27] Misc ::= Comment | PI | S
const Misc = or<CommentEvent | PIEvent | void>([Comment, PI, S]);

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
const prolog: ParserState<DocumentParseEvent>[] = [
	{ parser: XMLDecl, type: ParserStateType.optional },
	{ parser: Misc, type: ParserStateType.star },
	{ parser: doctypedecl, type: ParserStateType.optional },
	{ parser: Misc, type: ParserStateType.star },
];

// [39] element ::= EmptyElemTag
//      | STag content ETag
// Simplified a bit, balancing of tags is checked in the parse loop
const element: ParserState<DocumentParseEvent>[] = [
	{ parser: STagOrEmptyElemTag, type: ParserStateType.one },
	content,
];

// [1] document ::= prolog element Misc*
// As element leads to content, which is a superset of Misc*, we can omit the last Misc*
const document: ParserState<DocumentParseEvent>[] = [...prolog, ...element];

export function parseDocument(input: string): Iterator<DocumentParseEvent> {
	return new ParserStateMachine(input, document);
}
