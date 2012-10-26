define(['./node', './element', './text', './selection/range'], function(Node, Element, Text, Range) {
	// Document base
	function Document() {
		this.root = new Node('root');
	}
	Document.prototype = new Node('document');
	Document.prototype.constructor = Document;

	// Creates a new element with the given tag name.
	Document.prototype.createElement = function(name) {
		var node = new ElementNode(name);
		node.ownerDocument = this;
		return node;
	};

	// Creates a text node.
	Document.prototype.createTextNode = function(content) {
		var node = new TextNode(content);
		node.ownerDocument = this;
		return node;
	};

	// Creates a selection range
	Document.prototype.createRange = function() {
		return new Range(this);
	};

	return Document;
});
