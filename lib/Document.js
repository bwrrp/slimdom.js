if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Node',
		'./Element',
		'./ProcessingInstruction',
		'./Text',
		'./selection/Range'
	],
	function(
		Node,
		Element,
		ProcessingInstruction,
		Text,
		Range) {
		'use strict';

		/**
		 * Each web page loaded in the browser has its own document object. The Document interface serves as an entry
		 * point to the web page's content (the DOM tree, including elements such as <body> and <table>) and provides
		 * functionality global to the document (such as obtaining the page's URL and creating new elements in the
		 * document).
		 *
		 * @class Document
		 * @extends Node
		 *
		 * @constructor
		 */
		function Document() {
			Node.call(this, Node.DOCUMENT_NODE);

			this.ownerDocument = this;

			/**
			 * Returns the Element that is a direct child of the current document.
			 *
			 * @property documentElement
			 * @type {Element}
			 * @readOnly
			 */
			this.documentElement = null;

			/**
			 * Lists the ranges that are active on the current document.
			 *
			 * @property ranges
			 * @type {Range[]}
			 */
			this.ranges = [];
		}
		Document.prototype = new Node(Node.DOCUMENT_NODE);
		Document.prototype.constructor = Document;

		// Override insertBefore to update the documentElement reference.
		Document.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			// Document can not have more than one child element node
			if (newNode.nodeType === Node.ELEMENT_NODE && this.documentElement)
				return this.documentElement === newNode ? newNode : null;

			var result = Node.prototype.insertBefore.call(this, newNode, referenceNode, suppressObservers);

			// Update document element
			if (result && result.nodeType === Node.ELEMENT_NODE)
				this.documentElement = result;

			return result;
		};

		// Override removeChild to keep the documentElement property in sync.
		Document.prototype.removeChild = function(childNode, suppressObservers) {
			var result = Node.prototype.removeChild.call(this, childNode, suppressObservers);
			if (result === this.documentElement)
				this.documentElement = null;

			return result;
		};

		/**
		 * Creates a new Element node with the given tag name.
		 *
		 * @method createElement
		 * @param name {String}
		 * @return {Element} The newly created Element node.
		 */
		Document.prototype.createElement = function(name) {
			var node = new Element(name);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a new ProcessingInstruction node with a given target and given data.
		 *
		 * @method createProcessingInstruction
		 * @param {String} target After the <? and before whitespace delimiting it from data
		 * @param {String} data   First non-whitespace character after target and before ?>
		 * @return {ProcessingInstruction} The newly created ProcessingInstruction node.
		 */
		Document.prototype.createProcessingInstruction = function(target, data) {
			var node = new ProcessingInstruction(target, data);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a new Text node with the given content.
		 *
		 * @method createTextNode
		 * @param content {String}
		 * @return {Text} The newly created Text node.
		 */
		Document.prototype.createTextNode = function(content) {
			var node = new Text(content);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a selection range within the current document.
		 *
		 * @method createRange
		 * @return {Range} The newly created Range.
		 */
		Document.prototype.createRange = function() {
			return new Range(this);
		};


		/**
		 * Override cloneNode to pass a new Document as a shallow copy to ensure the cloned node that is returned is a
		 * Document node.
		 *
		 * @method cloneNode
		 * @param [deep=true] {Boolean} If deep is true or omitted, the copy also includes the node's children.
		 * @param copy {Node} Usually only specified by a subclass, not a client calling this method.
		 * @return {Node} The clone.
		 */
		Document.prototype.cloneNode = function(deep) {
			return Node.prototype.cloneNode.call(this, deep, new Document());
		};

		return Document;
	}
);
