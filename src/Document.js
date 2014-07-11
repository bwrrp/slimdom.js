/**
 * @module slimdom
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Node',
		'./Element',
		'./Text',
		'./ProcessingInstruction',
		'./Comment',
		'./selections/Range',

		'./globals'
	],
	function(
		Node,
		Element,
		Text,
		ProcessingInstruction,
		Comment,
		Range,

		globals
		) {
		'use strict';

		/**
		 * Each web page loaded in the browser has its own document object. The Document interface serves as an entry
		 * point to the web page's content (the DOM tree, including elements such as &lt;body&gt; and &lt;table&gt;) and provides
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
			 * The DocumentType that is a direct child of the current document, or null if there is none.
			 *
			 * @property doctype
			 * @type {DocumentElement|null}
			 * @final
			 */
			this.doctype = null;

			/**
			 * The Element that is a direct child of the current document, or null if there is none.
			 *
			 * @property documentElement
			 * @type {Element|null}
			 * @final
			 */
			this.documentElement = null;

			/**
			 * Non-standard. Lists the ranges that are active on the current document.
			 *
			 * @property ranges
			 * @type {Range[]}
			 * @final
			 */
			this.ranges = [];

			/**
			 * Returns a reference to the DOMImplementation object which created the document.
			 *
			 * @property implementation
			 * @type {DOMImplementation}
			 * @final
			 */
			this.implementation = globals.domImplementation;
		}
		Document.prototype = new Node(Node.DOCUMENT_NODE);
		Document.prototype.constructor = Document;

		/**
		 * Override insertBefore to update the documentElement reference.
		 *
		 * @method insertBefore
		 *
		 * @param  {Node}       newNode            The node that is inserted.
		 * @param  {Node}       referenceNode      The node in front of which the given newNode is inserted.
		 * @param  {Boolean}    suppressObservers  Whether or not to suppress creating any MutationRecords for the
		 *                                           changes that occur by executing this insertBefore operation.
		 *
		 * @return {null|Node}  The inserted node or null if something went wrong.
		 */
		Document.prototype.insertBefore = function(newNode, referenceNode, suppressObservers) {
			// Document can not have more than one child element node
			if (newNode.nodeType === Node.ELEMENT_NODE && this.documentElement) {
				return this.documentElement === newNode ? newNode : null;
			}

			// Document can not have more than one child doctype node
			if (newNode.nodeType === Node.DOCUMENT_TYPE_NODE && this.doctype) {
				return this.doctype === newNode ? newNode : null;
			}

			var result = Node.prototype.insertBefore.call(this, newNode, referenceNode, suppressObservers);

			// Update document element
			if (result && result.nodeType === Node.ELEMENT_NODE) {
				this.documentElement = result;
			}

			// Update doctype
			if (result && result.nodeType === Node.DOCUMENT_TYPE_NODE) {
				this.doctype = result;
			}

			return result;
		};

		/**
		 * Override removeChild to keep the documentElement property in sync.
		 *
		 * @method removeChild
		 *
		 * @param  {Node}       childNode          The child of the current node to remove.
		 * @param  {Boolean}    suppressObservers  Whether or not any MutationObservers on the affected nodes are
		 * notified.
		 *
		 * @return {null|Node}  Returns the removed node or null if something went wrong.
		 */
		Document.prototype.removeChild = function(childNode, suppressObservers) {
			var result = Node.prototype.removeChild.call(this, childNode, suppressObservers);
			if (result === this.documentElement) {
				this.documentElement = null;
			} else if (result === this.doctype) {
				this.doctype = null;
			}

			return result;
		};

		/**
		 * Creates a new Element node with the given tag name.
		 *
		 * @method createElement
		 *
		 * @param   {String}  name  The name of the tag for the Element that is created.
		 *
		 * @return {Element}  The created Element node with the given (tag)name.
		 */
		Document.prototype.createElement = function(name) {
			var node = new Element(name);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a new Text node with the given content.
		 *
		 * @method createTextNode
		 *
		 * @param  {String}  content  The actual text that is contained by the created Text node.
		 *
		 * @return {Text}    The newly created Text node.
		 */
		Document.prototype.createTextNode = function(content) {
			var node = new Text(content);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a new ProcessingInstruction node with a given target and given data.
		 *
		 * @method createProcessingInstruction
		 *
		 * @param  {String}                 target  The string that goes after the &lt;? and before the whitespace,
		 * delimiting it from the data.
		 * @param  {String}                 data    The first non-whitespace character after target and before ?&gt;.
		 *
		 * @return {ProcessingInstruction}  The newly created ProcessingInstruction node.
		 */
		Document.prototype.createProcessingInstruction = function(target, data) {
			var node = new ProcessingInstruction(target, data);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a new Comment node with the given data.
		 *
		 * @method createComment
		 *
		 * @param  {String}   [data]  The comment's text.
		 *
		 * @return {Comment}  The newly created Comment node.
		 */
		Document.prototype.createComment = function(data) {
			var node = new Comment(data);
			node.ownerDocument = this;
			return node;
		};

		/**
		 * Creates a selection range within the current document.
		 *
		 * @method createRange
		 *
		 * @return {Range}  The newly created Range.
		 */
		Document.prototype.createRange = function() {
			return new Range(this);
		};


		/**
		 * Override cloneNode to pass a new Document as a shallow copy to ensure the cloned node that is returned is a
		 * Document node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new Document node.
		 *
		 * @return {Node}     The clone.
		 */
		Document.prototype.cloneNode = function(deep, copy) {
			copy = copy || new Document();

			return Node.prototype.cloneNode.call(this, deep, copy);
		};

		return Document;
	}
);
