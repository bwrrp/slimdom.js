import Document from '../Document';
import Node from '../Node';
import { splitQualifiedName, XMLNS_NAMESPACE, XML_NAMESPACE } from '../util/namespaceHelpers';
import { isElement } from '../util/NodeType';
import {
	contentComplete,
	document,
	EntityReplacementTextInLiteral,
	isWhitespace,
	StreamingParser,
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
				replacementText.push(event.char);
				break;
			case ParserEventType.EntityRef:
				// Bypass
				replacementText.push(`&${event.name};`);
				break;
		}
	}

	return replacementText.join('');
}

class Dtd {
	private _attlistByName = new Map<string, Map<string, AttDefEvent>>();

	private _entityReplacementTextByName = new Map<string, string>();

	private _unparsedEntityNames = new Set<string>();

	constructor(dtd: DoctypedeclEvent) {
		if (!dtd.intSubset) {
			return;
		}

		for (const decl of dtd.intSubset) {
			switch (decl.type) {
				case MarkupdeclEventType.AttlistDecl: {
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
					if (this._entityReplacementTextByName.has(decl.name)) {
						continue;
					}
					if (Array.isArray(decl.value)) {
						this._entityReplacementTextByName.set(
							decl.name,
							constructReplacementText(decl.value)
						);
					} else if (decl.value.ndata === null) {
						// External parsed entity may be skipped
						this._entityReplacementTextByName.set(decl.name, '');
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

	public getEntityReplacementText(name: string): string | undefined {
		const value = this._entityReplacementTextByName.get(name);
		if (value === undefined && this._unparsedEntityNames.has(name)) {
			throw new Error(`reference to binary entity ${name} is not allowed`);
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
	throw new Error(
		`Error parsing ${what} at offset ${offset}: expected ${
			quoted.length > 1 ? 'one of ' + quoted.join(', ') : quoted[0]
		} but found "${input.slice(offset, offset + 1)}"`
	);
}

function normalizeAndIncludeEntities(
	normalized: string[],
	value: AttValueEvent[],
	dtd: Dtd | null,
	ancestorEntities: Set<string>
) {
	for (const event of value) {
		if (typeof event === 'string') {
			normalized.push(event.replace(/[\r\n\t]/g, ' '));
			continue;
		}

		if (event.type === ParserEventType.CharRef) {
			normalized.push(event.char);
			continue;
		}

		if (ancestorEntities.has(event.name)) {
			throw new Error(`reference to entity ${event.name} must not be recursive`);
		}
		let replacementText = predefinedEntitiesReplacementText.get(event.name);
		if (replacementText === undefined && dtd !== null) {
			replacementText = dtd.getEntityReplacementText(event.name);
		}
		if (replacementText === undefined) {
			throw new Error(`reference to unknown entity ${event.name} in attribute value`);
		}
		if (replacementText.includes('<')) {
			throw new Error(
				'replacement text for entity ${event.name} in attribute value must not contain "<"'
			);
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
		ancestorEntities.add(event.name);
		normalizeAndIncludeEntities(normalized, result.value, dtd, ancestorEntities);
		ancestorEntities.delete(event.name);
	}
}

function normalizeAttributeValue(
	value: AttValueEvent[],
	attDef: AttDefEvent | undefined,
	dtd: Dtd | null
): string {
	const normalized: string[] = [];
	normalizeAndIncludeEntities(normalized, value, dtd, new Set());
	if (attDef && !attDef.isCData) {
		return normalized
			.join('')
			.replace(/[ ]+/g, ' ')
			.replace(/^[ ]+|[ ]+$/g, '');
	}
	return normalized.join('');
}

class Namespaces {
	private _parent: Namespaces | null;
	private _byPrefix: Map<string | null, string | null> = new Map();

	private constructor(parent: Namespaces | null) {
		this._parent = parent;
	}

	public getForElement(qualifiedName: string): string | null {
		const { prefix } = splitQualifiedName(qualifiedName);
		for (let ns: Namespaces | null = this; ns !== null; ns = ns._parent) {
			const namespace = ns._byPrefix.get(prefix);
			if (namespace !== undefined) {
				return namespace;
			}
		}
		throw new Error(`use of undeclared element prefix ${prefix}`);
	}

	public getForAttribute(qualifiedName: string): string | null {
		const { prefix, localName } = splitQualifiedName(qualifiedName);
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
		dtd: Dtd | null
	): Namespaces {
		const ns = new Namespaces(parent);

		const checkAttr = (qualifiedName: string, value: AttValueEvent[]) => {
			const { prefix, localName } = splitQualifiedName(qualifiedName);
			const def = attlist?.get(qualifiedName);
			if (prefix === null && localName === 'xmlns' && !ns._byPrefix.has(null)) {
				ns._byPrefix.set(null, normalizeAttributeValue(value, def, dtd) || null);
			} else if (prefix === 'xmlns' && !ns._byPrefix.has(localName)) {
				if (localName === 'xmlns') {
					throw new Error('the xmlns namespace prefix must not be declared');
				}
				const namespace = normalizeAttributeValue(value, def, dtd) || null;
				if (localName === 'xml' && namespace !== XML_NAMESPACE) {
					throw new Error(
						`the xml namespace prefix must not be bound to any namespace other than ${XML_NAMESPACE}`
					);
				}
				if (namespace === null) {
					throw new Error(`the prefix ${localName} must not be undeclared`);
				}
				ns._byPrefix.set(localName, namespace);
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

function normalizeLineEndings(input: string): string {
	return input.replace(/\r\n?/g, '\n');
}

const ROOT_NAMESPACES = Namespaces.default();

type DomContext = {
	parent: DomContext | null;
	root: Node;
	namespaces: Namespaces;
	entityRoot: boolean;
};

type EntityContext = {
	parent: EntityContext | null;
	entity: string | null;
	generator: ReturnType<StreamingParser<DocumentParseEvent>>;
};

export function parseDocument(input: string): Document {
	const doc = new Document();
	let domContext: DomContext = {
		parent: null,
		root: doc,
		namespaces: ROOT_NAMESPACES,
		entityRoot: true,
	};
	let dtd: Dtd | null = null;
	let collectedText: string[] = [];

	function flushCollectedText() {
		if (collectedText.length > 0) {
			const text = collectedText.join('');
			if (domContext.root !== doc || !isWhitespace(text)) {
				domContext.root.appendChild(doc.createTextNode(collectedText.join('')));
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
		generator: document(input, 0),
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
					collectedText.push(event.char);
					continue;

				case ParserEventType.EntityRef: {
					for (let ctx: EntityContext | null = entityContext; ctx; ctx = ctx.parent) {
						if (ctx.entity === event.name) {
							throw new Error(
								`reference to entity ${event.name} must not be recursive`
							);
						}
					}
					let replacementText = predefinedEntitiesReplacementText.get(event.name);
					if (replacementText === undefined && dtd !== null) {
						replacementText = dtd.getEntityReplacementText(event.name);
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
						generator: contentComplete(replacementText, 0),
					};
					continue;
				}
			}

			flushCollectedText();

			switch (event.type) {
				case ParserEventType.CDSect:
					domContext.root.appendChild(doc.createCDATASection(event.data));
					continue;

				case ParserEventType.Comment:
					domContext.root.appendChild(doc.createComment(event.data));
					continue;

				case ParserEventType.Doctypedecl:
					dtd = new Dtd(event);
					domContext.root.appendChild(
						doc.implementation.createDocumentType(
							event.name,
							event.ids?.publicId || '',
							event.ids?.systemId || ''
						)
					);
					continue;

				case ParserEventType.PI:
					domContext.root.appendChild(
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
						dtd
					);
					const namespace = namespaces.getForElement(event.name);
					const element = doc.createElementNS(namespace, event.name);
					for (const attr of event.attributes) {
						const namespace = namespaces.getForAttribute(attr.name);
						const def = attlist?.get(attr.name);
						const { localName } = splitQualifiedName(attr.name);
						if (element.hasAttributeNS(namespace, localName)) {
							throw new Error(
								`attribute ${attr.name} must not appear multiple times on element ${event.name}`
							);
						}
						element.setAttributeNS(
							namespace,
							attr.name,
							normalizeAttributeValue(attr.value, def, dtd)
						);
					}
					// Add default attributes from the DTD
					if (attlist) {
						for (const attr of attlist.values()) {
							const def = attr.def;
							if (def.type !== DefaultDeclType.VALUE) {
								continue;
							}
							const namespace = namespaces.getForAttribute(attr.name);
							const { localName } = splitQualifiedName(attr.name);
							if (element.hasAttributeNS(namespace, localName)) {
								continue;
							}
							element.setAttributeNS(
								namespace,
								attr.name,
								normalizeAttributeValue(def.value, attr, dtd)
							);
						}
					}
					domContext.root.appendChild(element);
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
