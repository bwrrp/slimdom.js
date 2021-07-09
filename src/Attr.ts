import Document from './Document';
import Element from './Element';
import Node from './Node';
import { getContext } from './context/Context';
import { changeAttribute } from './util/attrMutations';
import { expectArity } from './util/errorHelpers';
import { NodeType } from './util/NodeType';
import { treatNullAsEmptyString } from './util/typeHelpers';

/**
 * 3.9.2. Interface Attr
 *
 * @public
 */
export default class Attr extends Node {
	// Node

	public get nodeType(): number {
		return NodeType.ATTRIBUTE_NODE;
	}

	public get nodeName(): string {
		// Return the qualified name
		return this.name;
	}

	public get nodeValue(): string | null {
		return this._value;
	}

	public set nodeValue(newValue: string | null) {
		newValue = treatNullAsEmptyString(newValue);

		// Set an existing attribute value with this and new value.
		setExistingAttributeValue(this, newValue);
	}

	public get textContent(): string | null {
		return this._value;
	}

	public set textContent(newValue: string | null) {
		newValue = treatNullAsEmptyString(newValue);

		// Set an existing attribute value with this and new value.
		setExistingAttributeValue(this, newValue);
	}

	public lookupPrefix(namespace: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If namespace is null or the empty string, then return null.
		// (not necessary due to recursion)

		// 2. Switch on this:
		// Attr - Return the result of locating a namespace prefix for its element, if its element
		// is non-null, and null otherwise.
		if (this.ownerElement !== null) {
			return this.ownerElement.lookupPrefix(namespace);
		}

		return null;
	}

	public lookupNamespaceURI(prefix: string | null): string | null {
		expectArity(arguments, 1);

		// 1. If prefix is the empty string, then set it to null.
		// (not necessary due to recursion)

		// 2. Return the result of running locate a namespace for this using prefix.

		// To locate a namespace for a node using prefix, switch on node: Attr
		// 1. If its element is null, then return null.
		if (this.ownerElement === null) {
			return null;
		}

		// 2. Return the result of running locate a namespace on its element using prefix.
		return this.ownerElement.lookupNamespaceURI(prefix);
	}

	// Attr

	public readonly namespaceURI: string | null;
	public readonly prefix: string | null;
	public readonly localName: string;
	public readonly name: string;

	private _value: string;

	public get value(): string {
		return this._value;
	}

	public set value(value: string) {
		setExistingAttributeValue(this, value);
	}

	public ownerElement: Element | null;

	/**
	 * (non-standard) use Document#createAttribute(NS) or Element#setAttribute(NS) to create
	 * attribute nodes
	 *
	 * @param namespace - The namespace URI for the attribute
	 * @param prefix    - The prefix for the attribute
	 * @param localName - The local name for the attribute
	 * @param value     - The value for the attribute
	 * @param element   - The element for the attribute, or null if the attribute is not attached to
	 *                    an element
	 */
	constructor(
		namespace: string | null,
		prefix: string | null,
		localName: string,
		value: string,
		element: Element | null
	) {
		super();

		this.namespaceURI = namespace;
		this.prefix = prefix;
		this.localName = localName;
		this.name = prefix === null ? localName : `${prefix}:${localName}`;
		this._value = value;
		this.ownerElement = element;
	}

	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public _copy(document: Document): Attr {
		// Set copy’s namespace, namespace prefix, local name, and value, to those of node.
		const context = getContext(document);
		const copy = new context.Attr(
			this.namespaceURI,
			this.prefix,
			this.localName,
			this.value,
			null
		);
		copy.ownerDocument = document;
		return copy;
	}
}

/**
 * To set an existing attribute value, given an attribute attribute and string value, run these
 * steps:
 *
 * @param attribute - The attribute to set the value of
 * @param value     - The new value for attribute
 */
function setExistingAttributeValue(attribute: Attr, value: string) {
	value = String(value);

	// 1. If attribute’s element is null, then set attribute’s value to value.
	const element = attribute.ownerElement;
	if (element === null) {
		(attribute as any)._value = value;
	} else {
		// 2. Otherwise, change attribute to value.
		changeAttribute(attribute, value);
	}
}
