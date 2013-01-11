define(['./node'], function(Node) {
	// Element node
	function Element(name) {
		Node.call(this, Node.ELEMENT_NODE);
		this.nodeName = name;
	}
	Element.prototype = new Node(Node.ELEMENT_NODE);
	Element.prototype.constructor = Element;

	Element.prototype.getAttributeValue = function(attributeName) {
		if (!this.attributes)
			return;

		return this.attributes[attributeName];
	}

	Element.prototype.setAttributeValue = function(attributeName, attributeValue) {
		if (!this.attributes)
			this.attributes = {};


		// TODO: remove if value undefined

		// TODO: waarde altijd als string? Dus toString() nodig? Voorkomt wel onduidelijkheid
		this.attributes[attributeName] = '' + attributeValue;
	}

	return Element;
});
