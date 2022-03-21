import Document from '../Document';
import Node from '../Node';
import { splitQualifiedName, XMLNS_NAMESPACE, XML_NAMESPACE } from '../util/namespaceHelpers';
import { isElement } from '../util/NodeType';
import { document, isWhitespace } from './grammar';
import {
	AttlistDeclEvent,
	AttValueEvent,
	DefaultDeclType,
	DoctypedeclEvent,
	EmptyElemTagEvent,
	MarkupdeclEventType,
	ParserEventType,
	STagEvent,
} from './parserEvents';

// TODO: entities defined in encoded form in spec:
// <!ENTITY lt     "&#38;#60;">
// <!ENTITY gt     "&#62;">
// <!ENTITY amp    "&#38;#38;">
// <!ENTITY apos   "&#39;">
// <!ENTITY quot   "&#34;">
const predefinedEntities = new Map([
	['lt', '<'],
	['gt', '>'],
	['amp', '&'],
	['apos', "'"],
	['quot', '"'],
]);

function getAttrValue(value: AttValueEvent[]): string {
	// TODO: normalize attribute value
	return value
		.map((v) => {
			if (typeof v === 'string') {
				return v;
			}
			switch (v.type) {
				case ParserEventType.CharRef:
					return v.char;

				default:
					const c = predefinedEntities.get(v.name);
					if (c !== undefined) {
						return c;
					}
					// TODO: handle entities defined in the DTD
					// TODO: referenced entities must not be external
					// TODO: replacement text of referenced entities must not contain <
					throw new Error(`entity reference ${v.name} in attribute value not supported`);
			}
		})
		.join('');
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
		attlist: AttlistDeclEvent | undefined
	): Namespaces {
		const ns = new Namespaces(parent);

		const checkAttr = (qualifiedName: string, value: AttValueEvent[]) => {
			const { prefix, localName } = splitQualifiedName(qualifiedName);
			if (prefix === null && localName === 'xmlns' && !ns._byPrefix.has(null)) {
				ns._byPrefix.set(null, getAttrValue(value) || null);
			} else if (prefix === 'xmlns' && !ns._byPrefix.has(localName)) {
				if (localName === 'xmlns') {
					throw new Error('the xmlns namespace prefix must not be declared');
				}
				const namespace = getAttrValue(value) || null;
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
			for (const attr of attlist.attdefs) {
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

function getAttList(
	dtd: DoctypedeclEvent | null,
	elementName: string
): AttlistDeclEvent | undefined {
	if (!dtd || !dtd.intSubset) {
		return undefined;
	}

	// TODO: build a map?
	return dtd.intSubset.find(
		(decl) => decl.type === MarkupdeclEventType.AttlistDecl && decl.name === elementName
	);
}

const ROOT_NAMESPACES = Namespaces.default();

type ParseContext = {
	parent: Node;
	namespaces: Namespaces;
};

export function parseDocument(input: string): Document {
	const doc = new Document();
	let context: ParseContext = {
		parent: doc,
		namespaces: ROOT_NAMESPACES,
	};
	let dtd: DoctypedeclEvent | null = null;
	const stack: ParseContext[] = [];

	let collectedText: string[] = [];

	function flushCollectedText() {
		if (collectedText.length > 0) {
			const text = collectedText.join('');
			if (context.parent !== doc || !isWhitespace(text)) {
				context.parent.appendChild(doc.createTextNode(collectedText.join('')));
			}
		}
		collectedText.length = 0;
	}

	input = normalizeLineEndings(input);

	const gen = document(input, 0);
	let it = gen.next();
	for (; !it.done; it = gen.next()) {
		const event = it.value;
		if (typeof event === 'string') {
			collectedText.push(event);
			continue;
		}

		switch (event.type) {
			case ParserEventType.CharRef:
				collectedText.push(event.char);
				continue;

			case ParserEventType.EntityRef:
				const char = predefinedEntities.get(event.name);
				if (char === undefined) {
					throw new Error(
						`entity reference ${event.name} in character data not supported`
					);
				}
				collectedText.push(char);
				continue;
		}

		flushCollectedText();

		switch (event.type) {
			case ParserEventType.CDSect:
				context.parent.appendChild(doc.createCDATASection(event.data));
				continue;

			case ParserEventType.Comment:
				context.parent.appendChild(doc.createComment(event.data));
				continue;

			case ParserEventType.Doctypedecl:
				dtd = event;
				context.parent.appendChild(
					doc.implementation.createDocumentType(
						event.name,
						event.ids?.publicId || '',
						event.ids?.systemId || ''
					)
				);
				continue;

			case ParserEventType.PI:
				context.parent.appendChild(
					doc.createProcessingInstruction(event.target, event.data || '')
				);
				continue;

			case ParserEventType.STag:
			case ParserEventType.EmptyElemTag: {
				if (context.parent === doc && doc.documentElement !== null) {
					throw new Error(
						`document must contain a single root element, but found ${doc.documentElement.nodeName} and ${event.name}`
					);
				}
				const namespaces = Namespaces.fromAttrs(
					context.namespaces,
					event,
					getAttList(dtd, event.name)
				);
				const namespace = namespaces.getForElement(event.name);
				const element = doc.createElementNS(namespace, event.name);
				for (const attr of event.attributes) {
					const namespace = namespaces.getForAttribute(attr.name);
					const { localName } = splitQualifiedName(attr.name);
					if (element.hasAttributeNS(namespace, localName)) {
						throw new Error(
							`attribute ${attr.name} must not appear multiple times on element ${event.name}`
						);
					}
					element.setAttributeNS(namespace, attr.name, getAttrValue(attr.value));
				}
				// Add default attributes from the DTD
				const attlist = getAttList(dtd, event.name);
				if (attlist) {
					for (const attr of attlist.attdefs) {
						const def = attr.def;
						if (def.type !== DefaultDeclType.VALUE) {
							continue;
						}
						const namespace = namespaces.getForAttribute(attr.name);
						const { localName } = splitQualifiedName(attr.name);
						if (element.hasAttributeNS(namespace, localName)) {
							continue;
						}
						element.setAttributeNS(namespace, attr.name, getAttrValue(def.value));
					}
				}
				context.parent.appendChild(element);
				if (event.type === ParserEventType.STag) {
					stack.push(context);
					context = {
						parent: element,
						namespaces,
					};
				}
				continue;
			}

			case ParserEventType.ETag:
				if (!isElement(context.parent) || context.parent.nodeName !== event.name) {
					throw new Error(
						`non-well-formed element: found end tag ${event.name} but expected ${
							isElement(context.parent) ? context.parent.nodeName : 'no such tag'
						}`
					);
				}
				context = stack.pop()!;
				continue;
		}
	}

	if (!it.value.success) {
		const quoted = it.value.expected.map((str) => `"${str}"`);
		throw new Error(
			`Error parsing document at offset ${it.value.offset}: expected ${
				quoted.length > 1 ? 'one of ' + quoted.join(', ') : quoted[0]
			} but found "${input.slice(it.value.offset, it.value.offset + 1)}"`
		);
	}

	flushCollectedText();

	return doc;
}
