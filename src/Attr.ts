import Document from './Document';
import Element from './Element';
import Node from './Node';
import { getContext } from './context/Context';
import { changeAttribute } from './util/attrMutations';
import { NodeType } from './util/NodeType';

/**
 * 3.9.2. Interface Attr
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
		// if the new value is null, act as if it was the empty string instead
		if (newValue === null) {
			newValue = '';
		}

		// Set an existing attribute value with context object and new value.
		setExistingAttributeValue(this, newValue);
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
	 * (non-standard) use Document#createAttribute(NS) or Element#setAttribute(NS) to create attribute nodes
	 *
	 * @param namespace The namespace URI for the attribute
	 * @param prefix    The prefix for the attribute
	 * @param localName The local name for the attribute
	 * @param value     The value for the attribute
	 * @param element   The element for the attribute, or null if the attribute is not attached to an element
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
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): Attr {
		// Set copy’s namespace, namespace prefix, local name, and value, to those of node.
		const context = getContext(document);
		const copy = new context.Attr(this.namespaceURI, this.prefix, this.localName, this.value, null);
		copy.ownerDocument = document;
		return copy;
	}
}

/**
 * To set an existing attribute value, given an attribute attribute and string value, run these steps:
 *
 * @param attribute The attribute to set the value of
 * @param value     The new value for attribute
 */
function setExistingAttributeValue(attribute: Attr, value: string) {
	// 1. If attribute’s element is null, then set attribute’s value to value.
	const element = attribute.ownerElement;
	if (element === null) {
		(attribute as any)._value = value;
	} else {
		// 2. Otherwise, change attribute from attribute’s element to value.
		changeAttribute(attribute, element, value);
	}
}
