import { ParentNode, NonDocumentTypeChildNode, ChildNode } from './mixins';
import { getChildren, getPreviousElementSibling, getNextElementSibling } from './mixins';
import Attr from './Attr';
import Document from './Document';
import Node from './Node';
import { getContext } from './context/Context';
import { serializeFragment } from './dom-parsing/serializationAlgorithms';
import {
	appendNodes,
	getDescendantTextContent,
	insertNodesAfter,
	insertNodesBefore,
	prependNodes,
	removeFromParent,
	replaceChildren,
	replaceWithNodes,
	stringReplaceAll,
} from './util/mutationAlgorithms';
import {
	appendAttribute,
	changeAttribute,
	removeAttribute,
	replaceAttribute,
} from './util/attrMutations';
import {
	expectArity,
	throwInUseAttributeError,
	throwInvalidCharacterError,
	throwNotFoundError,
} from './util/errorHelpers';
import {
	matchesNameProduction,
	validateAndExtract,
	locateNamespacePrefix,
	XMLNS_NAMESPACE,
} from './util/namespaceHelpers';
import { NodeType } from './util/NodeType';
import { asNullableString, asObject, treatNullAsEmptyString } from './util/typeHelpers';

/**
 * 3.9. Interface Element
 *
 * @public
 */
export default class Element
	extends Node
	implements ParentNode, NonDocumentTypeChildNode, ChildNode {
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

	public get textContent(): string | null {
		// Return the descendant text content of this
		return getDescendantTextContent(this);
	}

	public set textContent(newValue: string | null) {
		newValue = treatNullAsEmptyString(newValue);
		stringReplaceAll(this, newValue);
	}

	public lookupPrefix(namespace: string | null): string | null {
		expectArity(arguments, 1);
		namespace = asNullableString(namespace);

		// 1. If namespace is null or the empty string, then return null.
		if (namespace === null || namespace === '') {
			return null;
		}

		// 2. Switch on this:
		// Element - Return the result of locating a namespace prefix for it using namespace.
		return locateNamespacePrefix(this, namespace);
	}

	public lookupNamespaceURI(prefix: string | null): string | null {
		expectArity(arguments, 1);
		prefix = asNullableString(prefix);

		// 1. If prefix is the empty string, then set it to null.
		if (prefix === '') {
			prefix = null;
		}

		// 2. Return the result of running locate a namespace for this using prefix.

		// To locate a namespace for a node using prefix, switch on node: Element
		// 1. If its namespace is non-null and its namespace prefix is prefix, then return
		// namespace.
		if (this.namespaceURI !== null && this.prefix === prefix) {
			return this.namespaceURI;
		}

		// 2. If it has an attribute whose namespace is the XMLNS namespace, namespace prefix is
		// "xmlns", and local name is prefix, or if prefix is null and it has an attribute whose
		// namespace is the XMLNS namespace, namespace prefix is null, and local name is "xmlns",
		// then return its value if it is not the empty string, and null otherwise.
		let ns = null;
		if (prefix !== null) {
			const attr = this.getAttributeNodeNS(XMLNS_NAMESPACE, prefix);
			if (attr && attr.prefix === 'xmlns') {
				ns = attr.value;
			}
		} else {
			const attr = this.getAttributeNodeNS(XMLNS_NAMESPACE, 'xmlns');
			if (attr && attr.prefix === null) {
				ns = attr.value;
			}
		}
		if (ns !== null) {
			return ns !== '' ? ns : null;
		}

		// 3. If its parent element is null, then return null.
		const parentElement = this.parentElement;
		if (parentElement === null) {
			return null;
		}

		// 4. Return the result of running locate a namespace on its parent element using prefix.
		return parentElement.lookupNamespaceURI(prefix);
	}

	// ChildNode

	public before(...nodes: (Node | string)[]): void {
		insertNodesBefore(this, nodes);
	}

	public after(...nodes: (Node | string)[]): void {
		insertNodesAfter(this, nodes);
	}

	public replaceWith(...nodes: (Node | string)[]): void {
		replaceWithNodes(this, nodes);
	}

	public remove(): void {
		removeFromParent(this);
	}

	// ParentNode

	public get children(): Element[] {
		return getChildren(this);
	}

	public firstElementChild: Element | null = null;
	public lastElementChild: Element | null = null;
	public childElementCount: number = 0;

	public prepend(...nodes: (Node | string)[]): void {
		prependNodes(this, nodes);
	}

	public append(...nodes: (Node | string)[]): void {
		appendNodes(this, nodes);
	}

	public replaceChildren(...nodes: (Node | string)[]): void {
		replaceChildren(this, nodes);
	}

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
	 * @param namespace - Namespace for the element
	 * @param prefix    - Prefix for the element
	 * @param localName - Local name for the element
	 */
	constructor(namespace: string | null, prefix: string | null, localName: string) {
		super();

		this.namespaceURI = namespace;
		this.prefix = prefix;
		this.localName = localName;
		this.tagName = prefix === null ? localName : `${prefix}:${localName}`;
	}

	/**
	 * Returns whether the element has any attributes.
	 *
	 * @returns True if the element has attributes, otherwise false
	 */
	public hasAttributes(): boolean {
		return this.attributes.length > 0;
	}

	/**
	 * The attributes for the element.
	 *
	 * Non-standard: the spec defines this as a NamedNodeMap, while this implementation uses an
	 * array.
	 */
	public readonly attributes: Attr[] = [];

	/**
	 * Get the value of the specified attribute.
	 *
	 * @param qualifiedName - The qualified name of the attribute
	 *
	 * @returns The value of the attribute, or null if no such attribute exists
	 */
	public getAttribute(qualifiedName: string): string | null {
		expectArity(arguments, 1);
		qualifiedName = String(qualifiedName);

		// 1. Let attr be the result of getting an attribute given qualifiedName and the context
		// object.
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
	 * @param namespace - The namespace of the attribute
	 * @param localName - The local name of the attribute
	 *
	 * @returns The value of the attribute, or null if no such attribute exists
	 */
	public getAttributeNS(namespace: string | null, localName: string): string | null {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		localName = String(localName);

		// 1. Let attr be the result of getting an attribute given namespace, localName, and the
		// this.
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
	 * @param qualifiedName - The qualified name of the attribute
	 * @param value         - The new value for the attribute
	 */
	public setAttribute(qualifiedName: string, value: string): void {
		expectArity(arguments, 2);
		qualifiedName = String(qualifiedName);
		value = String(value);

		// 1. If qualifiedName does not match the Name production in XML, then throw an
		// InvalidCharacterError.
		if (!matchesNameProduction(qualifiedName)) {
			throwInvalidCharacterError('The qualified name does not match the Name production');
		}

		// 2. If this is in the HTML namespace and its node document is an HTML
		// document, then set qualifiedName to qualifiedName in ASCII lowercase.
		// (html documents not implemented)

		// 3. Let attribute be the first attribute in this’s attribute list whose
		// qualified name is qualifiedName, and null otherwise.
		const attribute = getAttributeByName(qualifiedName, this);

		// 4. If attribute is null, create an attribute whose local name is qualifiedName, value is
		// value, and node document is this’s node document, then append this attribute to
		// this, and then return.
		if (attribute === null) {
			const context = getContext(this);
			const attribute = new context.Attr(null, null, qualifiedName, value, this);
			attribute.ownerDocument = this.ownerDocument;
			appendAttribute(attribute, this);
			return;
		}

		// 5. Change attribute to value.
		changeAttribute(attribute, value);
	}

	/**
	 * Sets the value of the specified attribute.
	 *
	 * @param namespace     - The namespace of the attribute
	 * @param qualifiedName - The qualified name of the attribute
	 * @param value         - The value for the attribute
	 */
	public setAttributeNS(namespace: string | null, qualifiedName: string, value: string): void {
		expectArity(arguments, 3);
		namespace = asNullableString(namespace);
		qualifiedName = String(qualifiedName);
		value = String(value);

		// 1. Let namespace, prefix, and localName be the result of passing namespace and
		// qualifiedName to validate and extract.
		const { namespace: validatedNamespace, prefix, localName } = validateAndExtract(
			namespace,
			qualifiedName
		);

		// 2. Set an attribute value for this using localName, value, and also prefix
		// and namespace.
		setAttributeValue(this, localName, value, prefix, validatedNamespace);
	}

	/**
	 * Removes the specified attribute.
	 *
	 * @param qualifiedName - The qualified name of the attribute
	 */
	public removeAttribute(qualifiedName: string): void {
		expectArity(arguments, 1);
		qualifiedName = String(qualifiedName);

		removeAttributeByName(qualifiedName, this);
	}

	/**
	 * Removes the specified attribute.
	 *
	 * @param namespace - The namespace of the attribute
	 * @param localName - The local name of the attribute
	 */
	public removeAttributeNS(namespace: string | null, localName: string): void {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		localName = String(localName);

		removeAttributeByNamespaceAndLocalName(namespace, localName, this);
	}

	/**
	 * If force is not given, "toggles" qualifiedName, removing it if it is present and adding it if
	 * it is not present. If force is true, adds qualifiedName. If force is false, removes
	 * qualifiedName.
	 *
	 * Returns true if qualifiedName is now present, and false otherwise.
	 *
	 * @param qualifiedName - The qualified name of the attribute to toggle
	 * @param force         - If true, adds the attribute, if false removes it
	 */
	public toggleAttribute(qualifiedName: string, force?: boolean): boolean {
		// 1. If qualifiedName does not match the Name production in XML, then throw an
		// "InvalidCharacterError" DOMException.
		if (!matchesNameProduction(qualifiedName)) {
			throwInvalidCharacterError('The qualified name does not match the Name production');
		}

		// 2. If this is in the HTML namespace and its node document is an HTML
		// document, then set qualifiedName to qualifiedName in ASCII lowercase.
		// (html documents not implemented)

		// 3. Let attribute be the first attribute in this’s attribute list whose
		// qualified name is qualifiedName, and null otherwise.
		const attribute = getAttributeByName(qualifiedName, this);

		// 4. If attribute is null, then:
		if (attribute === null) {
			// 4.1. If force is not given or is true,
			if (force === undefined || force === true) {
				// ...create an attribute whose local name is qualifiedName, value is the empty
				// string, and node document is this’s node document,
				const context = getContext(this);
				const attribute = new context.Attr(null, null, qualifiedName, '', this);
				attribute.ownerDocument = this.ownerDocument;
				// ...then append this attribute to this,
				appendAttribute(attribute, this);
				// ...and then return true.
				return true;
			}

			// 4.2. Return false.
			return false;
		}

		// 5. Otherwise, if force is not given or is false,
		if (force === undefined || force === false) {
			// ...remove an attribute given qualifiedName and this,
			removeAttributeByName(qualifiedName, this);
			// ...and then return false.
			return false;
		}

		// 6. Return true.
		return true;
	}

	/**
	 * Returns true if the specified attribute exists and false otherwise.
	 *
	 * @param qualifiedName - The qualified name of the attribute
	 */
	public hasAttribute(qualifiedName: string): boolean {
		expectArity(arguments, 1);
		qualifiedName = String(qualifiedName);

		// 1. If this is in the HTML namespace and its node document is an HTML
		// document, then set qualifiedName to qualifiedName in ASCII lowercase.
		// (html documents not implemented)

		// 2. Return true if this has an attribute whose qualified name is
		// qualifiedName, and false otherwise.
		return getAttributeByName(qualifiedName, this) !== null;
	}

	/**
	 * Returns true if the specified attribute exists and false otherwise.
	 *
	 * @param namespace - The namespace of the attribute
	 * @param localName - The local name of the attribute
	 */
	public hasAttributeNS(namespace: string | null, localName: string): boolean {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		localName = String(localName);

		// 1. If namespace is the empty string, set it to null.
		// (handled by getAttributeByNamespaceAndLocalName, called below)
		// 2. Return true if this has an attribute whose namespace is namespace and
		// local name is localName, and false otherwise.
		return getAttributeByNamespaceAndLocalName(namespace, localName, this) !== null;
	}

	/**
	 * Returns the specified attribute node, or null if no such attribute exists.
	 *
	 * @param qualifiedName - The qualified name of the attribute
	 *
	 * @returns The attribute, or null if no such attribute exists
	 */
	public getAttributeNode(qualifiedName: string): Attr | null {
		expectArity(arguments, 1);
		qualifiedName = String(qualifiedName);

		return getAttributeByName(qualifiedName, this);
	}

	/**
	 * Returns the specified attribute node, or null if no such attribute exists.
	 *
	 * @param namespace - The namespace of the attribute
	 * @param localName - The local name of the attribute
	 *
	 * @returns The attribute, or null if no such attribute exists
	 */
	public getAttributeNodeNS(namespace: string | null, localName: string): Attr | null {
		expectArity(arguments, 2);
		namespace = asNullableString(namespace);
		localName = String(localName);

		return getAttributeByNamespaceAndLocalName(namespace, localName, this);
	}

	/**
	 * Sets an attribute given its node
	 *
	 * @param attr - The attribute node to set
	 *
	 * @returns The previous attribute node for the attribute
	 */
	public setAttributeNode(attr: Attr): Attr | null {
		expectArity(arguments, 1);
		attr = asObject(attr, Attr);

		return setAttribute(attr, this);
	}

	/**
	 * Sets an attribute given its node
	 *
	 * @param attr - The attribute node to set
	 *
	 * @returns The previous attribute node for the attribute
	 */
	public setAttributeNodeNS(attr: Attr): Attr | null {
		expectArity(arguments, 1);
		attr = asObject(attr, Attr);

		return setAttribute(attr, this);
	}

	/**
	 * Removes an attribute given its node
	 *
	 * @param attr - The attribute node to remove
	 *
	 * @returns The removed attribute node
	 */
	public removeAttributeNode(attr: Attr): Attr {
		expectArity(arguments, 1);
		attr = asObject(attr, Attr);

		// 1. If this’s attribute list does not contain attr, then throw a NotFoundError.
		if (this.attributes.indexOf(attr) < 0) {
			throwNotFoundError('the specified attribute does not exist');
		}

		// 2. Remove attr.
		removeAttribute(attr);

		// 3. Return attr.
		return attr;
	}

	/**
	 * (non-standard) Creates a copy of the given node
	 *
	 * @param document - The node document to associate with the copy
	 * @param other    - The node to copy
	 *
	 * @returns A shallow copy of the node
	 */
	public _copy(document: Document): Element {
		// 2.1. Let copy be the result of creating an element, given document, node’s local name,
		// node’s namespace, node’s namespace prefix, and the value of node’s is attribute if
		// present (or null if not). The synchronous custom elements flag should be unset.
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

	// From the DOM Parsing and Serialization spec

	/**
	 * Returns a fragment of HTML or XML that represents the element's contents.
	 */
	public get innerHTML() {
		// Return the result of invoking the fragment serializing algorithm on this
		// providing true for the require well-formed flag (this might throw an exception instead of
		// returning a string).
		return serializeFragment(this, true);
	}

	/**
	 * Returns a fragment of HTML or XML that represents the element and its contents.
	 */
	public get outerHTML() {
		// Return the result of invoking the fragment serializing algorithm on a fictional node
		// whose only child is this providing true for the require well-formed flag
		// (this might throw an exception instead of returning a string).
		return serializeFragment(this, true, true);
	}
}

/**
 * To create an element, given a document, localName, namespace, and optional prefix, is, and
 * synchronous custom elements flag, run these steps:
 *
 * @param document  - The node document for the new element
 * @param localName - The local name for the new element
 * @param namespace - The namespace URI for the new element, or null for the null namespace
 * @param prefix    - The prefix for the new element, or null for no prefix
 *
 * @returns The new element
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

	// 4. Let definition be the result of looking up a custom element definition given document,
	// namespace, localName, and is.
	// (custom elements not implemented)

	// 5. If definition is non-null, and definition’s name is not equal to its local name (i.e.,
	// definition represents a customized built-in element), then:
	// 5.1. Let interface be the element interface for localName and the HTML namespace.
	// 5.2. Set result to a new element that implements interface, with no attributes, namespace set
	// to the HTML namespace, namespace prefix set to prefix, local name set to localName, custom
	// element state set to "undefined", custom element definition set to null, is value set to is,
	// and node document set to document.
	// 5.3. If the synchronous custom elements flag is set, then run this step while catching any
	// exceptions:
	// 5.3.1. Upgrade element using definition.
	// 5.3.catch. If this step threw an exception, then:
	// 5.3.catch.1. Report the exception.
	// 5.3.catch.2. Set result's custom element state to "failed".
	// 5.4. Otherwise, enqueue a custom element upgrade reaction given result and definition.
	// (custom elements not implemented)

	// 6. Otherwise, if definition is non-null, then:
	// 6.1. If the synchronous custom elements flag is set, then run these steps while catching any
	// exceptions:
	// 6.1.1. Let C be definition’s constructor.
	// 6.1.2. Set result to the result of constructing C, with no arguments.
	// 6.1.3. Assert: result’s custom element state and custom element definition are initialized.
	// 6.1.4. Assert: result’s namespace is the HTML namespace.
	// IDL enforces that result is an HTMLElement object, which all use the HTML namespace.
	// 6.1.5. If result’s attribute list is not empty, then throw a NotSupportedError.
	// 6.1.6. If result has children, then throw a NotSupportedError.
	// 6.1.7. If result’s parent is non-null, then throw a NotSupportedError.
	// 6.1.8. If result’s node document is not document, then throw a NotSupportedError.
	// 6.1.9. If result’s local name is not equal to localName, then throw a NotSupportedError.
	// 6.1.10. Set result’s namespace prefix to prefix.
	// 6.1.11. Set result’s is value to null.
	// If any of these steps threw an exception, then:
	// 6.1.catch.1. Report the exception.
	// 6.1.catch.2. Set result to a new element that implements the HTMLUnknownElement interface,
	// with no attributes, namespace set to the HTML namespace, namespace prefix set to prefix,
	// local name set to localName, custom element state set to "failed", custom element definition
	// set to null, is value set to null, and node document set to document.
	// 6.2. Otherwise:
	// 6.2.1. Set result to a new element that implements the HTMLElement interface, with no
	// attributes, namespace set to the HTML namespace, namespace prefix set to prefix, local name
	// set to localName, custom element state set to "undefined", custom element definition set to
	// null, is value set to null, and node document set to document.
	// 6.2.2. Enqueue a custom element upgrade reaction given result and definition.
	// (custom elements not implemented)

	// 7. Otherwise:
	// 7.1. Let interface be the element interface for localName and namespace.
	// (interfaces other than Element not implemented)

	// 7.2. Set result to a new element that implements interface, with no attributes, namespace set
	// to namespace, namespace prefix set to prefix, local name set to localName, custom element
	// state set to "uncustomized", custom element definition set to null, is value set to is, and
	// node document set to document.
	const context = getContext(document);
	result = new context.Element(namespace, prefix, localName);
	result.ownerDocument = document;

	// If namespace is the HTML namespace, and either localName is a valid custom element name or is
	// is non-null, then set result’s custom element state to "undefined".
	// (custom elements not implemented)

	// Return result.
	return result;
}

/**
 * To get an attribute by name given a qualifiedName and element element, run these steps:
 *
 * @param qualifiedName - The qualified name of the attribute to get
 * @param element       - The element to get the attribute on
 *
 * @returns The first matching attribute, or null otherwise
 */
function getAttributeByName(qualifiedName: string, element: Element): Attr | null {
	// 1. If element is in the HTML namespace and its node document is an HTML document, then set
	// qualifiedName to qualifiedName in ASCII lowercase.
	// (html documents not implemented)

	// 2. Return the first attribute in element’s attribute list whose qualified name is
	// qualifiedName, and null otherwise.
	return element.attributes.find((attr) => attr.name === qualifiedName) || null;
}

/**
 * To get an attribute by namespace and local name given a namespace, localName, and element
 * element, run these steps:
 *
 * @param namespace - Namespace for the attribute
 * @param localName - Local name for the attribute
 * @param element   - The element to get the attribute on
 *
 * @returns The first matching attribute, or null otherwise
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

	// 2. Return the attribute in element’s attribute list whose namespace is namespace and local
	// name is localName, if any, and null otherwise.
	return (
		element.attributes.find(
			(attr) => attr.namespaceURI === namespace && attr.localName === localName
		) || null
	);
}

/**
 * To set an attribute given an attr and element, run these steps:
 *
 * @param attr    - The new attribute to set
 * @param element - The element to set attr on
 *
 * @returns The previous attribute with attr's namespace and local name, or null if there was no such
 *         attribute
 */
function setAttribute(attr: Attr, element: Element): Attr | null {
	// 1. If attr’s element is neither null nor element, throw an InUseAttributeError.
	if (attr.ownerElement !== null && attr.ownerElement !== element) {
		throwInUseAttributeError('attribute is in use by another element');
	}

	// 2. Let oldAttr be the result of getting an attribute given attr’s namespace, attr’s local
	// name, and element.
	const oldAttr = getAttributeByNamespaceAndLocalName(attr.namespaceURI, attr.localName, element);

	// 3. If oldAttr is attr, return attr.
	if (oldAttr === attr) {
		return attr;
	}

	// 4. If oldAttr is non-null, then replace oldAttr with attr.
	if (oldAttr !== null) {
		replaceAttribute(oldAttr, attr);
	} else {
		// 5. Otherwise, append attr to element.
		appendAttribute(attr, element);
	}

	// 6. Return oldAttr.
	return oldAttr;
}

/**
 * To set an attribute value for an element element using a localName and value, and an optional
 * prefix, and namespace, run these steps:
 *
 * @param element   - Element to set the attribute value on
 * @param localName - Local name of the attribute
 * @param value     - New value of the attribute
 * @param prefix    - Prefix of the attribute
 * @param namespace - Namespace of the attribute
 */
function setAttributeValue(
	element: Element,
	localName: string,
	value: string,
	prefix: string | null,
	namespace: string | null
): void {
	// 1. If prefix is not given, set it to null.
	// 2. If namespace is not given, set it to null.
	// (handled by default values)

	// 3. Let attribute be the result of getting an attribute given namespace, localName, and
	// element.
	const attribute = getAttributeByNamespaceAndLocalName(namespace, localName, element);

	// 4. If attribute is null, create an attribute whose namespace is namespace, namespace prefix
	// is prefix, local name is localName, value is value, and node document is element’s node
	// document, then append this attribute to element, and then return.
	if (attribute === null) {
		const context = getContext(element);
		const attribute = new context.Attr(namespace, prefix, localName, value, element);
		attribute.ownerDocument = element.ownerDocument;
		appendAttribute(attribute, element);
		return;
	}

	// 5. Change attribute to value.
	changeAttribute(attribute, value);
}

/**
 * To remove an attribute by name given a qualifiedName and element element, run these steps:
 *
 * @param qualifiedName - Qualified name of the attribute
 * @param element       - The element to remove the attribute from
 *
 * @returns The removed attribute, or null if no matching attribute exists
 */
function removeAttributeByName(qualifiedName: string, element: Element): Attr | null {
	// 1. Let attr be the result of getting an attribute given qualifiedName and element.
	const attr = getAttributeByName(qualifiedName, element);

	// 2. If attr is non-null, then remove attr.
	if (attr !== null) {
		removeAttribute(attr);
	}

	// 3. Return attr.
	return attr;
}

/**
 * To remove an attribute by namespace and local name given a namespace, localName, and element
 * element, run these steps:
 *
 * @param namespace - The namespace of the attribute
 * @param localName - The local name of the attribute
 * @param element   - The element to remove the attribute from
 *
 * @returns The removed attribute, or null if no matching attribute exists
 */
function removeAttributeByNamespaceAndLocalName(
	namespace: string | null,
	localName: string,
	element: Element
): Attr | null {
	// 1. Let attr be the result of getting an attribute given namespace, localName, and element.
	const attr = getAttributeByNamespaceAndLocalName(namespace, localName, element);

	// 2. If attr is non-null, then remove attr.
	if (attr !== null) {
		removeAttribute(attr);
	}

	// 3. Return attr.
	return attr;
}
