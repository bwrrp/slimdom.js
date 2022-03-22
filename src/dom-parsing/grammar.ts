import {
	complete,
	cut,
	delimited,
	end,
	error,
	followed,
	map,
	not,
	ok,
	okWithValue,
	optional,
	or,
	Parser,
	ParseResult,
	plus,
	preceded,
	recognize,
	star,
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
	EntityRefEvent,
	ETagEvent,
	ExternalIDEvent,
	MarkupdeclEvent,
	MarkupdeclEventType,
	ParserEventType,
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
const COLON = token(':');
const UNDERSCORE = token('_');
const DASH = token('-');
const PERIOD = token('.');
const MIDDLE_DOT = token('\u00B7');
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
const SLASH = token('/');
const QUESTION_MARK = token('?');
const EXCLAMATION_MARK = token('!');
const ASTERISK = token('*');
const OCTOTHORPE = token('#');
const AT = token('@');
const DOLLAR = token('$');
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

function range(firstCodePoint: number, lastCodePoint: number): Parser<string> {
	return (input: string, offset: number) => {
		const cp = input.codePointAt(offset);
		if (cp !== undefined && cp >= firstCodePoint && cp <= lastCodePoint) {
			const char = String.fromCodePoint(cp);
			return okWithValue(offset + char.length, char);
		}
		return error(offset, [
			`${String.fromCodePoint(firstCodePoint)}-${String.fromCodePoint(lastCodePoint)}`,
		]);
	};
}

// A-Z
const UPPER_ALPHA = range(0x41, 0x5a);

// a-z
const LOWER_ALPHA = range(0x61, 0x7a);

// 0-9
const DIGIT = range(0x30, 0x39);

const HEX_DIGIT = or([DIGIT, range(0x41, 0x46), range(0x61, 0x66)]);

function skipChars(nCodepoints: number): Parser<void> {
	return (input: string, offset: number) => {
		let i = nCodepoints;
		while (i > 0) {
			const cp = input.codePointAt(offset);
			if (cp === undefined) {
				return error(offset, ['any character']);
			}
			offset += String.fromCodePoint(cp).length;
			i -= 1;
		}
		return ok(offset);
	};
}

function consume<T>(parser: Parser<T>): Parser<void> {
	return map(parser, () => undefined);
}

function except<T, U>(match: Parser<T>, except: Parser<U>, expect: string): Parser<T> {
	return preceded(not(except, [expect]), match);
}

function caseInsensitiveToken(token: string): Parser<string> {
	const lowerCaseToken = token.toLowerCase();
	return (input: string, offset: number) => {
		const match = input.substring(offset, offset + token.length);
		if (match.toLowerCase() === lowerCaseToken) {
			return okWithValue(offset + match.length, match);
		}
		return error(offset, [token]);
	};
}

// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
const Char = or([
	TAB,
	LF,
	CR,
	range(0x20, 0xd7ff),
	range(0xe000, 0xfffd),
	range(0x10000, 0x10ffff),
]);

const CompleteChars = complete(star(Char));

/**
 * Returns true if all characters in value match the Char production.
 *
 * @param value - The string to check
 *
 * @returns true if all characters in value match Char, otherwise false
 */
export function matchesCharProduction(value: string): boolean {
	return CompleteChars(value, 0).success;
}

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
const S = recognize(plus(or([SPACE, TAB, CR, LF])));

const CompleteWhitespace = complete(star(S));

/**
 * Returns true if all characters in value match the S production.
 *
 * @param value - The string to check
 *
 * @returns true if all characters in value match S, otherwise false
 */
export function isWhitespace(value: string): boolean {
	return CompleteWhitespace(value, 0).success;
}

// [4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF]
//     | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF]
//     | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
const NameStartChar = or([
	COLON,
	range(0x41, 0x5a),
	UNDERSCORE,
	UPPER_ALPHA,
	LOWER_ALPHA,
	range(0xd8, 0xf6),
	range(0xf8, 0x2ff),
	range(0x370, 0x37d),
	range(0x37f, 0x1fff),
	range(0x200c, 0x200d),
	range(0x2070, 0x218f),
	range(0x2c00, 0x2fef),
	range(0x3001, 0xd7ff),
	range(0xf900, 0xfdcf),
	range(0xfdf0, 0xfffd),
	range(0x10000, 0xeffff),
]);

// [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
const NameChar = or([
	NameStartChar,
	DASH,
	PERIOD,
	DIGIT,
	MIDDLE_DOT,
	range(0x0300, 0x036f),
	range(0x203f, 0x2040),
]);

// [5] Name ::= NameStartChar (NameChar)*
const Name = recognize(then(NameStartChar, star(NameChar), () => undefined));

const CompleteName = complete(Name);

/**
 * Returns true if name matches the Name production.
 *
 * @param name - The name to check
 *
 * @returns true if name matches Name, otherwise false
 */
export function matchesNameProduction(name: string): boolean {
	return CompleteName(name, 0).success;
}

// [6] Names ::= Name (#x20 Name)*
// const Names = then(Name, star(preceded(SPACE, Name)), (first, next) => [first, ...next]);

// [7] Nmtoken ::= (NameChar)+
const Nmtoken = recognize(plus(NameChar));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// const NmTokens = then(Nmtoken, star(preceded(SPACE, Nmtoken)), (first, next) => [first, ...next]);

// [66] CharRef ::= '&#' [0-9]+ ';'
//      | '&#x' [0-9a-fA-F]+ ';'
const CharRef: Parser<CharRefEvent> = map(
	or([
		map(delimited(CHARREF_HEX_START, recognize(plus(HEX_DIGIT)), SEMICOLON, true), (n) =>
			parseInt(n, 16)
		),
		map(delimited(CHARREF_START, recognize(plus(DIGIT)), SEMICOLON), (n) => parseInt(n, 10)),
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
const PEReference = map(delimited(PERCENT, Name, SEMICOLON), (name) => undefined);

// [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"'
//     | "'" ([^%&'] | PEReference | Reference)* "'"
const EntityValue = or([
	delimited(
		DOUBLE_QUOTE,
		star(
			or([
				consume(
					recognize(
						plus(
							except(
								skipChars(1),
								or([PERCENT, AMPERSAND, DOUBLE_QUOTE]),
								'entity text'
							)
						)
					)
				),
				consume(PEReference),
				consume(Reference),
			])
		),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		star(
			or([
				consume(
					recognize(
						plus(
							except(
								skipChars(1),
								or([PERCENT, AMPERSAND, SINGLE_QUOTE]),
								'entity text'
							)
						)
					)
				),
				consume(PEReference),
				consume(Reference),
			])
		),
		SINGLE_QUOTE,
		true
	),
]);

// [10] AttValue ::= '"' ([^<&"] | Reference)* '"'
//      | "'" ([^<&'] | Reference)* "'"
const AttValue: Parser<AttValueEvent[]> = or([
	delimited(
		DOUBLE_QUOTE,
		star(
			or<AttValueEvent>([
				recognize(
					plus(
						except(
							skipChars(1),
							or([ANGLE_BRACKET_OPEN, AMPERSAND, DOUBLE_QUOTE]),
							'attribute value'
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
					plus(
						except(
							skipChars(1),
							or([ANGLE_BRACKET_OPEN, AMPERSAND, SINGLE_QUOTE]),
							'attribute value'
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

// [11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")
const SystemLiteral = or([
	delimited(
		DOUBLE_QUOTE,
		recognize(star(except(skipChars(1), DOUBLE_QUOTE, 'system literal'))),
		DOUBLE_QUOTE
	),
	delimited(
		SINGLE_QUOTE,
		recognize(star(except(skipChars(1), SINGLE_QUOTE, 'system literal'))),
		SINGLE_QUOTE
	),
]);

// [13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
const PubidChar = or([
	SPACE,
	CR,
	LF,
	LOWER_ALPHA,
	UPPER_ALPHA,
	DIGIT,
	DASH,
	SINGLE_QUOTE,
	PARENTHESIS_OPEN,
	PARENTHESIS_CLOSE,
	PLUS,
	COMMA,
	PERIOD,
	SLASH,
	COLON,
	EQUALS,
	QUESTION_MARK,
	SEMICOLON,
	EXCLAMATION_MARK,
	ASTERISK,
	OCTOTHORPE,
	AT,
	DOLLAR,
	UNDERSCORE,
	PERCENT,
]);

const CompletePubidChars = complete(star(PubidChar));

/**
 * Returns true if all characters in value match the PubidChar production.
 *
 * @param value - The string to check
 *
 * @returns true if all characters in value match PubidChar, otherwise false
 */
export function matchesPubidCharProduction(value: string): boolean {
	return CompletePubidChars(value, 0).success;
}

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
const PubidLiteral = or([
	delimited(
		DOUBLE_QUOTE,
		recognize(star(except(PubidChar, DOUBLE_QUOTE, 'public id'))),
		DOUBLE_QUOTE,
		true
	),
	delimited(
		SINGLE_QUOTE,
		recognize(star(except(PubidChar, SINGLE_QUOTE, 'public id'))),
		SINGLE_QUOTE,
		true
	),
]);

// [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
// CharData is only used as optional, it doesn't make sense to have it accept the empty string
const CharData: Parser<TextEvent> = recognize(
	plus(except(skipChars(1), or([ANGLE_BRACKET_OPEN, AMPERSAND, SECT_END]), 'character data'))
);

// [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
const Comment: Parser<CommentEvent> = map(
	delimited(
		COMMENT_START,
		recognize(star(except(Char, DOUBLE_DASH, 'comment content may not contain --'))),
		COMMENT_END,
		true
	),
	(data) => ({ type: ParserEventType.Comment, data })
);
// [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
const PITarget = except(Name, caseInsensitiveToken('xml'), 'PI target may not be "xml"');

// [16] PI ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
const PI: Parser<PIEvent> = delimited(
	PI_START,
	then(
		PITarget,
		optional(preceded(S, recognize(star(except(Char, PI_END, 'PI data'))))),
		(target, data) => ({ type: ParserEventType.PI, target, data })
	),
	PI_END,
	true
);

// [19] CDStart ::= '<![CDATA['
const CDStart = token('<![CDATA[');

// [20] CData ::= (Char* - (Char* ']]>' Char*))
const CData = recognize(star(except(Char, SECT_END, 'CData')));

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
const VersionNum = recognize(preceded(ONE_POINT, plus(DIGIT)));

// [24] VersionInfo ::= S 'version' Eq ("'" VersionNum "'" | '"' VersionNum '"')
const VersionInfo = preceded(
	S,
	preceded(
		VERSION,
		preceded(
			Eq,
			or([
				delimited(SINGLE_QUOTE, VersionNum, SINGLE_QUOTE, true),
				delimited(DOUBLE_QUOTE, VersionNum, DOUBLE_QUOTE, true),
			])
		)
	)
);

// [81] EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
const EncName = recognize(
	preceded(
		or([UPPER_ALPHA, LOWER_ALPHA]),
		star(or([UPPER_ALPHA, LOWER_ALPHA, DIGIT, PERIOD, UNDERSCORE, DASH]))
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
				delimited(SINGLE_QUOTE, YesOrNo, SINGLE_QUOTE, true),
				delimited(DOUBLE_QUOTE, YesOrNo, DOUBLE_QUOTE, true),
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
	(name) => ({ type: ParserEventType.ETag, name })
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
		plus(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), cp)),
		() => undefined
	),
	preceded(optional(S), PARENTHESIS_CLOSE),
	true
);

function choiceIndirect(input: string, offset: number): ParseResult<undefined> {
	return choice(input, offset);
}

// [50] seq ::= '(' S? cp ( S? ',' S? cp )* S? ')'
const seq = delimited(
	followed(PARENTHESIS_OPEN, optional(S)),
	then(cp, star(preceded(delimited(optional(S), COMMA, optional(S)), cp)), () => undefined),
	preceded(optional(S), PARENTHESIS_CLOSE),
	true
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
		followed(
			star(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Name)),
			followed(PARENTHESIS_CLOSE, ASTERISK)
		),
		map(followed(optional(S), PARENTHESIS_CLOSE), () => []),
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
	delimited(
		followed(PARENTHESIS_OPEN, optional(S)),
		then(
			Name,
			star(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Name)),
			(first, rest) => [first, ...rest]
		),
		preceded(optional(S), PARENTHESIS_CLOSE),
		true
	)
);

// [59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
const Enumeration = delimited(
	followed(PARENTHESIS_OPEN, optional(S)),
	then(
		Nmtoken,
		star(preceded(delimited(optional(S), VERTICAL_BAR, optional(S)), Nmtoken)),
		(first, rest) => [first, ...rest]
	),
	preceded(optional(S), PARENTHESIS_CLOSE)
);

// [57] EnumeratedType ::= NotationType | Enumeration
const EnumeratedType = or([NotationType, Enumeration]);

// [54] AttType ::= StringType | TokenizedType | EnumeratedType
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
	preceded(optional(S), ANGLE_BRACKET_CLOSE)
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
// const Ignore = star(except(Char, or([CONDITIONAL_SECT_START, SECT_END]), 'ignore sect contents'));

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
const EntityDef = or([EntityValue, then(ExternalID, optional(NDataDecl), () => undefined)]);

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
const GEDecl = delimited(
	ENTITY_DECL_START,
	then(preceded(S, Name), preceded(S, EntityDef), () => undefined),
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
const EntityDecl = or([GEDecl, PEDecl]);

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
	preceded(optional(S), ANGLE_BRACKET_CLOSE)
);

// [29] markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment
const markupdecl = or<MarkupdeclEvent | void>([
	consume(elementdecl),
	AttlistDecl,
	consume(EntityDecl),
	consume(NotationDecl),
	consume(PI),
	consume(Comment),
]);

// [28a] DeclSep ::= PEReference | S
const DeclSep = or([consume(PEReference), consume(S)]);

function filterUndefined<T>(parser: Parser<(T | void)[]>): Parser<T[]> {
	return map(parser, (vs) => vs.filter((v) => v !== undefined) as T[]);
}

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

type StreamingParser<T> = (input: string, offset: number) => Generator<T, ParseResult<unknown>>;

function stream<T>(parser: Parser<T>): StreamingParser<T> {
	return function* (input: string, offset: number) {
		const res = parser(input, offset);
		if (res.success) {
			yield res.value;
		}
		return res;
	};
}

function skipUndefined<T>(parser: StreamingParser<T | void>): StreamingParser<T> {
	return function* (input: string, offset: number) {
		const gen = parser(input, offset);
		let it = gen.next();
		while (!it.done) {
			const value = it.value;
			if (value !== undefined) {
				yield value;
			}
			it = gen.next();
		}
		return it.value;
	};
}

export function collect<T, R>(gen: Generator<T, R>): [T[], R] {
	const values: T[] = [];
	let it = gen.next();
	while (!it.done) {
		values.push(it.value);
		it = gen.next();
	}
	return [values, it.value];
}

function streamingThen<T, U>(
	parser1: StreamingParser<T>,
	parser2: StreamingParser<U>
): StreamingParser<T | U> {
	return function* (input: string, offset: number) {
		const res1 = yield* parser1(input, offset);
		if (!res1.success) {
			return res1;
		}
		return yield* parser2(input, res1.offset);
	};
}

function streamingStar<T>(parser: StreamingParser<T>): StreamingParser<T> {
	return function* (input: string, offset: number) {
		while (true) {
			const [values, result] = collect(parser(input, offset));
			if (!result.success) {
				if (result.fatal) {
					return result;
				}
				return ok(offset);
			}

			yield* values;

			if (offset === result.offset) {
				// Did not advance
				return ok(offset);
			}
			offset = result.offset;
		}
	};
}

function streamingOptional<T>(parser: StreamingParser<T>): StreamingParser<T> {
	return function* (input: string, offset: number) {
		const [values, result] = collect(parser(input, offset));
		if (!result.success) {
			if (result.fatal) {
				return result;
			}
			return ok(offset);
		}

		yield* values;

		return result;
	};
}

function streamingComplete<T>(parser: StreamingParser<T>): StreamingParser<T> {
	return function* (input: string, offset: number) {
		const res = yield* parser(input, offset);
		if (!res.success) {
			return res;
		}
		return end(input, res.offset);
	};
}

// [27] Misc ::= Comment | PI | S
const Misc = or<CommentEvent | PIEvent | void>([Comment, PI, consume(S)]);

const MiscStar = streamingStar(skipUndefined(stream(Misc)));

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
const prolog = streamingThen(
	streamingThen(streamingOptional(stream(XMLDecl)), MiscStar),
	streamingOptional(streamingThen(stream(doctypedecl), MiscStar))
);

// [43] content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
// Here's where we deviate a little from the spec grammar in order to avoid the recursion around
// elements. Instead, consider start and end tags as separate events and handle / check nesting in
// the caller.
const contentTag = or<
	| STagEvent
	| ETagEvent
	| EmptyElemTagEvent
	| ReferenceEvent
	| CDSectEvent
	| PIEvent
	| CommentEvent
>([STag, ETag, EmptyElemTag, Reference, CDSect, PI, Comment]);

const content = streamingThen(
	streamingOptional(stream(CharData)),
	streamingStar(streamingThen(stream(contentTag), streamingOptional(stream(CharData))))
);

// [39] element ::= EmptyElemTag
//      | STag content ETag
const elementStart: Parser<STagEvent | EmptyElemTagEvent> = or<STagEvent | EmptyElemTagEvent>([
	STag,
	EmptyElemTag,
]);
const element = streamingThen(stream(elementStart), content);

// [1] document ::= prolog element Misc*
// As element leads to content, which is a superset of Misc*, we can omit the last Misc*
export const document = streamingComplete(streamingThen(prolog, element));
