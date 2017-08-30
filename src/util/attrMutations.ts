import Attr from '../Attr';
import Element from '../Element';
import queueMutationRecord from '../mutation-observer/queueMutationRecord';

/**
 * To change an attribute attribute from an element element to value, run these steps:
 *
 * @param attribute The attribute to change
 * @param element   The element that has the attribute
 * @param value     The new value for the attribute
 */
export function changeAttribute(attribute: Attr, element: Element, value: string): void {
	// 1. Queue a mutation record of "attributes" for element with name attribute’s local name,
	// namespace attribute’s namespace, and oldValue attribute’s value.
	queueMutationRecord('attributes', element, {
		name: attribute.localName,
		namespace: attribute.namespaceURI,
		oldValue: attribute.value
	});

	// 2. If element is custom, then enqueue a custom element callback reaction with element,
	// callback name "attributeChangedCallback", and an argument list containing attribute’s local
	// name, attribute’s value, value, and attribute’s namespace.
	// (custom elements not implemented)

	// 3. Run the attribute change steps with element, attribute’s local name, attribute’s value,
	// value, and attribute’s namespace.
	// (attribute change steps not implemented)

	// 4. Set attribute’s value to value.
	(attribute as any)._value = value;
}

/**
 * To append an attribute attribute to an element element, run these steps:
 *
 * @param attribute The attribute to append
 * @param element   The element to append attribute to
 */
export function appendAttribute(attribute: Attr, element: Element): void {
	// 1. Queue a mutation record of "attributes" for element with name attribute’s local name,
	// namespace attribute’s namespace, and oldValue null.
	queueMutationRecord('attributes', element, {
		name: attribute.localName,
		namespace: attribute.namespaceURI,
		oldValue: null
	});

	// 2. If element is custom, then enqueue a custom element callback reaction with element,
	// callback name "attributeChangedCallback", and an argument list containing attribute’s local
	// name, null, attribute’s value, and attribute’s namespace.
	// (custom elements not implemented)

	// 3. Run the attribute change steps with element, attribute’s local name, null, attribute’s
	// value, and attribute’s namespace.
	// (attribute change steps not implemented)

	// 4. Append attribute to element’s attribute list.
	element.attributes.push(attribute);

	// 5. Set attribute’s element to element.
	attribute.ownerElement = element;
}

/**
 * To remove an attribute attribute from an element element, run these steps:
 *
 * @param attribute The attribute to remove
 * @param element   The element to remove attribute from
 */
export function removeAttribute(attribute: Attr, element: Element): void {
	// 1. Queue a mutation record of "attributes" for element with name attribute’s local name,
	// namespace attribute’s namespace, and oldValue attribute’s value.
	queueMutationRecord('attributes', element, {
		name: attribute.localName,
		namespace: attribute.namespaceURI,
		oldValue: attribute.value
	});

	// 2. If element is custom, then enqueue a custom element callback reaction with element,
	// callback name "attributeChangedCallback", and an argument list containing attribute’s local
	// name, attribute’s value, null, and attribute’s namespace.
	// (custom elements not implemented)

	// 3. Run the attribute change steps with element, attribute’s local name, attribute’s value,
	// null, and attribute’s namespace.
	// (attribute change steps not implemented)

	// 4. Remove attribute from element’s attribute list.
	element.attributes.splice(element.attributes.indexOf(attribute), 1);

	// 5. Set attribute’s element to null.
	attribute.ownerElement = null;
}

/**
 * To replace an attribute oldAttr by an attribute newAttr in an element element, run these steps:
 *
 * @param oldAttr The attribute to replace
 * @param newAttr The attribute to replace oldAttr with
 * @param element The element on which to replace the attribute
 */
export function replaceAttribute(oldAttr: Attr, newAttr: Attr, element: Element): void {
	// 1. Queue a mutation record of "attributes" for element with name oldAttr’s local name,
	// namespace oldAttr’s namespace, and oldValue oldAttr’s value.
	queueMutationRecord('attributes', element, {
		name: oldAttr.localName,
		namespace: oldAttr.namespaceURI,
		oldValue: oldAttr.value
	});

	// 2. If element is custom, then enqueue a custom element callback reaction with element,
	// callback name "attributeChangedCallback", and an argument list containing oldAttr’s local
	// name, oldAttr’s value, newAttr’s value, and oldAttr’s namespace.
	// (custom elements not implemented)

	// 3. Run the attribute change steps with element, oldAttr’s local name, oldAttr’s value,
	// newAttr’s value, and oldAttr’s namespace.
	// (attribute change steps not implemented)

	// 4. Replace oldAttr by newAttr in element’s attribute list.
	element.attributes.splice(element.attributes.indexOf(oldAttr), 1, newAttr);

	// 5. Set oldAttr’s element to null.
	oldAttr.ownerElement = null;

	// 6. Set newAttr’s element to element.
	newAttr.ownerElement = element;
}
