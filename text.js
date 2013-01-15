define(
	[
		'./characterdata'
	],
	function(CharacterData) {
		// Text node
		function Text(content) {
			CharacterData.call(this, Node.TEXT_NODE, content);
		}
		Text.prototype = new CharacterData();
		Text.prototype.constructor = Text;

		// Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
		Text.prototype.splitText = function(offset) {
			var length = this.length(),
				count = length - offset,
				newData = this.substringData(offset, count),
				newNode = this.ownerDocument.createTextNode(newData);

			// If the current node is part of a tree, insert the new node
			if (this.parentNode) {
				this.parentNode.insertBefore(newNode, this.nextSibling);
			}

			// Truncate our own data
			this.deleteData(offset, count);

			// Return the new node
			return newNode;
		};

		return Text;
	}
);
