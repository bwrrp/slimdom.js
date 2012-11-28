define(['./node'], function(Node) {
	// Text node
	function Text(content) {
		Node.call(this, Node.TEXT_NODE);
		this.nodeValue = content;
	}
	Text.prototype = new Node(Node.TEXT_NODE);
	Text.prototype.constructor = Text;

	// Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
	Text.prototype.splitText = function(index) {
		// Split the text
		var newNode = this.ownerDocument.createTextNode(this.nodeValue.substring(index));
		this.nodeValue = this.nodeValue.substring(0, index);

		// If the current node is part of a tree, insert the new node
		if (this.parentNode) {
			this.parentNode.insertBefore(this.nextSibling, newNode);
		}

		return newNode;
	};

	Text.prototype.toString = function() {
		return this.nodeValue;
	};

	return Text;
});
