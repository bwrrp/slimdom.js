define(['./node'], function(Node) {
	// Element node
	function Element(name) {
		Node.call(this, 'element');
		this.nodeName = name;
	}
	Element.prototype = new Node('element');
	Element.prototype.constructor = Element;

	return Element;
});
