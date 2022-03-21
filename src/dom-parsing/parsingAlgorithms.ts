import Document from '../Document';
import Node from '../Node';
import { splitQualifiedName, XMLNS_NAMESPACE, XML_NAMESPACE } from '../util/namespaceHelpers';
import { isElement } from '../util/NodeType';
import { document, isWhitespace } from './grammar';
import { AttributeEvent, EmptyElemTagEvent, ParserEventType, STagEvent } from './parserEvents';

const builtinEntities = new Map([
	['amp', '&'],
	['lt', '<'],
	['gt', '>'],
	['apos', "'"],
	['quot', '"'],
]);

function getAttrValue(attr: AttributeEvent): string {
	// TODO: normalize attribute value
	return attr.value
		.map((v) => {
			if (typeof v === 'string') {
				return v;
			}
			switch (v.type) {
				case ParserEventType.CharRef:
					return v.char;

				default:
					// TODO: handle entities
					throw new Error('entity reference in attribute value not supported');
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

	public static fromAttrs(parent: Namespaces, event: STagEvent | EmptyElemTagEvent): Namespaces {
		const ns = new Namespaces(parent);

		// TODO: also consider DTD default attributes
		for (const attr of event.attributes) {
			const { prefix, localName } = splitQualifiedName(attr.name);
			if (prefix === null && localName === 'xmlns') {
				ns._byPrefix.set(null, getAttrValue(attr) || null);
			} else if (prefix === 'xmlns') {
				if (localName === 'xmlns') {
					throw new Error('the xmlns namespace prefix may not be declared');
				}
				const namespace = getAttrValue(attr) || null;
				if (localName === 'xml' && namespace !== XML_NAMESPACE) {
					throw new Error(
						`the xml namespace prefix may not be bound to any namespace other than ${XML_NAMESPACE}`
					);
				}
				if (namespace === null) {
					throw new Error(`the prefix ${localName} may not be undeclared`);
				}
				ns._byPrefix.set(localName, namespace);
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

	// TODO: normalize line endings

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
				const char = builtinEntities.get(event.name);
				if (char === undefined) {
					throw new Error(`unknown entity "${event.name}`);
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
						`document may only contain a single root element, but found ${doc.documentElement.nodeName} and ${event.name}`
					);
				}
				const namespaces = Namespaces.fromAttrs(context.namespaces, event);
				const namespace = namespaces.getForElement(event.name);
				const element = doc.createElementNS(namespace, event.name);
				for (const attr of event.attributes) {
					const namespace = namespaces.getForAttribute(attr.name);
					const { localName } = splitQualifiedName(attr.name);
					if (element.hasAttributeNS(namespace, localName)) {
						throw new Error(
							`attribute ${attr.name} may not appear multiple times on element ${event.name}`
						);
					}
					element.setAttributeNS(namespace, attr.name, getAttrValue(attr));
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
