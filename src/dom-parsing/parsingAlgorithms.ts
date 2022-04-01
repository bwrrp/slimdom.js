import Document from '../Document';
import Node from '../Node';
import { unsafeCreateAttribute, unsafeCreateElement } from '../unsafe';
import { appendAttribute } from '../util/attrMutations';
import { insertNode } from '../util/mutationAlgorithms';
import { XMLNS_NAMESPACE, XML_NAMESPACE } from '../util/namespaceHelpers';
import { isElement } from '../util/NodeType';
import {
	CompleteChars,
	CompleteName,
	CompletePubidChars,
	CompleteWhitespace,
	EntityReplacementTextInLiteral,
	parseContent,
	parseDocument,
} from './grammar';
import {
	AttDefEvent,
	AttValueEvent,
	DefaultDeclType,
	DoctypedeclEvent,
	DocumentParseEvent,
	EmptyElemTagEvent,
	EntityValueEvent,
	MarkupdeclEventType,
	ParserEventType,
	STagEvent,
} from './parserEvents';

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

// TODO: add line / column info (and some context) to all parser errors
// TODO: add same info to all other errors

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
				throw new Error(
					`reference to parameter entity ${event.name} must not occur in an entity declaration in the internal subset`
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
								if (
									typeof event !== 'string' &&
									event.type === ParserEventType.EntityRef
								) {
									if (
										!this._entityReplacementTextByName.has(event.name) &&
										!this._externalEntityNames.has(event.name) &&
										!this._unparsedEntityNames.has(event.name)
									) {
										throw new Error(
											`default value of attribute ${attr.name} contains reference to undefined entity ${event.name}`
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
						if (defByName.has(attr.name)) {
							continue;
						}
						defByName.set(attr.name, attr);
					}
					break;
				}

				case MarkupdeclEventType.EntityDecl: {
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

	public getAttlist(elementName: string): Map<string, AttDefEvent> | undefined {
		return this._attlistByName.get(elementName);
	}

	public getEntityReplacementText(name: string, allowExternal: boolean): string | undefined {
		const value = this._entityReplacementTextByName.get(name);
		if (value === undefined) {
			if (this._unparsedEntityNames.has(name)) {
				throw new Error(`reference to binary entity ${name} is not allowed`);
			}
			if (this._externalEntityNames.has(name)) {
				if (allowExternal) {
					return '';
				}
				throw new Error(
					`reference to external entity ${name} is not allowed in attribute value`
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

function throwParseError(what: string, input: string, expected: string[], offset: number): never {
	const quoted = expected.map((str) => `"${str}"`);
	const cp = input.codePointAt(offset);
	let actual = cp ? `"${String.fromCodePoint(cp)}"` : 'end of input';
	if (!matchesCharProduction(actual)) {
		actual = 'invalid character';
	}
	throw new Error(
		`Error parsing ${what} at offset ${offset}: expected ${
			quoted.length > 1 ? 'one of ' + quoted.join(', ') : quoted[0]
		} but found ${actual}`
	);
}

function normalizeAndIncludeEntities(
	normalized: string[],
	value: AttValueEvent[],
	dtd: Dtd | null,
	ancestorEntities: string[] | null
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
			throw new Error(`reference to entity ${event.name} must not be recursive`);
		}
		let replacementText = predefinedEntitiesReplacementText.get(event.name);
		if (replacementText === undefined && dtd !== null) {
			replacementText = dtd.getEntityReplacementText(event.name, false);
		}
		if (replacementText === undefined) {
			throw new Error(`reference to unknown entity ${event.name} in attribute value`);
		}
		const result = EntityReplacementTextInLiteral(replacementText, 0);
		if (!result.success) {
			throwParseError(
				`replacement text for entity ${event.name}`,
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
			ancestorEntities ? [event.name, ...ancestorEntities] : [event.name]
		);
	}
}

function normalizeAttributeValue(
	value: AttValueEvent[],
	attDef: AttDefEvent | undefined,
	dtd: Dtd | null
): string {
	const normalized: string[] = [];
	normalizeAndIncludeEntities(normalized, value, dtd, null);
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

function splitQualifiedName(qualifiedName: string, cache: QualifiedNameCache): QualifiedNameParts {
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
		throw new Error(`the name ${qualifiedName} is not a valid qualified name`);
	}

	const parts = { prefix, localName };
	cache.set(qualifiedName, parts);
	return parts;
}

class Namespaces {
	private _parent: Namespaces | null;
	private _byPrefix: Map<string | null, string | null> = new Map();

	private constructor(parent: Namespaces | null) {
		this._parent = parent;
	}

	public getForElement(prefix: string | null): string | null {
		if (prefix === 'xmlns') {
			throw new Error('element names must not have the prefix "xmlns"');
		}
		for (let ns: Namespaces | null = this; ns !== null; ns = ns._parent) {
			const namespace = ns._byPrefix.get(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		throw new Error(`use of undeclared element prefix ${prefix}`);
	}

	public getForAttribute(prefix: string | null, localName: string): string | null {
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
		throw new Error(`use of undeclared attribute prefix ${prefix}`);
	}

	public static fromAttrs(
		parent: Namespaces,
		event: STagEvent | EmptyElemTagEvent,
		attlist: Map<string, AttDefEvent> | undefined,
		dtd: Dtd | null,
		qualifiedNameCache: QualifiedNameCache
	): Namespaces {
		let ns = parent;
		let hasDeclarations = false;

		const add = (prefix: string | null, namespace: string | null) => {
			if (prefix === null && (namespace === XML_NAMESPACE || namespace === XMLNS_NAMESPACE)) {
				throw new Error(
					`the namespace ${namespace} must not be used as the default namespace`
				);
			}
			if (namespace === XMLNS_NAMESPACE) {
				throw new Error(`the namespace ${XMLNS_NAMESPACE} must not be bound to a prefix`);
			}
			if (namespace === XML_NAMESPACE && prefix !== 'xml') {
				throw new Error(
					`the namespace ${XML_NAMESPACE} must be bound only to the prefix "xml"`
				);
			}
			if (namespace !== XML_NAMESPACE && prefix === 'xml') {
				throw new Error(
					`the xml namespace prefix must not be bound to any namespace other than ${XML_NAMESPACE}`
				);
			}
			if (prefix !== null && namespace === null) {
				throw new Error(`the prefix ${prefix} must not be undeclared`);
			}
			if (!hasDeclarations) {
				ns = new Namespaces(parent);
				hasDeclarations = true;
			}
			ns._byPrefix.set(prefix, namespace);
		};

		const checkAttr = (qualifiedName: string, value: AttValueEvent[]) => {
			const { prefix, localName } = splitQualifiedName(qualifiedName, qualifiedNameCache);
			const def = attlist?.get(qualifiedName);
			if (
				prefix === null &&
				localName === 'xmlns' &&
				(!hasDeclarations || !ns._byPrefix.has(null))
			) {
				const namespace = normalizeAttributeValue(value, def, dtd) || null;
				add(null, namespace);
			} else if (prefix === 'xmlns' && (!hasDeclarations || !ns._byPrefix.has(localName))) {
				if (localName === 'xmlns') {
					throw new Error('the xmlns namespace prefix must not be declared');
				}
				const namespace = normalizeAttributeValue(value, def, dtd) || null;
				add(localName, namespace);
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

	public static default(): Namespaces {
		const ns = new Namespaces(null);
		ns._byPrefix.set(null, null);
		ns._byPrefix.set('xml', XML_NAMESPACE);
		ns._byPrefix.set('xmlns', XMLNS_NAMESPACE);
		return ns;
	}
}

const ROOT_NAMESPACES = Namespaces.default();

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
	entityRoot: boolean;
};

type EntityContext = {
	parent: EntityContext | null;
	entity: string | null;
	generator: Iterator<DocumentParseEvent>;
};

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
 * @param input - the string to parse
 */
export function parseXmlDocument(input: string): Document {
	const doc = new Document();
	let domContext: DomContext = {
		parent: null,
		root: doc,
		namespaces: ROOT_NAMESPACES,
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
		}
		collectedText.length = 0;
	}

	// Remove BOM if there is one and normalize line endings to lf
	input = input.replace(/^\ufeff/, '');
	input = normalizeLineEndings(input);

	let entityContext: EntityContext | null = {
		parent: null,
		entity: null,
		generator: parseDocument(input),
	};
	while (entityContext) {
		let it: IteratorResult<DocumentParseEvent> = entityContext.generator.next();
		for (; !it.done; it = entityContext.generator.next()) {
			const event: DocumentParseEvent = it.value;
			if (typeof event === 'string') {
				collectedText.push(event);
				continue;
			}

			switch (event.type) {
				case ParserEventType.CharRef:
					if (domContext.root === doc && doc.documentElement !== null) {
						throw new Error(
							'character reference must not appear after the document element'
						);
					}
					collectedText.push(String.fromCodePoint(event.cp));
					continue;

				case ParserEventType.EntityRef: {
					if (domContext.root === doc && doc.documentElement !== null) {
						throw new Error(
							`reference to entity ${event.name} must not appear after the document element`
						);
					}
					for (let ctx: EntityContext | null = entityContext; ctx; ctx = ctx.parent) {
						if (ctx.entity === event.name) {
							throw new Error(
								`reference to entity ${event.name} must not be recursive`
							);
						}
					}
					let replacementText = predefinedEntitiesReplacementText.get(event.name);
					if (replacementText === undefined && dtd !== null) {
						replacementText = dtd.getEntityReplacementText(event.name, true);
					}
					if (replacementText === undefined) {
						throw new Error(`reference to unknown entity ${event.name} in content`);
					}
					domContext = {
						parent: domContext,
						root: domContext.root,
						namespaces: domContext.namespaces,
						entityRoot: true,
					};
					entityContext = {
						parent: entityContext,
						entity: event.name,
						generator: parseContent(replacementText),
					};
					continue;
				}
			}

			flushCollectedText();

			switch (event.type) {
				case ParserEventType.CDSect:
					if (domContext.root === doc && doc.documentElement !== null) {
						throw new Error('CData section must not appear after the document element');
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
						throw new Error(
							`document must contain a single root element, but found ${doc.documentElement.nodeName} and ${event.name}`
						);
					}
					const attlist = dtd ? dtd.getAttlist(event.name) : undefined;
					const namespaces = Namespaces.fromAttrs(
						domContext.namespaces,
						event,
						attlist,
						dtd,
						qualifiedNameCache
					);
					const { prefix, localName } = splitQualifiedName(
						event.name,
						qualifiedNameCache
					);
					const namespace = namespaces.getForElement(prefix);
					// We can skip the usual name validity checks
					const element = unsafeCreateElement(doc, localName, namespace, prefix);
					for (const attr of event.attributes) {
						const { prefix, localName } = splitQualifiedName(
							attr.name,
							qualifiedNameCache
						);
						const namespace = namespaces.getForAttribute(prefix, localName);
						const def = attlist?.get(attr.name);
						if (element.hasAttributeNS(namespace, localName)) {
							throw new Error(
								`attribute ${attr.name} must not appear multiple times on element ${event.name}`
							);
						}
						// We can skip validation of names and duplicates
						const attrNode = unsafeCreateAttribute(
							namespace,
							prefix,
							localName,
							normalizeAttributeValue(attr.value, def, dtd),
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
							const namespace = namespaces.getForAttribute(prefix, localName);
							if (element.hasAttributeNS(namespace, localName)) {
								continue;
							}
							// We can skip validation of names and duplicates
							const attrNode = unsafeCreateAttribute(
								namespace,
								prefix,
								localName,
								normalizeAttributeValue(def.value, attr, dtd),
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
						};
					}
					continue;
				}

				case ParserEventType.ETag:
					if (!isElement(domContext.root) || domContext.root.nodeName !== event.name) {
						throw new Error(
							`non-well-formed element: found end tag ${event.name} but expected ${
								isElement(domContext.root)
									? domContext.root.nodeName
									: 'no such tag'
							}`
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
					: 'document',
				input,
				it.value.expected,
				it.value.offset
			);
		}

		if (!domContext.entityRoot) {
			throw new Error(
				`${
					entityContext.entity
						? `replacement text for entity ${entityContext.entity}`
						: 'document'
				} is not well-formed - element ${domContext.root.nodeName} is missing a closing tag`
			);
		}

		entityContext = entityContext.parent;
		if (entityContext) {
			domContext = domContext.parent!;
		}
	}

	flushCollectedText();

	return doc;
}
