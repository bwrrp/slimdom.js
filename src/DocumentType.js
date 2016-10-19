/**
 * @module slimdom
 */
define(
	[
		'./Node'
	],
	function(
	 	Node
	 	) {
		'use strict';

		/**
		 * The DocumentType interface represents a Node containing a doctype.
		 *
		 * @class DocumentType
		 * @extends Node
		 *
		 * @constructor
		 *
		 * @param  {String}  name      The name of the document type
		 * @param  {String}  publicId  The publicId of the document type
		 * @param  {String}  systemId  The systemId of the document type
		 */
		function DocumentType(name, publicId, systemId) {
			Node.call(this, Node.DOCUMENT_TYPE_NODE);

			this.name = name;
			this.publicId = publicId;
			this.systemId = systemId;
		}
		DocumentType.prototype = new Node();
		DocumentType.prototype.constructor = DocumentType;

		/**
		 * Override cloneNode to pass a new DocumentType as a shallow copy to ensure the cloned node that is
		 * returned is a DocumentType node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new DocumentType node with the same properties as the current DocumentType.
		 *
		 * @return {Node}     The clone.
		 */
		DocumentType.prototype.cloneNode = function(deep, copy) {
			copy = copy || new DocumentType(this.name, this.publicId, this.systemId);

			return Node.prototype.cloneNode.call(this, deep, copy);
		};

		return DocumentType;
	}
);
