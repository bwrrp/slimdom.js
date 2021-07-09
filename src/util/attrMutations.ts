import Attr from '../Attr';
import Element from '../Element';
import queueMutationRecord from '../mutation-observer/queueMutationRecord';

/**
 * To handle attribute changes for an attribute attribute with element, oldValue, and newValue, run
 * these steps:
 *
 * @param attribute - The attribute that is being changed
 * @param element   - The element that has the attribute
 * @param oldValue  - The old value for the attribute
 * @param newValue  - The new value for the attribute
 */
export function handleAttributeChanges(
	attribute: Attr,
	element: Element,
	oldValue: string | null,
	newValue: string | null
): void {
	// 1. Queue a mutation record of "attributes" for element with attribute’s local name,
	// attribute's namespace, oldValue, « », « », null, and null.
	queueMutationRecord('attributes', element, {
		name: attribute.localName,
		namespace: attribute.namespaceURI,
		oldValue,
	});

	// 2. If element is custom, then enqueue a custom element callback reaction with element,
	// callback name "attributeChangedCallback", and an argument list containing attribute’s local
	// name, attribute’s value, value, and attribute’s namespace.
	// (custom elements not implemented)

	// 3. Run the attribute change steps with element, attribute’s local name, oldValue, newValue,
	// and attribute’s namespace.
	// (attribute change steps not implemented)
}

/**
 * To change an attribute attribute to value, run these steps:
 *
 * @param attribute - The attribute to change
 * @param value     - The new value for the attribute
 */
export function changeAttribute(attribute: Attr, value: string): void {
	// 1. Handle attribute changes for attribute with attribute’s element, attribute’s value, and
	// value.
	handleAttributeChanges(attribute, attribute.ownerElement!, attribute.value, value);

	// 2. Set attribute’s value to value.
	(attribute as any)._value = value;
}

/**
 * To append an attribute attribute to an element element, run these steps:
 *
 * @param attribute - The attribute to append
 * @param element   - The element to append attribute to
 */
export function appendAttribute(attribute: Attr, element: Element): void {
	// 1. Handle attribute changes for attribute with element, null and attribute's value.
	handleAttributeChanges(attribute, element, null, attribute.value);

	// 2. Append attribute to element’s attribute list.
	element.attributes.push(attribute);

	// 3. Set attribute’s element to element.
	attribute.ownerElement = element;
}

/**
 * To remove an attribute attribute, run these steps:
 *
 * @param attribute - The attribute to remove
 */
export function removeAttribute(attribute: Attr): void {
	const attributeElement = attribute.ownerElement!;
	// 1. Handle attribute changes for attribute with attribute’s element, attribute’s value, and
	// null.
	handleAttributeChanges(attribute, attributeElement, attribute.value, null);

	// 2. Remove attribute from attribute's element’s attribute list.
	attributeElement.attributes.splice(attributeElement.attributes.indexOf(attribute), 1);

	// 3. Set attribute’s element to null.
	attribute.ownerElement = null;
}

/**
 * To replace an attribute oldAttr with an attribute newAttr, run these steps:
 *
 * @param oldAttr - The attribute to replace
 * @param newAttr - The attribute to replace oldAttr with
 */
export function replaceAttribute(oldAttr: Attr, newAttr: Attr): void {
	const oldAttrElement = oldAttr.ownerElement!;
	// 1. Handle attribute changes for oldAttr with oldAttr’s element, oldAttr’s value,
	// and newAttr’s value.
	handleAttributeChanges(oldAttr, oldAttrElement, oldAttr.value, newAttr.value);

	// 4. Replace oldAttr by newAttr in element’s attribute list.
	oldAttrElement.attributes.splice(oldAttrElement.attributes.indexOf(oldAttr), 1, newAttr);

	// 5. Set newAttr’s element to oldAttr's element.
	newAttr.ownerElement = oldAttrElement;

	// 6. Set oldAttr’s element to null.
	oldAttr.ownerElement = null;
}
