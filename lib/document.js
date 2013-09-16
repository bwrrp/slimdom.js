define(
	[
		'./node',
		'./element',
		'./processinginstruction',
		'./text',
		'./selection/range'
	],
	function(
		Node,
		Element,
		ProcessingInstruction,
		Text,
		Range) {
		'use strict';

		// Document base
		function Document() {
			Node.call(this, Node.DOCUMENT_NODE);
			this.ownerDocument = this;
			this.documentElement = null;

			this.ranges = [];
		}
		Document.prototype = new Node(Node.DOCUMENT_NODE);
		Document.prototype.constructor = Document;

		// Override insertBefore to update the documentElement reference
		Document.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			// Document can not have more than one child element node
			if (newNode.nodeType === Node.ELEMENT_NODE && this.documentElement)
				return null;

			var result = Node.prototype.insertBefore.call(this, newNode, referenceNode, suppressObservers);

			// Update document element
			if (result && result.nodeType === Node.ELEMENT_NODE)
				this.documentElement = result;

			return result;
		};

		// Override removeChild to update the documentElement reference
		Document.prototype.removeChild = function(childNode, suppressObservers) {
			var result = Node.prototype.removeChild.call(this, childNode, suppressObservers);
			if (result === this.documentElement)
				this.documentElement = null;
		};

		// Creates a new element with the given tag name.
		Document.prototype.createElement = function(name) {
			var node = new Element(name);
			node.ownerDocument = this;
			return node;
		};

		Document.prototype.createProcessingInstruction = function(target, data) {
			var node = new ProcessingInstruction(target, data);
			node.ownerDocument = this;
			return node;
		};

		// Creates a text node.
		Document.prototype.createTextNode = function(content) {
			var node = new Text(content);
			node.ownerDocument = this;
			return node;
		};

		// Creates a selection range
		Document.prototype.createRange = function() {
			return new Range(this);
		};

		// Returns a copy of node. If deep is true or omitted, the copy also includes the node children.
		Document.prototype.cloneNode = function(deep) {
			return Node.prototype.cloneNode.call(this, deep, new Document());
		};

		return Document;
	}
);
