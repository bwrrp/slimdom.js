import { ParentNode, NonDocumentTypeChildNode, ChildNode } from './mixins';
import { getChildren, getPreviousElementSibling, getNextElementSibling } from './mixins';
import Attr from './Attr';
import Document from './Document';
import Node from './Node';

import { appendAttribute, changeAttribute, removeAttribute, replaceAttribute } from './util/attrMutations';
import { throwInUseAttributeError, throwInvalidCharacterError, throwNotFoundError } from './util/errorHelpers';
import { matchesNameProduction, validateAndExtract } from './util/namespaceHelpers';
import { NodeType } from './util/NodeType';
import { asNullableString } from './util/typeHelpers';

/**
 * 3.9. Interface Element
 */
export default class Element extends Node implements ParentNode, NonDocumentTypeChildNode, ChildNode {
	// Node

	public get nodeType(): number {
		return NodeType.ELEMENT_NODE;
	}

	public get nodeName(): string {
		return this.tagName;
	}

	public get nodeValue(): string | null {
		return null;
	}

	public set nodeValue(newValue: string | null) {
		// Do nothing.
	}

	// ParentNode

	public get children(): Element[] {
		return getChildren(this);
	}

	public firstElementChild: Element | null = null;
	public lastElementChild: Element | null = null;
	public childElementCount: number = 0;

	// NonDocumentTypeChildNode

	public get previousElementSibling(): Element | null {
		return getPreviousElementSibling(this);
	}

	public get nextElementSibling(): Element | null {
		return getNextElementSibling(this);
	}

	// Element

	public readonly namespaceURI: string | null;
	public readonly prefix: string | null;
	public readonly localName: string;
	public readonly tagName: string;

	/**
	 * (non-standard) Use Document#createElement or Document#createElementNS to create an Element.
	 *
	 * @param document  Node document for the element
	 * @param namespace Namespace for the element
	 * @param prefix    Prefix for the element
	 * @param localName Local name for the element
	 */
	constructor(document: Document, namespace: string | null, prefix: string | null, localName: string) {
		super(document);
		this.namespaceURI = namespace;
		this.prefix = prefix;
		this.localName = localName;
		this.tagName = prefix === null ? localName : `${prefix}:${localName}`;
	}

	/**
	 * Returns whether the element has any attributes.
	 *
	 * @return True if the element has attributes, otherwise false
	 */
	public hasAttributes(): boolean {
		return this.attributes.length > 0;
	}

	/**
	 * The attributes for the element.
	 *
	 * Non-standard: the spec defines this as a NamedNodeMap, while this implementation uses an array.
	 */
	public readonly attributes: Attr[] = [];

	/**
	 * Get the value of the specified attribute.
	 *
	 * @param qualifiedName The qualified name of the attribute
	 *
	 * @return The value of the attribute, or null if no such attribute exists
	 */
	public getAttribute(qualifiedName: string): string | null {
		// 1. Let attr be the result of getting an attribute given qualifiedName and the context object.
		const attr = getAttributeByName(qualifiedName, this);

		// 2. If attr is null, return null.
		if (attr === null) {
			return null;
		}

		// 3. Return attr’s value.
		return attr.value;
	}

	/**
	 * Get the value of the specified attribute.
	 *
	 * @param namespace The namespace of the attribute
	 * @param localName The local name of the attribute
	 *
	 * @return The value of the attribute, or null if no such attribute exists
	 */
	public getAttributeNS(namespace: string | null, localName: string): string | null {
		namespace = asNullableString(namespace);

		// 1. Let attr be the result of getting an attribute given namespace, localName, and the context object.
		const attr = getAttributeByNamespaceAndLocalName(namespace, localName, this);

		// 2. If attr is null, return null.
		if (attr === null) {
			return null;
		}

		// 3. Return attr’s value.
		return attr.value;
	}

	/**
	 * Sets the value of the specified attribute.
	 *
	 * @param qualifiedName The qualified name of the attribute
	 * @param value         The new value for the attribute
	 */
	public setAttribute(qualifiedName: string, value: string): void {
		// 1. If qualifiedName does not match the Name production in XML, then throw an InvalidCharacterError.
		if (!matchesNameProduction(qualifiedName)) {
			throwInvalidCharacterError('The qualified name does not match the Name production');
		}

		// 2. If the context object is in the HTML namespace and its node document is an HTML document, then set
		// qualifiedName to qualifiedName in ASCII lowercase.
		// (html documents not implemented)

		// 3. Let attribute be the first attribute in context object’s attribute list whose qualified name is
		// qualifiedName, and null otherwise.
		const attribute = getAttributeByName(qualifiedName, this);

		// 4. If attribute is null, create an attribute whose local name is qualifiedName, value is value, and node
		// document is context object’s node document, then append this attribute to context object, and then return.
		if (attribute === null) {
			const attribute = new Attr(this.ownerDocument!, null, null, qualifiedName, value, this);
			appendAttribute(attribute, this);
			return;
		}

		// 5. Change attribute from context object to value.
		changeAttribute(attribute, this, value);
	}

	/**
	 * Sets the value of the specified attribute.
	 *
	 * @param namespace     The namespace of the attribute
	 * @param qualifiedName The qualified name of the attribute
	 * @param value         The value for the attribute
	 */
	public setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void {
		namespace = asNullableString(namespace);

		// 1. Let namespace, prefix, and localName be the result of passing namespace and qualifiedName to validate and
		// extract.
		const { namespace: validatedNamespace, prefix, localName } = validateAndExtract(namespace, qualifiedName);

		// 2. Set an attribute value for the context object using localName, value, and also prefix and namespace.
		setAttributeValue(this, localName, value, prefix, validatedNamespace);
	}

	/**
	 * Removes the specified attribute.
	 *
	 * @param qualifiedName The qualified name of the attribute
	 */
	public removeAttribute(qualifiedName: string): void {
		removeAttributeByName(qualifiedName, this);
	}

	/**
	 * Removes the specified attribute.
	 *
	 * @param namespace The namespace of the attribute
	 * @param localName The local name of the attribute
	 */
	public removeAttributeNS(namespace: string | null, localName: string): void {
		namespace = asNullableString(namespace);

		removeAttributeByNamespaceAndLocalName(namespace, localName, this);
	}

	/**
	 * Returns true if the specified attribute exists and false otherwise.
	 *
	 * @param qualifiedName The qualified name of the attribute
	 */
	public hasAttribute(qualifiedName: string): boolean {
		// 1. If the context object is in the HTML namespace and its node document is an HTML document, then set
		// qualifiedName to qualifiedName in ASCII lowercase.
		// (html documents not implemented)

		// 2. Return true if the context object has an attribute whose qualified name is qualifiedName, and false
		// otherwise.
		return getAttributeByName(qualifiedName, this) !== null;
	}

	/**
	 * Returns true if the specified attribute exists and false otherwise.
	 *
	 * @param namespace The namespace of the attribute
	 * @param localName The local name of the attribute
	 */
	public hasAttributeNS(namespace: string | null, localName: string): boolean {
		namespace = asNullableString(namespace);

		// 1. If namespace is the empty string, set it to null.
		// (handled by getAttributeByNamespaceAndLocalName, called below)
		// 2. Return true if the context object has an attribute whose namespace is namespace and local name is
		// localName, and false otherwise.
		return getAttributeByNamespaceAndLocalName(namespace, localName, this) !== null;
	}

	/**
	 * Returns the specified attribute node, or null if no such attribute exists.
	 *
	 * @param qualifiedName The qualified name of the attribute
	 *
	 * @return The attribute, or null if no such attribute exists
	 */
	public getAttributeNode(qualifiedName: string): Attr | null {
		return getAttributeByName(qualifiedName, this);
	}

	/**
	 * Returns the specified attribute node, or null if no such attribute exists.
	 *
	 * @param namespace The namespace of the attribute
	 * @param localName The local name of the attribute
	 *
	 * @return The attribute, or null if no such attribute exists
	 */
	public getAttributeNodeNS(namespace: string | null, localName: string): Attr | null {
		namespace = asNullableString(namespace);

		return getAttributeByNamespaceAndLocalName(namespace, localName, this);
	}

	/**
	 * Sets an attribute given its node
	 *
	 * @param attr The attribute node to set
	 *
	 * @return The previous attribute node for the attribute
	 */
	public setAttributeNode(attr: Attr): Attr | null {
		return setAttribute(attr, this);
	}

	/**
	 * Sets an attribute given its node
	 *
	 * @param attr The attribute node to set
	 *
	 * @return The previous attribute node for the attribute
	 */
	public setAttributeNodeNS(attr: Attr): Attr | null {
		return setAttribute(attr, this);
	}

	/**
	 * Removes an attribute given its node
	 *
	 * @param attr The attribute node to remove
	 *
	 * @return The removed attribute node
	 */
	public removeAttributeNode(attr: Attr): Attr {
		// 1. If context object’s attribute list does not contain attr, then throw a NotFoundError.
		if (this.attributes.indexOf(attr) < 0) {
			throwNotFoundError('the specified attribute does not exist');
		}

		// 2. Remove attr from context object.
		removeAttribute(attr, this);

		// 3. Return attr.
		return attr;
	}

	/**
	 * (non-standard) Creates a copy of the given node
	 *
	 * @param document The node document to associate with the copy
	 * @param other    The node to copy
	 *
	 * @return A shallow copy of the node
	 */
	public _copy(document: Document): Element {
		// 2.1. Let copy be the result of creating an element, given document, node’s local name, node’s namespace,
		// node’s namespace prefix, and the value of node’s is attribute if present (or null if not). The synchronous
		// custom elements flag should be unset.
		const copyElement = createElement(document, this.localName, this.namespaceURI, this.prefix);

		// 2.2. For each attribute in node’s attribute list:
		for (const attr of this.attributes) {
			// 2.2.1. Let copyAttribute be a clone of attribute.
			const copyAttribute = attr._copy(document);

			// 2.2.2. Append copyAttribute to copy.
			copyElement.setAttributeNode(copyAttribute);
		}

		return copyElement;
	}
}

/**
 * To create an element, given a document, localName, namespace, and optional prefix, is, and synchronous custom
 * elements flag, run these steps:
 *
 * @param document  The node document for the new element
 * @param localName The local name for the new element
 * @param namespace The namespace URI for the new element, or null for the null namespace
 * @param prefix    The prefix for the new element, or null for no prefix
 *
 * @return The new element
 */
export function createElement(
	document: Document,
	localName: string,
	namespace: string | null,
	prefix: string | null = null
): Element {
	// 1. If prefix was not given, let prefix be null.
	// (handled by default)

	// 2. If is was not given, let is be null.
	// (custom elements not implemented)

	// 3. Let result be null.
	let result = null;

	// 4. Let definition be the result of looking up a custom element definition given document, namespace, localName,
	// and is.
	// (custom elements not implemented)

	// 5. If definition is non-null, and definition’s name is not equal to its local name (i.e., definition represents a
	// customized built-in element), then:
	// 5.1. Let interface be the element interface for localName and the HTML namespace.
	// 5.2. Set result to a new element that implements interface, with no attributes, namespace set to the HTML
	// namespace, namespace prefix set to prefix, local name set to localName, custom element state set to "undefined",
	// custom element definition set to null, is value set to is, and node document set to document.
	// 5.3. If the synchronous custom elements flag is set, upgrade element using definition.
	// 5.4. Otherwise, enqueue a custom element upgrade reaction given result and definition.
	// (custom elements not implemented)

	// 6. Otherwise, if definition is non-null, then:
	// 6.1. If the synchronous custom elements flag is set, then run these steps while catching any exceptions:
	// 6.1.1. Let C be definition’s constructor.
	// 6.1.2. Set result to the result of constructing C, with no arguments.
	// 6.1.3. If result does not implement the HTMLElement interface, then throw a TypeError.
	// This is meant to be a brand check to ensure that the object was allocated by the HTML element constructor. See
	// webidl #97 about making this more precise.
	// If this check passes, then result will already have its custom element state and custom element definition
	// initialized.
	// 6.1.4. If result’s attribute list is not empty, then throw a NotSupportedError.
	// 6.1.5. If result has children, then throw a NotSupportedError.
	// 6.1.6. If result’s parent is not null, then throw a NotSupportedError.
	// 6.1.7. If result’s node document is not document, then throw a NotSupportedError.
	// 6.1.8. If result’s namespace is not the HTML namespace, then throw a NotSupportedError.
	// As of the time of this writing, every element that implements the HTMLElement interface is also in the HTML
	// namespace, so this check is currently redundant with the above brand check. However, this is not guaranteed to be
	// true forever in the face of potential specification changes, such as converging certain SVG and HTML interfaces.
	// 6.1.9. If result’s local name is not equal to localName, then throw a NotSupportedError.
	// 6.1.10. Set result’s namespace prefix to prefix.
	// 6.1.11. Set result’s is value to null.
	// If any of these steps threw an exception, then:
	// 6.1.catch.1. Report the exception.
	// 6.1.catch.2. Set result to a new element that implements the HTMLUnknownElement interface, with no attributes,
	// namespace set to the HTML namespace, namespace prefix set to prefix, local name set to localName, custom element
	// state set to "failed", custom element definition set to null, is value set to null, and node document set to
	// document.
	// 6.2. Otherwise:
	// 6.2.1. Set result to a new element that implements the HTMLElement interface, with no attributes, namespace set
	// to the HTML namespace, namespace prefix set to prefix, local name set to localName, custom element state set to
	// "undefined", custom element definition set to null, is value set to null, and node document set to document.
	// 6.2.2. Enqueue a custom element upgrade reaction given result and definition.
	// (custom elements not implemented)

	// 7. Otherwise:
	// 7.1. Let interface be the element interface for localName and namespace.
	// (interfaces other than Element not implemented)

	// 7.2. Set result to a new element that implements interface, with no attributes, namespace set to namespace,
	// namespace prefix set to prefix, local name set to localName, custom element state set to "uncustomized", custom
	// element definition set to null, is value set to is, and node document set to document.
	result = new Element(document, namespace, prefix, localName);

	// If namespace is the HTML namespace, and either localName is a valid custom element name or is is non-null, then
	// set result’s custom element state to "undefined".
	// (custom elements not implemented)

	// Return result.
	return result;
}

/**
 * To get an attribute by name given a qualifiedName and element element, run these steps:
 *
 * @param qualifiedName The qualified name of the attribute to get
 * @param element       The element to get the attribute on
 *
 * @return The first matching attribute, or null otherwise
 */
function getAttributeByName(qualifiedName: string, element: Element): Attr | null {
	// 1. If element is in the HTML namespace and its node document is an HTML document, then set qualifiedName to
	// qualifiedName in ASCII lowercase.
	// (html documents not implemented)

	// 2. Return the first attribute in element’s attribute list whose qualified name is qualifiedName, and null
	// otherwise.
	return element.attributes.find(attr => attr.name === qualifiedName) || null;
}

/**
 * To get an attribute by namespace and local name given a namespace, localName, and element element, run these steps:
 *
 * @param namespace Namespace for the attribute
 * @param localName Local name for the attribute
 * @param element   The element to get the attribute on
 *
 * @return The first matching attribute, or null otherwise
 */
function getAttributeByNamespaceAndLocalName(
	namespace: string | null,
	localName: string,
	element: Element
): Attr | null {
	// 1. If namespace is the empty string, set it to null.
	if (namespace === '') {
		namespace = null;
	}

	// 2. Return the attribute in element’s attribute list whose namespace is namespace and local name is localName, if
	// any, and null otherwise.
	return element.attributes.find(attr => attr.namespaceURI === namespace && attr.localName === localName) || null;
}

/**
 * To get an attribute value given an element element, localName, and optionally a namespace (null unless stated
 * otherwise), run these steps:
 *
 * @param element   The element to get the attribute on
 * @param localName The local name of the attribute
 * @param namespace The namespace of the attribute
 *
 * @return The value of the first matching attribute, or the empty string if no such attribute exists
 */
function getAttributeValue(element: Element, localName: string, namespace: string | null = null): string {
	// 1. Let attr be the result of getting an attribute given namespace, localName, and element.
	const attr = getAttributeByNamespaceAndLocalName(namespace, localName, element);

	// 2. If attr is null, then return the empty string.
	if (attr === null) {
		return '';
	}

	// 3. Return attr’s value.
	return attr.value;
}

/**
 * To set an attribute given an attr and element, run these steps:
 *
 * @param attr    The new attribute to set
 * @param element The element to set attr on
 *
 * @return The previous attribute with attr's namespace and local name, or null if there was no such attribute
 */
function setAttribute(attr: Attr, element: Element): Attr | null {
	// 1. If attr’s element is neither null nor element, throw an InUseAttributeError.
	if (attr.ownerElement !== null && attr.ownerElement !== element) {
		throwInUseAttributeError('attribute is in use by another element');
	}

	// 2. Let oldAttr be the result of getting an attribute given attr’s namespace, attr’s local name, and element.
	const oldAttr = getAttributeByNamespaceAndLocalName(attr.namespaceURI, attr.localName, element);

	// 3. If oldAttr is attr, return attr.
	if (oldAttr === attr) {
		return attr;
	}

	// 4. If oldAttr is non-null, replace it by attr in element.
	if (oldAttr !== null) {
		replaceAttribute(oldAttr, attr, element);
	} else {
		// 5. Otherwise, append attr to element.
		appendAttribute(attr, element);
	}

	// 6. Return oldAttr.
	return oldAttr;
}

/**
 * To set an attribute value for an element element using a localName and value, and an optional prefix, and namespace,
 * run these steps:
 *
 * @param element   Element to set the attribute value on
 * @param localName Local name of the attribute
 * @param value     New value of the attribute
 * @param prefix    Prefix of the attribute
 * @param namespace Namespace of the attribute
 */
function setAttributeValue(
	element: Element,
	localName: string,
	value: string,
	prefix: string | null = null,
	namespace: string | null = null
): void {
	// 1. If prefix is not given, set it to null.
	// 2. If namespace is not given, set it to null.
	// (handled by default values)

	// 3. Let attribute be the result of getting an attribute given namespace, localName, and element.
	const attribute = getAttributeByNamespaceAndLocalName(namespace, localName, element);

	// 4. If attribute is null, create an attribute whose namespace is namespace, namespace prefix is prefix, local name
	// is localName, value is value, and node document is element’s node document, then append this attribute to
	// element, and then return.
	if (attribute === null) {
		const attribute = new Attr(element.ownerDocument!, namespace, prefix, localName, value, element);
		appendAttribute(attribute, element);
		return;
	}

	// 5. Change attribute from element to value.
	changeAttribute(attribute, element, value);
}

/**
 * To remove an attribute by name given a qualifiedName and element element, run these steps:
 *
 * @param qualifiedName Qualified name of the attribute
 * @param element       The element to remove the attribute from
 *
 * @return The removed attribute, or null if no matching attribute exists
 */
function removeAttributeByName(qualifiedName: string, element: Element): Attr | null {
	// 1. Let attr be the result of getting an attribute given qualifiedName and element.
	const attr = getAttributeByName(qualifiedName, element);

	// 2. If attr is non-null, remove it from element.
	if (attr !== null) {
		removeAttribute(attr, element);
	}

	// 3. Return attr.
	return attr;
}

/**
 * To remove an attribute by namespace and local name given a namespace, localName, and element element, run these
 * steps:
 *
 * @param namespace The namespace of the attribute
 * @param localName The local name of the attribute
 * @param element   The element to remove the attribute from
 *
 * @return The removed attribute, or null if no matching attribute exists
 */
function removeAttributeByNamespaceAndLocalName(
	namespace: string | null,
	localName: string,
	element: Element
): Attr | null {
	// 1. Let attr be the result of getting an attribute given namespace, localName, and element.
	const attr = getAttributeByNamespaceAndLocalName(namespace, localName, element);

	// 2. If attr is non-null, remove it from element.
	if (attr !== null) {
		removeAttribute(attr, element);
	}

	// 3. Return attr.
	return attr;
}
