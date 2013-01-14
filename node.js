define(['lodash', './util'], function(_, util) {
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
		this.registeredObservers = [];
	}

	// Node type constants - not all DOM standard node types are supported
	Node.prototype.ELEMENT_NODE  = Node.ELEMENT_NODE  = 1;
	Node.prototype.TEXT_NODE     = Node.TEXT_NODE     = 3;
	Node.prototype.DOCUMENT_NODE = Node.DOCUMENT_NODE = 9;

	// Internal helper used to update the firstChild and lastChild references.
	function updateFirstLast() {
		this.firstChild = _.first(this.childNodes) || null;
		this.lastChild = _.last(this.childNodes) || null;
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
		// Detach from old parent
		if (childNode.parentNode) {
			childNode.parentNode.removeChild(childNode);
		}

		childNode.parentNode = this;
		this.childNodes.push(childNode);
		updateFirstLast.call(this);
		updateSiblings.call(childNode, this.childNodes.length - 1);

		return childNode;
	};

	// Indicates whether a node is a descendent of a given node.
	Node.prototype.contains = function(childNode) {
		while (childNode && childNode != this) {
			childNode = childNode.parentNode;
		}
		return childNode == this;
	};

	// Inserts the specified node before a reference element as a child of the current node.
	Node.prototype.insertBefore = function(newNode, referenceNode) {
		if (!referenceNode)
			return this.appendChild(newNode);

		// Check index of reference node
		var index = _.indexOf(this.childNodes, referenceNode);
		if (index < 0) return null;

		// Detach from old parent
		if (newNode.parentNode) {
			newNode.parentNode.removeChild(newNode);
		}
		newNode.parentNode = this;

		// Insert
		this.childNodes.splice(index, 0, newNode);
		updateFirstLast.call(this);
		updateSiblings.call(newNode, index);

		return newNode;
	};

	// Inserts the specified node before a reference element as a child of the current node.
	Node.prototype.insertAfter = function(newNode, referenceNode) {
		return this.insertBefore(newNode, referenceNode.nextSibling);
	};
	// Puts the specified node and all of its subtree into a "normalized" form.
	// In a normalized subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
	Node.prototype.normalize = function() {
		var node = this.firstChild;
		while (node) {
			var nextNode = node.nextSibling;
			if (node.nodeType == Node.TEXT_NODE) {
				while (node.nextSibling && node.nextSibling.nodeType == Node.TEXT_NODE) {
					// Combine node with next sibling and remove the latter
					node.nodeValue += node.nextSibling.nodeValue;
					node.parentNode.removeChild(node.nextSibling);
				}
				// Store next sibling in case the following code removes the reference
				nextNode = node.nextSibling;
				// Delete empty text nodes
				if (node.nodeValue === "") {
					node.parentNode.removeChild(node);
				}
			} else {
				// Recurse
				node.normalize();
			}
			// Move to next node
			node = nextNode;
		}
	};

	// Removes a child node from the DOM. Returns removed node.
	Node.prototype.removeChild = function(childNode) {
		// Check index of node
		var index = _.indexOf(this.childNodes, childNode);
		if (index < 0) return null;

		childNode.parentNode = null;

		// Remove item from array
		this.childNodes.splice(index, 1);
		updateFirstLast.call(this);
		updateSiblings.call(childNode, index);

		return childNode;
	};

	// Replaces one child node of the specified node with another. Returns the replaced node.
	Node.prototype.replaceChild = function(newChild, oldChild) {
		// Check index of old child
		var index = _.indexOf(this.childNodes, oldChild);
		if (index < 0) return null;

		// Detach new child from old parent
		if (newChild.parentNode) {
			newChild.parentNode.removeChild(newChild);
		}

		// Replace old child with new child
		oldChild.parentNode = null;
		newChild.parentNode = this;
		this.childNodes[index] = newChild;
		updateFirstLast.call(this);
		updateSiblings.call(oldChild, index);
		updateSiblings.call(newChild, index);

		return oldChild;
	};

	// Retrieves the object associated to a key on a this node.
	Node.prototype.getUserData = function(key) {
		return key in this.userData ? this.userData[key] : null;
	};

	// Associate an object to a key on this node.
	Node.prototype.setUserData = function(key, data) {
		var oldData = this.getUserData(key);
		this.userData[key] = data;
		return oldData;
	};

	return Node;
});
