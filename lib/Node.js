/**
 * @module slimdom
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./mutations/MutationRecord',
		'./mutations/RegisteredObservers',
		'./util',

		'lodash'
	],
	function(
		MutationRecord,
		RegisteredObservers,
		util,

		_,
		undefined) {
		'use strict';

		/**
		 * A Node is a class from which a number of DOM types inherit, and allows these various types to be treated
		 * (or tested) similarly.
		 *
		 * The following classes all inherit from Node its methods and properties: Document, Element, CharacterData
		 * (which Text inherit) and ProcessingInstruction.
		 *
		 * @class Node
		 *
		 * @constructor
		 *
		 * @param type {Number} An unsigned short (integer) representing the type of the node. Possible values are:
		 *
		 *     Node.prototype.ELEMENT_NODE                = Node.ELEMENT_NODE                = 1;
		 *     Node.prototype.TEXT_NODE                   = Node.TEXT_NODE                   = 3;
		 *     Node.prototype.PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE = 7;
		 *     Node.prototype.DOCUMENT_NODE               = Node.DOCUMENT_NODE               = 9;
		 */
		function Node(type) {
			/**
			 * An unsigned short (integer) representing the type of the node. Possible values are:
			 *
			 *     Node.prototype.ELEMENT_NODE                = Node.ELEMENT_NODE                = 1;
			 *     Node.prototype.TEXT_NODE                   = Node.TEXT_NODE                   = 3;
			 *     Node.prototype.PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE = 7;
			 *     Node.prototype.DOCUMENT_NODE               = Node.DOCUMENT_NODE               = 9;
			 *
			 * @property nodeType
			 * @type {Number}
			 * @final
			 */
			this.nodeType = type;

			/**
			 * The parent node of the current node.
			 *
			 * @property parentNode
			 * @type {Node}
			 * @final
			 */
			this.parentNode = null;

			/**
			 * The next sibling node of the current node (on the right, could be a Text node).
			 *
			 * @property nextSibling
			 * @type {Node}
			 * @final
			 */
			this.nextSibling = null;
			/**
			 * The next sibling node of the current node (on the left, could be a Text node).
			 *
			 * @property previousSibling
			 * @type {Node}
			 * @final
			 */
			this.previousSibling = null;

			/**
			 * A list of childNodes (including Text nodes) of this node.
			 *
			 * @property childNodes
			 * @type {Node[]}
			 * @final
			 */
			this.childNodes = [];
			/**
			 * The first child node of the current node.
			 *
			 * @property firstChild
			 * @final
			 * @type {Node}
			 */
			this.firstChild = null;
			/**
			 * The last child node of the current node.
			 *
			 * @property lastChild
			 * @type {Node}
			 * @final
			 */
			this.lastChild = null;

			/**
			 * A reference to the Document node in which the current node resides.
			 *
			 * @property ownerDocument
			 * @type {Node}
			 * @final
			 */
			this.ownerDocument = null;

			// User data, use get/setUserData to access
			this.userData = [];
			this.userDataByKey = {};

			// Registered mutation observers, use MutationObserver interface to manipulate
			this.registeredObservers = new RegisteredObservers(this);
		}

		/**
		 * Indicates the node is an element node (meaning it's an instance of the Element class).
		 *
		 * @property ELEMENT_NODE
		 * @type {Number}
		 * @final
		 */
		Node.prototype.ELEMENT_NODE = 1;
		/**
		 * Indicates the node is an element node.
		 *
		 * @property ELEMENT_NODE
		 * @type {Number}
		 * @static
		 * @final
		 */
		Node.ELEMENT_NODE = 1;

		/**
		 * Indicates the node is a text node (meaning it's an instance of the Text class).
		 *
		 * @property TEXT_NODE
		 * @type {Number}
		 * @final
		 */
		Node.prototype.TEXT_NODE = 3;
		/**
		 * Indicates the node is a text node.
		 *
		 * @property TEXT_NODE
		 * @type {Number}
		 * @static
		 * @final
		 */
		Node.TEXT_NODE = 3;

		/**
		 * Indicates the node is a processing instruction node (meaning it's an instance of the ProcessingInstruction
		 * class).
		 *
		 * @property PROCESSING_INSTRUCTION_NODE
		 * @type {Number}
		 * @final
		 */
		Node.prototype.PROCESSING_INSTRUCTION_NODE = 7;
		/**
		 * Indicates the node is a processing instruction node.
		 *
		 * @property PROCESSING_INSTRUCTION_NODE
		 * @type {Number}
		 * @static
		 * @final
		 */
		Node.PROCESSING_INSTRUCTION_NODE = 7;

		/**
		 * Indicates the node is a document node (meaning it's an instance of the Document class).
		 *
		 * @property DOCUMENT_NODE
		 * @type {Number}
		 * @final
		 */
		Node.prototype.DOCUMENT_NODE = 9;
		/**
		 * Indicates the node is a processing instruction node.
		 *
		 * @property DOCUMENT_NODE
		 * @type {Number}
		 * @final
		 * @static
		 */
		Node.DOCUMENT_NODE = 9;

		/**
		 * Internal helper used to update the firstChild and lastChild references.
		 *
		 * @method updateFirstLast
		 * @private
		 */
		function updateFirstLast() {
			this.firstChild = this.childNodes[0] || null;
			this.lastChild = this.childNodes[this.childNodes.length - 1] || null;
		}

		/**
		 * Internal helper used to update the nextSibling and previousSibling references.
		 *
		 * @method updateSiblings
		 * @private
		 *
		 * @param {Number}  index  Indicates the index of the node whose sibling references to update.
		 */
		function updateSiblings(index) {
			if (!this.parentNode) {
				// Node has been removed
				if (this.nextSibling) this.nextSibling.previousSibling = this.previousSibling;
				if (this.previousSibling) this.previousSibling.nextSibling = this.nextSibling;
				this.nextSibling = null;
				this.previousSibling = null;
				return;
			}

			this.nextSibling = this.parentNode.childNodes[index + 1] || null;
			this.previousSibling = this.parentNode.childNodes[index - 1] || null;

			if (this.nextSibling) this.nextSibling.previousSibling = this;
			if (this.previousSibling) this.previousSibling.nextSibling = this;
		}

		/**
		 * Adds a node to the end of the list of children of a specified parent node.
		 * If the node already exists it is removed from current parent node, then added to new parent node.
		 *
		 * @method appendChild
		 *
		 * @param  {Node}       childNode  The node to append.
		 *
		 * @return {null|Node}  The appended node or null if something went wrong.
		 */
		//
		Node.prototype.appendChild = function(childNode) {
			return this.insertBefore(childNode, null);
		};

		/**
		 * Indicates whether the given node is a descendant of the current node.
		 *
		 * @method contains
		 *
		 * @param  {Node}     childNode  The node to test as a descendant of the current node.
		 *
		 * @return {boolean}  Whether or not the given node is a descendant of the current node.
		 */
		Node.prototype.contains = function(childNode) {
			while (childNode && childNode != this) {
				childNode = childNode.parentNode;
			}
			return childNode == this;
		};

		/**
		 * Internal helper used to adopt a given node into a given document.
		 *
		 * @method adopt
		 * @static
		 * @private
		 *
		 * @param {Node}      node      The node whose ownerDocument property will be set to the given document.
		 * @param {Document}  document  The document that will be used as the ownerDocument of the given node.
		 */
		function adopt(node, document) {
			node.ownerDocument = document;
			for (var i = 0, l = node.childNodes.length; i < l; ++i) {
				adopt(node.childNodes[i], document);
			}
		}

		/**
		 * Inserts the specified node before a reference node as a child of the current node.
		 * If referenceNode is null, the new node is appended after the last child node of the current node.
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
		Node.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			// Check if referenceNode is a child
			if (referenceNode && referenceNode.parentNode !== this)
				return null;

			// Fix using the new node as a reference
			if (referenceNode === newNode)
				referenceNode = newNode.nextSibling;

			// Already there?
			if (newNode.parentNode === this && newNode.nextSibling === referenceNode)
				return newNode;

			// Detach from old parent
			if (newNode.parentNode) {
				// This removal is never suppressed
				newNode.parentNode.removeChild(newNode, false);
			}

			// Adopt nodes into document
			if (newNode.ownerDocument !== this.ownerDocument) {
				adopt(newNode, this.ownerDocument);
			}

			// Check index of reference node
			var index = referenceNode ?
				_.indexOf(this.childNodes, referenceNode) :
				this.childNodes.length;
			if (index < 0) return null;

			// Update ranges
			var document = this.ownerDocument || this;
			for (var iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
				var range = document.ranges[iRange];
				if (range.startContainer === this && range.startOffset > index)
					range.startOffset += 1;
				if (range.endContainer === this && range.endOffset > index)
					range.endOffset += 1;
			}

			// Queue mutation record
			if (!suppressObservers) {
				var record = new MutationRecord('childList', this);
				record.addedNodes.push(newNode);
				record.nextSibling = referenceNode;
				record.previousSibling = referenceNode ? referenceNode.previousSibling : this.lastChild;
				util.queueMutationRecord(record);
			}

			// Insert the node
			newNode.parentNode = this;
			this.childNodes.splice(index, 0, newNode);
			updateFirstLast.call(this);
			updateSiblings.call(newNode, index);

			return newNode;
		};

		/**
		 * Puts the specified node and all of its subtree into a "normalized" form.
		 * In a normalized subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		 *
		 * @method normalize
		 *
		 * @param {Boolean}  [recurse=true]  Whether or not to normalize the children of the current node as well.
		 */
		// In a normalized subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		Node.prototype.normalize = function(recurse) {
			if (recurse === undefined)
				recurse = true;
			var childNode = this.firstChild,
				index = 0,
				document = this.ownerDocument || this;
			while (childNode) {
				var nextNode = childNode.nextSibling;
				if (childNode.nodeType == Node.TEXT_NODE) {
					// Delete empty text nodes
					var length = childNode.length();
					if (!length) {
						childNode.parentNode.removeChild(childNode);
						--index;
					} else {
						// Concatenate and collect childNode's contiguous text nodes (excluding current)
						var data = '',
							siblingsToRemove = [],
							siblingIndex, sibling;
						for (sibling = childNode.nextSibling, siblingIndex = index;
							sibling && sibling.nodeType == Node.TEXT_NODE;
							sibling = sibling.nextSibling, ++siblingIndex) {

							data += sibling.nodeValue;
							siblingsToRemove.push(sibling);
						}
						// Append concatenated data, if any
						if (data) {
							childNode.appendData(data);
						}
						// Fix ranges
						for (sibling = childNode.nextSibling, siblingIndex = index + 1;
							sibling && sibling.nodeType == Node.TEXT_NODE;
							sibling = sibling.nextSibling, ++siblingIndex) {

							for (var iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
								var range = document.ranges[iRange];
								if (range.startContainer === sibling)
									range.setStart(childNode, length + range.startOffset);
								if (range.startContainer === this && range.startOffset == siblingIndex)
									range.setStart(childNode, length);
								if (range.endContainer === sibling)
									range.setEnd(childNode, length + range.endOffset);
								if (range.endContainer === this && range.endOffset == siblingIndex)
									range.setEnd(childNode, length);
							}

							length += sibling.length();
						}
						// Remove contiguous text nodes (excluding current) in tree order
						while (siblingsToRemove.length) {
							this.removeChild(siblingsToRemove.shift());
						}
						// Update next node to process
						nextNode = childNode.nextSibling;
					}
				} else if (recurse) {
					// Recurse
					childNode.normalize();
				}
				// Move to next node
				childNode = nextNode;
				++index;
			}
		};

		/**
		 * Removes a child node from the DOM and returns the removed node.
		 *
		 * @method removeChild
		 *
		 * @param  {Node}       childNode          The child of the current node to remove.
		 * @param  {Boolean}    suppressObservers  Whether or not any MutationObservers on the affected nodes are notified.
		 *
		 * @return {null|Node}  Returns the removed node or null if something went wrong.
		 */
		Node.prototype.removeChild = function(childNode, suppressObservers) {
			// Check index of node
			var index = _.indexOf(this.childNodes, childNode);
			if (index < 0) return null;

			// Update ranges
			var document = this.ownerDocument || this;
			for (var iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
				var range = document.ranges[iRange];
				if (childNode.contains(range.startContainer)) {
					range.setStart(this, index);
				}
				if (childNode.contains(range.endContainer)) {
					range.setEnd(this, index);
				}
				if (range.startContainer === this && range.startOffset > index)
					range.startOffset -= 1;
				if (range.endContainer === this && range.endOffset > index)
					range.endOffset -= 1;
			}

			// Queue mutation record
			if (!suppressObservers) {
				var record = new MutationRecord('childList', this);
				record.removedNodes.push(childNode);
				record.nextSibling = childNode.nextSibling;
				record.previousSibling = childNode.previousSibling;
				util.queueMutationRecord(record);
			}

			// Add transient registered observers to detect changes in the removed subtree
			for (var ancestor = this; ancestor; ancestor = ancestor.parentNode) {
				childNode.registeredObservers.appendTransientsForAncestor(ancestor.registeredObservers);
			}

			// Remove the node
			childNode.parentNode = null;
			this.childNodes.splice(index, 1);
			updateFirstLast.call(this);
			updateSiblings.call(childNode, index);

			return childNode;
		};

		/**
		 * Replaces the given oldChild node with the given newChild node and returns the node that was replaced
		 * (i.e. oldChild).
		 *
		 * @method replaceChild
		 *
		 * @param  {Node}       newChild  The node that will replace the given oldChild node.
		 * @param  {Node}       oldChild  The node that is replaced with the given newChild node. Has to be an actual
		 * child of the current node.
		 *
		 * @return {null|Node}  The node that was replaced (i.e. oldChild).
		 */
		Node.prototype.replaceChild = function(newChild, oldChild) {
			// Check if oldChild is a child
			if (oldChild.parentNode !== this)
				return null;

			// Already there?
			if (newChild === oldChild)
				return oldChild;

			// Get reference node for insert
			var referenceNode = oldChild.nextSibling;
			if (referenceNode === newChild) referenceNode = newChild.nextSibling;

			// Detach from old parent
			if (newChild.parentNode) {
				// This removal is never suppressed
				newChild.parentNode.removeChild(newChild, false);
			}

			// Adopt nodes into document
			if (newChild.ownerDocument !== this.ownerDocument) {
				adopt(newChild, this.ownerDocument);
			}

			// Create mutation record
			var record = new MutationRecord('childList', this);
			record.addedNodes.push(newChild);
			record.removedNodes.push(oldChild);
			record.nextSibling = referenceNode;
			record.previousSibling = oldChild.previousSibling;

			// Remove old child
			this.removeChild(oldChild, true);

			// Insert new child
			this.insertBefore(newChild, referenceNode, true);

			// Queue mutation record
			util.queueMutationRecord(record);

			return oldChild;
		};

		/**
		 * Retrieves the object associated to a key on this node.
		 *
		 * @method getUserData
		 *
		 * @param  {String}    key  The key under which to retrieve the data.
		 *
		 * @return {null|any}  The data that was stored under the given key or null if nothing was found.
		 */
		Node.prototype.getUserData = function(key) {
			var data = this.userDataByKey[key];
			if (data === undefined)
				return null;

			return data.value;
		};

		/**
		 * Retrieves the object associated to a key on this node. User data allows a user to attach (or remove) data to
		 * an element, without needing to modify the DOM. Note that such data will not be preserved when imported via
		 * Node.importNode, as with Node.cloneNode() and Node.renameNode() operations (though Node.adoptNode does
		 * preserve the information), and equality tests in Node.isEqualNode() do not consider user data in making the
		 * assessment.
		 *
		 * This method offers the convenience of associating data with specific nodes without needing to alter the
		 * structure of a document and in a standard fashion, but it also means that extra steps may need to be taken
		 * if one wishes to serialize the information or include the information upon clone, import, or rename
		 * operations.
		 *
		 * @method setUserData
		 *
		 * @param  {String}    key   The key under which to store the given data.
		 * @param  {any}       data  The data to store under the given key.
		 *
		 * @return {null|any}  The <em>old</em> data that was stored under the given key or null if nothing was found.
		 */
		Node.prototype.setUserData = function(key, data) {
			var oldData = this.userDataByKey[key],
				newData = {
					name: key,
					value: data
				},
				oldValue = null;

			// No need to trigger observers if the value doesn't actually change
			if (oldData) {
				oldValue = oldData.value;
				if (oldValue === data)
					return oldValue;

				if (data === undefined || data === null) {
					// Remove user data
					delete this.userDataByKey[key];
					this.userData.splice(_.indexOf(this.userData, oldData), 1);
				} else {
					// Overwrite data
					oldData.value = data;
				}
			} else {
				this.userDataByKey[key] = newData;
				this.userData.push(newData);
			}

			// Queue a mutation record (non-standard, but useful)
			var record = new MutationRecord('userData', this);
			record.attributeName = key;
			record.oldValue = oldValue;
			util.queueMutationRecord(record);

			return oldValue;
		};

		/**
		 * Returns a copy of the current node.
		 * Override on subclasses and pass a shallow copy of the node in the 'copy' parameter (I.e. they create a new
		 * instance of their class with their specific constructor parameters.)
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     copy         Usually only specified by a subclass, not a client calling this method.
		 *
		 * @return {Node}     The clone.
		 */
		Node.prototype.cloneNode = function(deep, copy) {
			if (!copy)
				return null;

			// Set owner document
			if (copy.nodeType !== Node.DOCUMENT_NODE)
				copy.ownerDocument = this.ownerDocument;

			// User data is a shallow copy
			for (var i = 0, l = this.userData.length; i < l; ++i) {
				var data = this.userData[i];
				copy.setUserData(data.name, data.value);
			}

			// Recurse if required
			if (deep || deep === undefined) {
				for (var child = this.firstChild; child; child = child.nextSibling) {
					copy.appendChild(child.cloneNode(true));
				}
			}

			return copy;
		};

		return Node;
	}
);
