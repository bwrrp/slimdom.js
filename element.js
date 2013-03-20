define(
	[
		'./node',
		'./mutations/mutationrecord',
		'./util'
	],
	function(Node, MutationRecord, util) {
		// Element node
		function Element(name) {
			Node.call(this, Node.ELEMENT_NODE);
			this.nodeName = name;
			this.attributes = {};

			this.children = [];
			this.firstElementChild = this.lastElementChild = null;
			this.previousElementSibling = this.nextElementSibling = null;
			this.childElementCount = 0;
		}
		Element.prototype = new Node(Node.ELEMENT_NODE);
		Element.prototype.constructor = Element;

		function isElement(node) {
			return node.nodeType === Node.ELEMENT_NODE;
		}

		function findNextElementSibling(node, backwards) {
			while (node && !isElement(node))
				node = backwards ? node.previousSibling : node.nextSibling;
			return node;
		}

		Element.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			var oldParent = newNode.parentNode,
				result = Node.prototype.insertBefore.call(this, newNode, referenceNode, suppressObservers);

			if (isElement(newNode) && newNode.parentNode === this) {
				// Update child references
				this.firstElementChild = findNextElementSibling(this.firstElementChild, true);
				this.lastElementChild = findNextElementSibling(this.lastElementChild, false);
				// Update sibling references
				newNode.previousElementSibling = findNextElementSibling(newNode, true);
				if (newNode.previousElementSibling)
					newNode.previousElementSibling.nextElementSibling = newNode;
				newNode.nextElementSibling = findNextElementSibling(newNode, false);
				if (newNode.nextElementSibling)
					newNode.nextElementSibling.previousElementSibling = newNode;
				// Update element count
				if (oldParent !== this)
					++this.childElementCount;
			}

			return result;
		};

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
				--this.childElementCount;
			}

			return Node.prototype.removeChild.call(this, childNode, suppressObservers);
		};

		Element.prototype.hasAttribute = function(attributeName) {
			return (attributeName in this.attributes);
		};

		// Get the value of the attribute with the given name
		Element.prototype.getAttribute = function(attributeName) {
			return this.attributes[attributeName];
		};

		// Set the attribute with the given name to the given value
		Element.prototype.setAttribute = function(attributeName, attributeValue) {
			// Coerce the value to a string for consistency
			attributeValue = '' + attributeValue;

			var oldValue = this.hasAttribute(attributeName) ? this.attributes[attributeName] : null;

			// No need to trigger observers if the value doesn't actually change
			if (attributeValue === oldValue)
				return;

			// Queue a mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = attributeName;
			record.oldValue = oldValue;
			util.queueMutationRecord(record);

			// Set value
			this.attributes[attributeName] = attributeValue;
		};

		// Remove the attribute with the given attributeName
		Element.prototype.removeAttribute = function(attributeName) {
			if (!this.hasAttribute(attributeName))
				return;

			// Queue mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = attributeName;
			record.oldValue = this.attributes[attributeName];
			util.queueMutationRecord(record);

			// Remove the attribute
			delete this.attributes[attributeName];
		};

		return Element;
	}
);
