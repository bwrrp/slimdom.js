if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./mutations/mutationrecord',
		'./mutations/registeredobservers',
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

		// DOM Node
		function Node(type) {
			this.nodeType = type;

			// Parent
			this.parentNode = null;

			// Siblings
			this.nextSibling = null;
			this.previousSibling = null;

			// Child nodes
			this.childNodes = [];
			this.firstChild = this.lastChild = null;

			// User data, use get/setUserData to access
			this.userData = {};

			// Registered mutation observers, use MutationObserver interface to manipulate
			this.registeredObservers = new RegisteredObservers(this);
		}

		// Node type constants - not all DOM standard node types are supported
		Node.prototype.ELEMENT_NODE                = Node.ELEMENT_NODE                = 1;
		Node.prototype.TEXT_NODE                   = Node.TEXT_NODE                   = 3;
		Node.prototype.PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE = 7;
		Node.prototype.DOCUMENT_NODE               = Node.DOCUMENT_NODE               = 9;

		// Internal helper used to update the firstChild and lastChild references.
		function updateFirstLast() {
			this.firstChild = this.childNodes[0] || null;
			this.lastChild = this.childNodes[this.childNodes.length - 1] || null;
		}

		// Internal helper used to update the nextSibling and previousSibling references.
		function updateSiblings(index) {
			if (!this.parentNode) {
				// Node has been removed
				if (this.nextSibling) this.nextSibling.previousSibling = this.previousSibling;
				if (this.previousSibling) this.previousSibling.nextSibling = this.nextSibling;
				this.nextSibling = this.previousSibling = null;
				return;
			}

			this.nextSibling = this.parentNode.childNodes[index + 1] || null;
			this.previousSibling = this.parentNode.childNodes[index - 1] || null;

			if (this.nextSibling) this.nextSibling.previousSibling = this;
			if (this.previousSibling) this.previousSibling.nextSibling = this;
		}

		// Adds a node to the end of the list of children of a specified parent node.
		// If the node already exists it is removed from current parent node, then added to new parent node.
		Node.prototype.appendChild = function(childNode) {
			return this.insertBefore(childNode, null);
		};

		// Indicates whether a node is a descendent of a given node.
		Node.prototype.contains = function(childNode) {
			while (childNode && childNode != this) {
				childNode = childNode.parentNode;
			}
			return childNode == this;
		};

		// Internal helper used to adopt a node into a new document
		function adopt(node, document) {
			node.ownerDocument = document;
			for (var i = 0, l = node.childNodes.length; i < l; ++i) {
				adopt(node.childNodes[i], document);
			}
		}

		// Inserts the specified node before a reference element as a child of the current node.
		// If referenceNode is null, the new node is appended after the current child nodes.
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
				newNode.parentNode.removeChild(newNode, suppressObservers);
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

		// Puts the specified node and all of its subtree into a "normalized" form.
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

		function isRegisteredObserverForSubtree(registeredObserver) {
			return !!registeredObserver.options.subtree;
		}

		// Removes a child node from the DOM. Returns removed node.
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
			for (var ancestor = this.parentNode; ancestor; ancestor = ancestor.parentNode) {
				this.registeredObservers.appendTransientsForAncestor(ancestor.registeredObservers);
			}

			// Remove the node
			childNode.parentNode = null;
			this.childNodes.splice(index, 1);
			updateFirstLast.call(this);
			updateSiblings.call(childNode, index);

			return childNode;
		};

		// Replaces one child node of the specified node with another. Returns the replaced node.
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

		// Retrieves the object associated to a key on a this node.
		Node.prototype.getUserData = function(key) {
			var data = this.userData[key];
			if (data === undefined)
				return null;

			return data;
		};

		// Associate an object to a key on this node.
		Node.prototype.setUserData = function(key, data) {
			var oldData = this.getUserData(key);

			// No need to trigger observers if the value doesn't actually change
			if (oldData === data)
				return oldData;

			this.userData[key] = data;

			// Queue a mutation record (non-standard, but useful)
			var record = new MutationRecord('userData', this);
			record.attributeName = key;
			record.oldValue = oldData;
			util.queueMutationRecord(record);

			return oldData;
		};

		// Returns a copy of node. If deep is true or omitted, the copy also includes the node's children.
		// Override on subclasses and pass a shallow copy of the node in the 'copy' parameter.
		Node.prototype.cloneNode = function(deep, copy) {
			if (!copy)
				return null;

			// Set owner document
			if (copy.nodeType !== Node.DOCUMENT_NODE)
				copy.ownerDocument = this.ownerDocument;

			// User data is a shallow copy
			for (var key in this.userData) {
				copy.userData[key] = this.userData[key];
			}

			// Recurse if required
			if (deep || deep === undefined) {
				for (var i = 0, l = this.childNodes.length; i < l; ++i) {
					copy.appendChild(this.childNodes[i].cloneNode(true));
				}
			}

			return copy;
		};

		return Node;
	}
);
