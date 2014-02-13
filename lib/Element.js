/**
 * @module slimdom
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Node',
		'./mutations/MutationRecord',
		'./util'
	],
	function(
		Node,
	 	MutationRecord,
	 	util) {
		'use strict';

		/**
		 * The Element interface represents part of the document. This interface describes methods and properties common
		 * to each kind of elements. Specific behaviors are described in the specific interfaces, inheriting from
		 * Element: the HTMLElement interface for HTML elements, or the SVGElement interface for SVG elements.
		 *
		 * @class Element
		 * @extends Node
		 *
		 * @constructor
		 *
		 * @param {String}  name  The name to use for the new Element object.
		 */
		function Element(name) {
			Node.call(this, Node.ELEMENT_NODE);

			/**
			 * The name of the tag.
			 *
			 * @property nodeName
			 * @type {String}
			 * @readOnly
			 */
			this.nodeName = name;
			this.attributes = [];
			this.attributesByName = {};

			/**
			 * The first child node of the current element that's an Element node.
			 *
			 * @property firstElementChild
			 * @type {Element}
			 * @readOnly
			 */
			this.firstElementChild = null;
			/**
			 * The last child node of the current element that's an Element node.
			 *
			 * @property lastElementChild
			 * @type {Element}
			 * @readOnly
			 */
			this.lastElementChild = null;

			/**
			 * The previous sibling node of the current element that's an Element node.
			 *
			 * @property previousElementSibling
			 * @type {Element}
			 * @readOnly
			 */
			this.previousElementSibling = null;
			/**
			 * The next sibling node of the current element that's an Element node.
			 *
			 * @property nextElementSibling
			 * @type {Element}
			 * @readOnly
			 */
			this.nextElementSibling = null;

			/**
			 * The number of child nodes of the current element that are Element nodes.
			 *
			 * @property childElementCount
			 * @type {Number}
			 * @readOnly
			 */
			this.childElementCount = 0;
		}
		Element.prototype = new Node(Node.ELEMENT_NODE);
		Element.prototype.constructor = Element;

		/**
		 * Internal helper used to check if the given node is an Element object.
		 *
		 * @method isElement
		 * @static
		 * @private
		 * 
		 * @param  {Object}  node  The object to check the type of.
		 *
		 * @return {Boolean} Returns whether or not the given node is an Element object.
		 */
		function isElement(node) {
			return !!node && node.nodeType === Node.ELEMENT_NODE;
		}

		/**
		 * Returns the first element sibling in the given direction: if it's backwards it's the first previousSibling
		 * node starting from the given node that's an Element, if it's forwards it's the first nextSibling node that's
		 * an Element.
		 *
		 * @method findNextElementSibling
		 * @static
		 * @private
		 *
		 * @param  {Object}        node       The object to check the type of.
		 * @param  {Boolean}       backwards  Whether or not to search backwards (using previousSibling or nextSibling).
		 *
		 * @return {null|Element}  The first element sibling in the given direction.
		 */
		function findNextElementSibling(node, backwards) {
			while (node) {
				node = backwards ? node.previousSibling : node.nextSibling;
				if (isElement(node))
					break;
			}
			return node;
		}

		/**
		 * Overrides insertBefore to update the element specific attributes accordingly.
		 *
		 * @method insertBefore
		 *
		 * @param  {Node}       newNode            The node that is inserted.
		 * @param  {Node}       referenceNode      The node in front of which the given newNode is inserted.
		 * @param  {Boolean}    suppressObservers  Whether or not to suppress creating any MutationRecords for the
		 * changes that occur by executing this insertBefore operation.
		 *
		 * @return {null|Node}  The inserted node or null if something went wrong.
		 */
		Element.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			// Already there?
			if (newNode.parentNode === this && (newNode === referenceNode || newNode.nextSibling === referenceNode))
				return newNode;

			var result = Node.prototype.insertBefore.call(this, newNode, referenceNode, suppressObservers);

			if (isElement(newNode) && newNode.parentNode === this) {
				// Update child references
				this.firstElementChild = findNextElementSibling(this.firstElementChild, true) || this.firstElementChild || newNode;
				this.lastElementChild = findNextElementSibling(this.lastElementChild, false) || this.lastElementChild || newNode;

				// Update sibling references
				newNode.previousElementSibling = findNextElementSibling(newNode, true);
				if (newNode.previousElementSibling)
					newNode.previousElementSibling.nextElementSibling = newNode;
				newNode.nextElementSibling = findNextElementSibling(newNode, false);
				if (newNode.nextElementSibling)
					newNode.nextElementSibling.previousElementSibling = newNode;

				// Update element count
				this.childElementCount += 1;
			}

			return result;
		};

		/**
		 * Overrides removeChild to update the element specific attributes accordingly.
		 *
		 * @method removeChild
		 *
		 * @param  {Node}       childNode          The child of the current node to remove.
		 * @param  {Boolean}    suppressObservers  Whether or not any MutationObservers on the affected nodes are
		 * notified.
		 *
		 * @return {null|Node}  The removed node or null if something went wrong.
		 */
		Element.prototype.removeChild = function(childNode, suppressObservers) {
			if (isElement(childNode) && childNode.parentNode === this) {
				// Update child references
				if (childNode === this.firstElementChild)
					this.firstElementChild = findNextElementSibling(childNode, false);
				if (childNode === this.lastElementChild)
					this.lastElementChild = findNextElementSibling(childNode, true);

				// Update sibling references
				if (childNode.previousElementSibling)
					childNode.previousElementSibling.nextElementSibling = childNode.nextElementSibling;
				if (childNode.nextElementSibling)
					childNode.nextElementSibling.previousElementSibling = childNode.previousElementSibling;

				// Update element count
				this.childElementCount -= 1;
			}

			return Node.prototype.removeChild.call(this, childNode, suppressObservers);
		};

		/**
		 * Returns whether or not the element has an attribute with the given name.
		 *
		 * @method hasAttribute
		 *
		 * @param  {String}   name  The name of the attribute to search for.
		 *
		 * @return {Boolean}  Whether or not the element has an attribute with the given name.
		 */
		Element.prototype.hasAttribute = function(name) {
			return !!this.attributesByName[name];
		};

		/**
		 * Returns the value of the attribute with the given name for the current element or null if the attribute
		 * doesn't exist.
		 *
		 * @method hasAttribute
		 *
		 * @param  {String}    name  The name of the attribute to search for.
		 *
		 * @return {null|any}  The value of the attribute.
		 */
		Element.prototype.getAttribute = function(name) {
			var attr = this.attributesByName[name];
			return attr ? attr.value : null;
		};

		/**
		 * Sets the value of the attribute with the given name to the given value for the current element or null if the
		 * attribute doesn't exist.
		 *
		 * @method setAttribute
		 *
		 * @param  {String}    name   The name of the attribute to set.
		 * @param  {String}    value  The value to set the attribute to.
		 */
		Element.prototype.setAttribute = function(name, value) {
			// Coerce the value to a string for consistency
			value = '' + value;

			var oldAttr = this.attributesByName[name],
				newValue = {
					name: name,
					value: value
				},
				oldValue = oldAttr ? oldAttr.value : null;

			// No need to trigger observers if the value doesn't actually change
			if (value === oldValue)
				return;

			// Queue a mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = name;
			record.oldValue = oldValue;
			util.queueMutationRecord(record);

			// Set value
			if (oldAttr) {
				oldAttr.value = value;
			} else {
				this.attributesByName[name] = newValue;
				this.attributes.push(newValue);
			}
		};

		/**
		 * Removes the attribute with the given name.
		 *
		 * @method removeAttribute
		 *
		 * @param  {String}    name   The name of the attribute to remove.
		 */
		Element.prototype.removeAttribute = function(name) {
			var attr = this.attributesByName[name];
			if (!attr)
				return;

			// Queue mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = attr.name;
			record.oldValue = attr.value;
			util.queueMutationRecord(record);

			// Remove the attribute
			delete this.attributesByName[name];
			this.attributes.splice(_.indexOf(this.attributes, attr), 1);
		};

		/**
		 * Override cloneNode to pass a new Element as a shallow copy to ensure the cloned node that is returned is an
		 * Element node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new Element node with the same nodeName as the current Element.
		 *
		 * @return {Node}     The clone.
		 */
		Element.prototype.cloneNode = function(deep, copy) {
			copy = copy || new Element(this.nodeName);

			// Copy attributes
			for (var i = 0, l = this.attributes.length; i < l; ++i) {
				var attr = this.attributes[i];
				copy.setAttribute(attr.name, attr.value);
			}

			// Recurse
			return Node.prototype.cloneNode.call(this, deep, copy);
		};

		return Element;
	}
);
