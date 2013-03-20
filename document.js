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

		// Document base
		function Document() {
			Node.call(this, Node.DOCUMENT_NODE);

			this.ranges = [];

			this.appendChild(new Element('root'));
			this.documentElement = this.firstChild;
		}
		Document.prototype = new Node(Node.DOCUMENT_NODE);
		Document.prototype.constructor = Document;

		// Override replaceChild to update the documentElement reference
		Document.prototype.replaceChild = function(newChild, oldChild) {
			Node.prototype.replaceChild.call(this, newChild, oldChild);
			this.documentElement = this.firstChild;
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

		return Document;
	}
);
