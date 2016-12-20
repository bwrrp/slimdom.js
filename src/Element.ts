import Node from './Node';

import MutationRecord from './mutations/MutationRecord';
import queueMutationRecord from './mutations/queueMutationRecord';

export interface Attr {
	name: string;
	value: string;
}

/**
 * Internal helper used to check if the given node is an Element object.
 */
function isElement (node) {
	return !!node && node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Returns the first element sibling in the given direction: if it's backwards it's the first previousSibling
 * node starting from the given node that's an Element, if it's forwards it's the first nextSibling node that's
 * an Element.
 */
function findNextElementSibling (node: Node | null, backwards: boolean): Element | null {
	while (node) {
		node = backwards ? node.previousSibling : node.nextSibling;
		if (isElement(node)) {
			break;
		}
	}

	return node as Element;
}

/**
 * The Element interface represents part of the document. This interface describes methods and properties common
 * to each kind of elements. Specific behaviors are described in the specific interfaces, inheriting from
 * Element: the HTMLElement interface for HTML elements, or the SVGElement interface for SVG elements.
 */
export default class Element extends Node {
	/**
	 * The name of the element.
	 */
	public nodeName: string;

	/**
	 * The attributes as an array of Attr objects, having name and value.
	 */
	public attributes: Attr[] = [];

	/**
	 * Internal lookup of Attr objects by their name.
	 */
	private _attrByName: { [key: string]: Attr } = {};

	/**
	 * The first child node of the current element that's an Element node.
	 */
	public firstElementChild: Element | null = null;

	/**
	 * The last child node of the current element that's an Element node.
	 */
	public lastElementChild: Element | null = null;

	/**
	 * The previous sibling node of the current element that's an Element node.
	 */
	public previousElementSibling: Element | null = null;

	/**
	 * The next sibling node of the current element that's an Element node.
	 */
	public nextElementSibling: Element | null = null;

	/**
	 * The number of child nodes of the current element that are Element nodes.
	 */
	public childElementCount: number = 0;

	constructor (name) {
		super(Node.ELEMENT_NODE);

		this.nodeName = name;
	}

	// Override insertBefore to update element-specific properties
	public insertBefore (newNode: Node, referenceNode: Node | null, _suppressObservers: boolean = false) {
		// Already there?
		if (newNode.parentNode === this && (newNode === referenceNode || newNode.nextSibling === referenceNode)) {
			return newNode;
		}

		const result = super.insertBefore(newNode, referenceNode, _suppressObservers);

		if (isElement(newNode) && newNode.parentNode === this) {
			const newElement = newNode as Element;
			// Update child references
			this.firstElementChild = findNextElementSibling(this.firstElementChild, true) || this.firstElementChild || newElement;
			this.lastElementChild = findNextElementSibling(this.lastElementChild, false) || this.lastElementChild || newElement;

			// Update sibling references
			newElement.previousElementSibling = findNextElementSibling(newNode, true);
			if (newElement.previousElementSibling) {
				newElement.previousElementSibling.nextElementSibling = newElement;
			}
			newElement.nextElementSibling = findNextElementSibling(newNode, false);
			if (newElement.nextElementSibling) {
				newElement.nextElementSibling.previousElementSibling = newElement;
			}

			// Update element count
			this.childElementCount += 1;
		}

		return result;
	}

	// Override removeChild to update element-specific properties
	public removeChild (childNode: Node, _suppressObservers: boolean = false) {
		if (isElement(childNode) && childNode.parentNode === this) {
			const childElement = childNode as Element;
			// Update child references
			if (childNode === this.firstElementChild) {
				this.firstElementChild = findNextElementSibling(childNode, false);
			}
			if (childNode === this.lastElementChild) {
				this.lastElementChild = findNextElementSibling(childNode, true);
			}

			// Update sibling references
			if (childElement.previousElementSibling) {
				childElement.previousElementSibling.nextElementSibling = childElement.nextElementSibling;
			}
			if (childElement.nextElementSibling) {
				childElement.nextElementSibling.previousElementSibling = childElement.previousElementSibling;
			}

			// Update element count
			this.childElementCount -= 1;
		}

		return super.removeChild(childNode, _suppressObservers);
	}

	/**
	 * Returns whether or not the element has an attribute with the given name.
	 */
	public hasAttribute (name: string): boolean {
		return !!this._attrByName[name];
	}

	/**
	 * Returns the value of the attribute with the given name for the current element or null if the attribute
	 * doesn't exist.
	 */
	public getAttribute (name: string): string | null {
		const attr = this._attrByName[name];
		return attr ? attr.value : null;
	}

	/**
	 * Sets the value of the attribute with the given name to the given value.
	 */
	public setAttribute (name: string, value: string) {
		// Coerce the value to a string for consistency
		value = '' + value;

		const oldAttr = this._attrByName[name];
		const newAttr = {
			name: name,
			value: value
		};
		const oldValue = oldAttr ? oldAttr.value : null;

		// No need to trigger observers if the value doesn't actually change
		if (value === oldValue) {
			return;
		}

		// Queue a mutation record
		const record = new MutationRecord('attributes', this);
		record.attributeName = name;
		record.oldValue = oldValue;
		queueMutationRecord(record);

		// Set value
		if (oldAttr) {
			oldAttr.value = value;
		} 
		else {
			this._attrByName[name] = newAttr;
			this.attributes.push(newAttr);
		}
	}

	/**
	 * Removes the attribute with the given name.
	 */
	public removeAttribute (name: string) {
		const attr = this._attrByName[name];
		if (!attr) {
			return;
		}

		// Queue mutation record
		const record = new MutationRecord('attributes', this);
		record.attributeName = attr.name;
		record.oldValue = attr.value;
		queueMutationRecord(record);

		// Remove the attribute
		delete this._attrByName[name];
		const attrIndex = this.attributes.indexOf(attr);
		this.attributes.splice(attrIndex, 1);
	}

	public cloneNode (deep: boolean = true, _copy: Node = null) {
		const copyElement = _copy as Element || new Element(this.nodeName);

		// Copy attributes
		this.attributes.forEach(attr => copyElement.setAttribute(attr.name, attr.value));

		return super.cloneNode(deep, copyElement);
	}
}
