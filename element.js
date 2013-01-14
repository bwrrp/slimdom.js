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
		}
		Element.prototype = new Node(Node.ELEMENT_NODE);
		Element.prototype.constructor = Element;

		Element.prototype.hasAttribute = function(attributeName) {
			return (attributeName in this.attributes);
		};

		// Get the value of the attribute with the given name
		Element.prototype.getAttribute = function(attributeName) {
			return this.attributes[attributeName];
		};

		// Set the attribute with the given name to the given value
		Element.prototype.setAttribute = function(attributeName, attributeValue) {
			// TODO: add a way to remove / unset attributes (value === undefined / null?)

			// Coerce the value to a string for consistency
			attributeValue = '' + attributeValue;

			var oldValue = this.hasAttribute(attributeName) ? this.attributes[attributeName] : null;

			// Queue a mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = attributeName;
			record.oldValue = oldValue;
			util.queueMutationRecord(record);

			// Set value
			this.attributes[attributeName] = attributeValue;
		};

		// Remove the attribute with the given name
		Element.prototype.removeAttribute = function(name) {
			if (!this.hasAttribute(name))
				return;

			// Queue mutation record
			var record = new MutationRecord('attributes', this);
			record.attributeName = name;
			record.oldValue = this.attributes[name];
			util.queueMutationRecord(record);

			// Remove the attribute
			delete this.attributes[attributeName];
		};

		return Element;
	}
);
