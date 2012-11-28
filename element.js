define(['./node'], function(Node) {
	// Element node
	function Element(name) {
		Node.call(this, Node.ELEMENT_NODE);
		this.nodeName = name;
	}
	Element.prototype = new Node(Node.ELEMENT_NODE);
	Element.prototype.constructor = Element;

	return Element;
});
