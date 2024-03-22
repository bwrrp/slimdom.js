import Document from '../Document';
import DocumentFragment from '../DocumentFragment';
import Node from '../Node';
import { unsafeCreateAttribute, unsafeCreateElement } from '../unsafe';
import { appendAttribute } from '../util/attrMutations';
import { insertNode } from '../util/mutationAlgorithms';
import { XMLNS_NAMESPACE, XML_NAMESPACE } from '../util/namespaceHelpers';
import { isElement } from '../util/NodeType';
import { getNodeDocument } from '../util/treeHelpers';
import EntityExpansionGuard from './EntityExpansionGuard';
import {
	CompleteChars,
	CompleteName,
	CompletePubidChars,
	CompleteWhitespace,
	EntityReplacementTextInLiteral,
	parseContent,
	parseDocument,
	parseFragment,
} from './grammar';
import {
	AttDefEvent,
	AttValueEvent,
	DefaultDeclType,
	DoctypedeclEvent,
	DocumentParseEvent,
	EmptyElemTagEvent,
	EntityRefEvent,
	EntityValueEvent,
	MarkupdeclEventType,
	ParserEventType,
	STagEvent,
	WithPosition,
} from './parserEvents';

function offsetToCoords(input: string, offset: number): { line: number; char: number } {
	// Assumes normalized line endings
	let line = 1;
	let char = 1;
	let i = 0;
	while (i < offset) {
		const cp = input.codePointAt(i)!;
		const l = cp > 0xffff ? 2 : 1;
		char++;
		i += l;
		if (cp === 0xa) {
			line++;
			char = 1;
		}
	}
	return { line, char };
}

function replaceInvalidCharacters(input: string): string {
	return Array.from(input, (char) =>
		matchesCharProduction(char) ? char : '[invalid character]'
	).join('');
}

const enum TruncateSide {
	Start,
	End,
	Inside,
}

function truncate(input: string, side: TruncateSide, max: number): string {
	const ELLIPSIS = '\u{2026}';
	const chars = Array.from(input);
	if (chars.length < max) {
		return input;
	}
	switch (side) {
		case TruncateSide.Start:
			return ELLIPSIS + chars.slice(-max).join('');
		case TruncateSide.End:
			return chars.slice(0, max).join('') + ELLIPSIS;
	}
	const halfLength = Math.min(chars.length / 2, max / 2) | 0;
	return chars.slice(0, halfLength).join('') + ELLIPSIS + chars.slice(-halfLength).join('');
}

function highlightError(input: string, start: number, end: number): string {
	const inside = truncate(
		replaceInvalidCharacters(input.substring(start, end)),
		TruncateSide.Inside,
		30
	);
	const newlineIndexBefore = input.lastIndexOf('\n', start);
	const lineBefore = truncate(
		replaceInvalidCharacters(input.substring(newlineIndexBefore + 1, start)),
		TruncateSide.Start,
		55 - inside.length
	);
	const newlineIndexAfter = input.indexOf('\n', end);
	const lineAfter = truncate(
		replaceInvalidCharacters(
			newlineIndexAfter > 0 ? input.substring(end, newlineIndexAfter) : input.substring(end)
		),
		TruncateSide.End,
		80 - inside.length - lineBefore.length
	);
	const indent = Array.from(lineBefore, (c) => (isWhitespace(c) ? c : ' ')).join('');
	const squiggle = '^'.repeat(Math.max(Array.from(inside).length, 1));
	return `${lineBefore}${inside}${lineAfter}\n${indent}${squiggle}`;
}

export function throwErrorWithContext(message: string, event: WithPosition<unknown>): never {
	const { line, char } = offsetToCoords(event.input, event.start);
	const location = `At line ${line}, character ${char}:`;
	throw new Error(
		`${message}\n${location}\n\n${highlightError(event.input, event.start, event.end)}`
	);
}

function throwParseError(what: string, input: string, expected: string[], offset: number): never {
	const quoted = Array.from(new Set(expected), (str) =>
		str.includes('"') ? `'${str}'` : `"${str}"`
	);
	const cp = input.codePointAt(offset);
	const actual = cp ? String.fromCodePoint(cp) : '';
	throwErrorWithContext(
		`Parsing ${what} failed, expected ${
			quoted.length > 1 ? 'one of ' + quoted.join(', ') : quoted[0]
		}`,
		{ input, start: offset, end: offset + Math.max(actual.length, 1) }
	);
}

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

/**
 * Returns true if all characters in value match the S production.
 *
 * @param value - The string to check
 *
 * @returns true if all characters in value match S, otherwise false
 */
function isWhitespace(value: string): boolean {
	return CompleteWhitespace(value, 0).success;
}

function constructReplacementText(value: EntityValueEvent[]): string {
	const replacementText: string[] = [];
	for (const event of value) {
		if (typeof event === 'string') {
			replacementText.push(event);
			continue;
		}

		switch (event.type) {
			case ParserEventType.CharRef:
				// Include
				replacementText.push(String.fromCodePoint(event.cp));
				break;
			case ParserEventType.EntityRef:
				// Bypass
				replacementText.push(`&${event.name};`);
				break;
			case ParserEventType.PEReference:
				throwErrorWithContext(
					`reference to parameter entity "${event.name}" must not occur in an entity declaration in the internal subset`,
					event
				);
		}
	}

	return replacementText.join('');
}

class Dtd {
	private _attlistByName = new Map<string, Map<string, AttDefEvent>>();

	private _entityReplacementTextByName = new Map<string, string>();

	private _externalEntityNames = new Set<string>();

	private _unparsedEntityNames = new Set<string>();

	constructor(dtd: DoctypedeclEvent) {
		if (!dtd.intSubset) {
			return;
		}

		for (const decl of dtd.intSubset) {
			switch (decl.type) {
				case MarkupdeclEventType.AttlistDecl: {
					// Check if no entity is referenced before it is defined
					for (const attr of decl.attdefs) {
						if (attr.def.type === DefaultDeclType.VALUE) {
							for (const event of attr.def.value) {
								if (typeof event === 'string') {
									continue;
								}
								if (event.type === ParserEventType.EntityRef) {
									if (
										!this._entityReplacementTextByName.has(event.name) &&
										!this._externalEntityNames.has(event.name) &&
										!this._unparsedEntityNames.has(event.name)
									) {
										throwErrorWithContext(
											`default value of attribute "${attr.name.name}" contains reference to undefined entity "${event.name}"`,
											event
										);
									}
									if (this._externalEntityNames.has(event.name)) {
										throwErrorWithContext(
											`default value of attribute "${attr.name.name}" must not contain reference to external entity "${event.name}"`,
											event
										);
									}
								}
							}
						}
					}
					// Multiple attlist for the same element are merged
					let defByName = this._attlistByName.get(decl.name);
					if (defByName === undefined) {
						defByName = new Map<string, AttDefEvent>();
						this._attlistByName.set(decl.name, defByName);
					}
					for (const attr of decl.attdefs) {
						// First declaration is binding
						if (defByName.has(attr.name.name)) {
							continue;
						}
						defByName.set(attr.name.name, attr);
					}
					break;
				}

				case MarkupdeclEventType.PEDecl: {
					// We don't support these, but still need to validate well-formedness
					if (Array.isArray(decl.value)) {
						for (const event of decl.value) {
							if (
								typeof event !== 'string' &&
								event.type === ParserEventType.PEReference
							) {
								throwErrorWithContext(
									`reference to parameter entity "${event.name}" must not occur in an entity declaration in the internal subset`,
									event
								);
							}
						}
					}
					break;
				}

				case MarkupdeclEventType.GEDecl: {
					// First declaration is binding
					if (
						this._entityReplacementTextByName.has(decl.name) ||
						this._externalEntityNames.has(decl.name)
					) {
						continue;
					}
					if (Array.isArray(decl.value)) {
						this._entityReplacementTextByName.set(
							decl.name,
							constructReplacementText(decl.value)
						);
					} else if (decl.value.ndata === null) {
						// External parsed entity may be skipped
						this._externalEntityNames.add(decl.name);
					} else {
						// External unparsed entity
						this._unparsedEntityNames.add(decl.name);
					}
				}
			}
		}
	}

	public getAttlist(nameEvent: { name: string }): Map<string, AttDefEvent> | undefined {
		return this._attlistByName.get(nameEvent.name);
	}

	public getEntityReplacementText(
		event: EntityRefEvent,
		allowExternal: boolean
	): string | undefined {
		const value = this._entityReplacementTextByName.get(event.name);
		if (value === undefined) {
			if (this._unparsedEntityNames.has(event.name)) {
				throwErrorWithContext(
					`reference to binary entity "${event.name}" is not allowed`,
					event
				);
			}
			if (this._externalEntityNames.has(event.name)) {
				if (allowExternal) {
					return '';
				}
				throwErrorWithContext(
					`reference to external entity "${event.name}" is not allowed in attribute value`,
					event
				);
			}
		}
		return value;
	}
}

const predefinedEntitiesReplacementText = new Map([
	['lt', '&#60;'],
	['gt', '>'],
	['amp', '&#38;'],
	['apos', "'"],
	['quot', '"'],
]);

function normalizeAndIncludeEntities(
	normalized: string[],
	value: AttValueEvent[],
	dtd: Dtd | null,
	ancestorEntities: string[] | null,
	expansionGuard: EntityExpansionGuard
) {
	for (const event of value) {
		if (typeof event === 'string') {
			normalized.push(event.replace(/[\r\n\t]/g, ' '));
			continue;
		}

		if (event.type === ParserEventType.CharRef) {
			normalized.push(String.fromCodePoint(event.cp));
			continue;
		}

		if (ancestorEntities !== null && ancestorEntities.includes(event.name)) {
			throwErrorWithContext(
				`reference to entity "${event.name}" must not be recursive`,
				event
			);
		}
		let replacementText = predefinedEntitiesReplacementText.get(event.name);
		if (replacementText === undefined && dtd !== null) {
			replacementText = dtd.getEntityReplacementText(event, false);
		}
		if (replacementText === undefined) {
			throwErrorWithContext(
				`reference to unknown entity "${event.name}" in attribute value`,
				event
			);
		}
		expansionGuard.enter(event, replacementText.length);
		const result = EntityReplacementTextInLiteral(replacementText, 0);
		if (!result.success) {
			throwParseError(
				`replacement text for entity "${event.name}"`,
				replacementText,
				result.expected,
				result.offset
			);
		}
		// Recursively normalize replacement text
		normalizeAndIncludeEntities(
			normalized,
			result.value,
			dtd,
			ancestorEntities ? [event.name, ...ancestorEntities] : [event.name],
			expansionGuard
		);
		expansionGuard.exit();
	}
}

function normalizeAttributeValue(
	value: AttValueEvent[],
	attDef: AttDefEvent | undefined,
	dtd: Dtd | null,
	expansionGuard: EntityExpansionGuard
): string {
	const normalized: string[] = [];
	normalizeAndIncludeEntities(normalized, value, dtd, null, expansionGuard);
	if (attDef && !attDef.isCData) {
		return normalized
			.join('')
			.replace(/[ ]+/g, ' ')
			.replace(/^[ ]+|[ ]+$/g, '');
	}
	return normalized.join('');
}

type QualifiedNameParts = { prefix: string | null; localName: string };
type QualifiedNameCache = Map<string, QualifiedNameParts>;

function splitQualifiedName(
	event: WithPosition<{ name: string }>,
	cache: QualifiedNameCache
): QualifiedNameParts {
	const qualifiedName = event.name;
	const fromCache = cache.get(qualifiedName);
	if (fromCache !== undefined) {
		return fromCache;
	}

	// 3. Let prefix be null.
	let prefix: string | null = null;

	// 4.  Let localName be qualifiedName.
	let localName = qualifiedName;

	// 5. If qualifiedName contains a ":" (U+003A), then split the string on it and set prefix to
	// the part before and localName to the part after.
	const index = qualifiedName.indexOf(':');
	if (index >= 0) {
		prefix = qualifiedName.substring(0, index);
		localName = qualifiedName.substring(index + 1);
	}

	// We already know (from the grammar) that qualifiedName is a valid Name, so only check if there
	// aren't too many colons and that both parts are not empty
	if (prefix === '' || localName === '' || localName.includes(':')) {
		throwErrorWithContext(`the name "${qualifiedName}" is not a valid qualified name`, event);
	}

	const parts = { prefix, localName };
	cache.set(qualifiedName, parts);
	return parts;
}

class Namespaces {
	private readonly _parent: Namespaces | null;
	private readonly _byPrefix: Map<string | null, string | null> = new Map();
	private readonly _resolve: ((prefix: string) => string | undefined) | null = null;

	private constructor(
		parent: Namespaces | null,
		resolve: ((prefix: string) => string | undefined) | null = null
	) {
		this._parent = parent;
		this._resolve = resolve ?? parent?._resolve ?? null;
	}

	public getForElement(prefix: string | null, event: WithPosition<unknown>): string | null {
		if (prefix === 'xmlns') {
			throwErrorWithContext('element names must not have the prefix "xmlns"', event);
		}
		for (let ns: Namespaces | null = this; ns !== null; ns = ns._parent) {
			const namespace = ns._byPrefix.get(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		if (prefix !== null && this._resolve) {
			const namespace = this._resolve(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		throwErrorWithContext(`use of undeclared element prefix "${prefix}"`, event);
	}

	public getForAttribute(
		prefix: string | null,
		localName: string,
		event: WithPosition<unknown>
	): string | null {
		if (prefix === null) {
			// Default namespace doesn't apply to attributes
			return localName === 'xmlns' ? XMLNS_NAMESPACE : null;
		}
		for (let ns: Namespaces | null = this; ns !== null; ns = ns._parent) {
			const namespace = ns._byPrefix.get(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		if (this._resolve) {
			const namespace = this._resolve(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		throwErrorWithContext(`use of undeclared attribute prefix ${prefix}`, event);
	}

	public static fromAttrs(
		parent: Namespaces,
		event: STagEvent | EmptyElemTagEvent,
		attlist: Map<string, AttDefEvent> | undefined,
		dtd: Dtd | null,
		qualifiedNameCache: QualifiedNameCache,
		expansionGuard: EntityExpansionGuard
	): Namespaces {
		let ns = parent;
		let hasDeclarations = false;

		const add = (
			prefix: string | null,
			namespace: string | null,
			event: WithPosition<unknown>
		) => {
			if (prefix === null && (namespace === XML_NAMESPACE || namespace === XMLNS_NAMESPACE)) {
				throwErrorWithContext(
					`the namespace "${namespace}" must not be used as the default namespace`,
					event
				);
			}
			if (namespace === XMLNS_NAMESPACE) {
				throwErrorWithContext(
					`the namespace "${XMLNS_NAMESPACE}" must not be bound to a prefix`,
					event
				);
			}
			if (namespace === XML_NAMESPACE && prefix !== 'xml') {
				throwErrorWithContext(
					`the namespace "${XML_NAMESPACE}" must be bound only to the prefix "xml"`,
					event
				);
			}
			if (namespace !== XML_NAMESPACE && prefix === 'xml') {
				throwErrorWithContext(
					`the xml namespace prefix must not be bound to any namespace other than "${XML_NAMESPACE}"`,
					event
				);
			}
			if (prefix !== null && namespace === null) {
				throwErrorWithContext(`the prefix "${prefix}" must not be undeclared`, event);
			}
			if (!hasDeclarations) {
				ns = new Namespaces(parent);
				hasDeclarations = true;
			}
			ns._byPrefix.set(prefix, namespace);
		};

		const checkAttr = (nameEvent: WithPosition<{ name: string }>, value: AttValueEvent[]) => {
			const { prefix, localName } = splitQualifiedName(nameEvent, qualifiedNameCache);
			const def = attlist?.get(nameEvent.name);
			if (
				prefix === null &&
				localName === 'xmlns' &&
				(!hasDeclarations || !ns._byPrefix.has(null))
			) {
				const namespace = normalizeAttributeValue(value, def, dtd, expansionGuard) || null;
				add(null, namespace, nameEvent);
			} else if (prefix === 'xmlns' && (!hasDeclarations || !ns._byPrefix.has(localName))) {
				if (localName === 'xmlns') {
					throwErrorWithContext(
						'the "xmlns" namespace prefix must not be declared',
						nameEvent
					);
				}
				const namespace = normalizeAttributeValue(value, def, dtd, expansionGuard) || null;
				add(localName, namespace, nameEvent);
			}
		};

		for (const attr of event.attributes) {
			checkAttr(attr.name, attr.value);
		}
		if (attlist) {
			for (const attr of attlist.values()) {
				const def = attr.def;
				if (def.type !== DefaultDeclType.VALUE) {
					continue;
				}
				checkAttr(attr.name, def.value);
			}
		}

		return ns;
	}

	public static default(resolve: ((prefix: string) => string | undefined) | null): Namespaces {
		const ns = new Namespaces(null, resolve);
		ns._byPrefix.set(null, null);
		ns._byPrefix.set('xml', XML_NAMESPACE);
		ns._byPrefix.set('xmlns', XMLNS_NAMESPACE);
		return ns;
	}
}

const ROOT_NAMESPACES = Namespaces.default(null);

function normalizeLineEndings(input: string): string {
	return input.replace(/\r\n?/g, '\n');
}

function appendParsedNode(parent: Node, child: Node): void {
	// We can bypass all of the pre-insertion checks as the parser guarantees that we won't try any
	// invalid combinations of node types here, that there is at most a single doctype and that that
	// doctype is parsed before any elements. Other constraints, such as not having text at the root
	// and not having more than one root element, are covered in the parse loop. We can also bypass
	// adoption, as all nodes are created from our document. Finally, no observers can possibly be
	// interested in our new document, so we don't need to look for those.
	insertNode(child, parent, null, true);
}

type DomContext = {
	parent: DomContext | null;
	root: Node;
	namespaces: Namespaces;
} & ({ entityRoot: true } | { entityRoot: false; event: STagEvent });

type EntityContext = {
	parent: EntityContext | null;
	entity: string | null;
	iterator: Iterator<DocumentParseEvent>;
};

/**
 * Options that control parsing.
 *
 * @public
 */
export type ParseOptions = Partial<{
	/**
	 * To guard against entity expansion attacks, this controls the maximum amplification factor
	 * allowed when expanding entities. This is calculated as the ratio between the length of the
	 * initial input and that of the processed input, which is the initial input plus the length of
	 * the replacement text corresponding to each processed named entity reference.
	 *
	 * As high amplification factors may occur for normal documents, this is only enforced after the
	 * length of the processed input exceeds the `entityExpansionThreshold`.
	 *
	 * Defaults to 100.
	 *
	 * Please file an issue if you ever need to adjust this value for a non-attack input.
	 *
	 * @public
	 */
	entityExpansionMaxAmplification: number;

	/**
	 * To guard against entity expansion attacks, this controls the threshold after which the
	 * `entityExpansionMaxAmplification` limit is enforced. The threshold is applied against the
	 * length of the processed input, which is the initial input plus the length of the replacement
	 * text corresponding to each processed named entity reference.
	 *
	 * Defaults to 2^22 characters, which equates (assuming UCS-2 encoding) to 8MiB of input data.
	 *
	 * Please file an issue if you ever need to adjust this value for a non-attack input.
	 *
	 * @public
	 */
	entityExpansionThreshold: number;

	/**
	 * If set to true, any CDATA sections in the parsed document are converted to normal text.
	 * Defaults to false, which means CDATA sections are represented in the DOM by CDataSection
	 * nodes.
	 *
	 * @public
	 */
	treatCDataAsText: boolean;
}>;

const DEFAULT_ENTITY_EXPANSION_MAX_AMPLIFICATION = 100.0;

// 8MiB / 2 bytes per char (UCS-2) = 4MiB (2^22)
const DEFAULT_ENTITY_EXPANSION_THRESHOLD = 4_194_304;

export function parseXml(
	input: string,
	generator: (input: string) => Iterator<DocumentParseEvent>,
	namespaces: Namespaces,
	into: Node,
	{
		entityExpansionMaxAmplification = DEFAULT_ENTITY_EXPANSION_MAX_AMPLIFICATION,
		entityExpansionThreshold = DEFAULT_ENTITY_EXPANSION_THRESHOLD,
		treatCDataAsText = false,
	}: ParseOptions
): void {
	const doc = getNodeDocument(into);
	let domContext: DomContext = {
		parent: null,
		root: into,
		namespaces,
		entityRoot: true,
	};
	let dtd: Dtd | null = null;
	const qualifiedNameCache: QualifiedNameCache = new Map();
	let collectedText: string[] = [];

	function flushCollectedText() {
		if (collectedText.length > 0) {
			const text = collectedText.join('');
			if (domContext.root === doc) {
				// Ignore whitespace at document root
				if (!isWhitespace(text)) {
					throw new Error('document must not contain text outside of elements');
				}
			} else {
				appendParsedNode(domContext.root, doc.createTextNode(collectedText.join('')));
			}
			collectedText.length = 0;
		}
	}

	// Remove BOM if there is one and normalize line endings to lf
	input = input.replace(/^\ufeff/, '');
	input = normalizeLineEndings(input);

	const expansionGuard = new EntityExpansionGuard(
		input.length,
		entityExpansionThreshold,
		entityExpansionMaxAmplification
	);
	let entityContext: EntityContext | null = {
		parent: null,
		entity: null,
		iterator: generator(input),
	};
	while (entityContext) {
		let it: IteratorResult<DocumentParseEvent> = entityContext.iterator.next();
		for (; !it.done; it = entityContext.iterator.next()) {
			const event: DocumentParseEvent = it.value;
			if (typeof event === 'string') {
				collectedText.push(event);
				continue;
			}

			switch (event.type) {
				case ParserEventType.CharRef:
					if (domContext.root === doc && doc.documentElement !== null) {
						throwErrorWithContext(
							'character reference must not appear after the document element',
							event
						);
					}
					collectedText.push(String.fromCodePoint(event.cp));
					continue;

				case ParserEventType.EntityRef: {
					if (domContext.root === doc && doc.documentElement !== null) {
						throwErrorWithContext(
							`reference to entity "${event.name}" must not appear after the document element`,
							event
						);
					}
					for (let ctx: EntityContext | null = entityContext; ctx; ctx = ctx.parent) {
						if (ctx.entity === event.name) {
							throwErrorWithContext(
								`reference to entity "${event.name}" must not be recursive`,
								event
							);
						}
					}
					let replacementText = predefinedEntitiesReplacementText.get(event.name);
					if (replacementText === undefined && dtd !== null) {
						replacementText = dtd.getEntityReplacementText(event, true);
					}
					if (replacementText === undefined) {
						throwErrorWithContext(
							`reference to unknown entity "${event.name}" in content`,
							event
						);
					}
					expansionGuard.enter(event, replacementText.length);
					domContext = {
						parent: domContext,
						root: domContext.root,
						namespaces: domContext.namespaces,
						entityRoot: true,
					};
					entityContext = {
						parent: entityContext,
						entity: event.name,
						iterator: parseContent(replacementText),
					};
					continue;
				}

				case ParserEventType.CDSect:
					if (treatCDataAsText) {
						collectedText.push(event.data);
						continue;
					}
					break;
			}

			flushCollectedText();

			switch (event.type) {
				case ParserEventType.CDSect:
					if (domContext.root === doc && doc.documentElement !== null) {
						throwErrorWithContext(
							'CData section must not appear after the document element',
							event
						);
					}
					appendParsedNode(domContext.root, doc.createCDATASection(event.data));
					continue;

				case ParserEventType.Comment:
					appendParsedNode(domContext.root, doc.createComment(event.data));
					continue;

				case ParserEventType.Doctypedecl:
					// Grammar guarantees this happens before the document element
					dtd = new Dtd(event);
					appendParsedNode(
						domContext.root,
						doc.implementation.createDocumentType(
							event.name,
							event.ids?.publicId || '',
							event.ids?.systemId || ''
						)
					);
					continue;

				case ParserEventType.PI:
					appendParsedNode(
						domContext.root,
						doc.createProcessingInstruction(event.target, event.data || '')
					);
					continue;

				case ParserEventType.STag:
				case ParserEventType.EmptyElemTag: {
					if (domContext.root === doc && doc.documentElement !== null) {
						throwErrorWithContext(
							`document must contain a single root element, but found "${doc.documentElement.nodeName}" and "${event.name.name}"`,
							event.name
						);
					}
					const attlist = dtd ? dtd.getAttlist(event.name) : undefined;
					const namespaces = Namespaces.fromAttrs(
						domContext.namespaces,
						event,
						attlist,
						dtd,
						qualifiedNameCache,
						expansionGuard
					);
					const { prefix, localName } = splitQualifiedName(
						event.name,
						qualifiedNameCache
					);
					const namespace = namespaces.getForElement(prefix, event.name);
					// We can skip the usual name validity checks
					const element = unsafeCreateElement(doc, localName, namespace, prefix);
					for (const attr of event.attributes) {
						const { prefix, localName } = splitQualifiedName(
							attr.name,
							qualifiedNameCache
						);
						const namespace = namespaces.getForAttribute(prefix, localName, attr.name);
						const def = attlist?.get(attr.name.name);
						if (element.hasAttributeNS(namespace, localName)) {
							throwErrorWithContext(
								`attribute "${attr.name.name}" must not appear multiple times on element "${event.name.name}"`,
								attr.name
							);
						}
						// We can skip validation of names and duplicates
						const attrNode = unsafeCreateAttribute(
							namespace,
							prefix,
							localName,
							normalizeAttributeValue(attr.value, def, dtd, expansionGuard),
							element
						);
						appendAttribute(attrNode, element, true);
					}
					// Add default attributes from the DTD
					if (attlist) {
						for (const attr of attlist.values()) {
							const def = attr.def;
							if (def.type !== DefaultDeclType.VALUE) {
								continue;
							}
							const { prefix, localName } = splitQualifiedName(
								attr.name,
								qualifiedNameCache
							);
							const namespace = namespaces.getForAttribute(
								prefix,
								localName,
								attr.name
							);
							if (element.hasAttributeNS(namespace, localName)) {
								continue;
							}
							// We can skip validation of names and duplicates
							const attrNode = unsafeCreateAttribute(
								namespace,
								prefix,
								localName,
								normalizeAttributeValue(def.value, attr, dtd, expansionGuard),
								element
							);
							appendAttribute(attrNode, element, true);
						}
					}
					appendParsedNode(domContext.root, element);
					if (event.type === ParserEventType.STag) {
						domContext = {
							parent: domContext,
							root: element,
							namespaces,
							entityRoot: false,
							event,
						};
					}
					continue;
				}

				case ParserEventType.ETag:
					if (!isElement(domContext.root) || domContext.root.nodeName !== event.name) {
						throwErrorWithContext(
							`non-well-formed element: found end tag "${event.name}" but expected ${
								isElement(domContext.root)
									? `"${domContext.root.nodeName}"`
									: 'no such tag'
							}`,
							event
						);
					}
					// The check above means we never leave the document DomContext
					domContext = domContext.parent!;
					continue;
			}
		}

		if (!it.value.success) {
			throwParseError(
				entityContext.entity
					? `replacement text for entity ${entityContext.entity}`
					: into === doc
					? 'document'
					: 'fragment',
				input,
				it.value.expected,
				it.value.offset
			);
		}

		if (!domContext.entityRoot) {
			throwErrorWithContext(
				`${
					entityContext.entity
						? `replacement text for entity "${entityContext.entity}"`
						: into === doc
						? 'document'
						: 'fragment'
				} is not well-formed - element "${
					domContext.root.nodeName
				}" is missing a closing tag`,
				domContext.event.name
			);
		}

		entityContext = entityContext.parent;
		if (entityContext) {
			expansionGuard.exit();
			domContext = domContext.parent!;
		}
	}

	flushCollectedText();
}

/**
 * Parse an XML fragment
 *
 * This accepts the same format as specified for external parsed entities, except that it does not
 * support parameter entities. That means it accepts an optional text declaration (similar to the
 * XML version declaration) followed by any content that may be found between an element's start and
 * end tags. That does not include doctype nodes.
 *
 * This parser is non-validating, and therefore does not support an external DTD or external parsed
 * entities. During parsing, any referenced entities are included, default attribute values are
 * materialized and the DTD internal subset is discarded. References to external entities are
 * replaced with nothing. References to parameter entities are also ignored.
 *
 * @public
 *
 * @param input   - the string to parse
 * @param options - allows specifying context missing from the fragment text
 */
export function parseXmlFragment(
	input: string,
	options: Partial<{
		/**
		 * Called to resolve the namespace for any prefix that is not defined in the context of the
		 * content currently being parsed. Should return the namespace URI, or undefined if a
		 * namespace could not be resolved for the given prefix.
		 *
		 * @public
		 *
		 * @param prefix - the prefix that could not be resolved
		 */
		resolveNamespacePrefix(prefix: string): string | undefined;

		/**
		 * If set to true, any CDATA sections in the parsed document are converted to normal text.
		 * Defaults to false, which means CDATA sections are represented in the DOM by CDataSection
		 * nodes.
		 *
		 * @public
		 */
		treatCDataAsText: boolean;
	}> = {}
): DocumentFragment {
	const doc = new Document();
	const fragment = doc.createDocumentFragment();
	parseXml(
		input,
		parseFragment,
		options.resolveNamespacePrefix
			? Namespaces.default(options.resolveNamespacePrefix)
			: ROOT_NAMESPACES,
		fragment,
		options
	);
	return fragment;
}

/**
 * Parse an XML document
 *
 * This parser is non-validating, and therefore does not support an external DTD or external parsed
 * entities. During parsing, any referenced entities are included, default attribute values are
 * materialized and the DTD internal subset is discarded. References to external entities are
 * replaced with nothing. References to parameter entities are also ignored.
 *
 * @public
 *
 * @param input   - the string to parse
 * @param options - optionally adjust protection against entity expansion attacks
 */
export function parseXmlDocument(input: string, options: ParseOptions = {}): Document {
	const doc = new Document();
	parseXml(input, parseDocument, ROOT_NAMESPACES, doc, options);
	return doc;
}
