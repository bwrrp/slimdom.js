if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./CharacterData',
		'./Node'
	],
	function(
		CharacterData,
	 	Node) {
		'use strict';

		/**
		 * A processing instruction provides an opportunity for application-specific instructions to be embedded within
		 * XML and which can be ignored by XML processors which do not support processing their instructions (outside
		 * of their having a place in the DOM).
		 *
		 * A Processing instruction is distinct from a XML Declaration which is used for other information about the
		 * document such as encoding and which appear (if it does) as the first item in the document.
		 *
		 * User-defined processing instructions cannot begin with 'xml', as these are reserved (e.g., as used in
		 * <?xml-stylesheet ?>).
		 *
		 * @class ProcessingInstruction
		 * @constructor
		 * @extends CharacterData
		 * 
		 * @param {String} target After the <? and before whitespace delimiting it from data
		 * @param {String} data   First non-whitespace character after target and before ?>
		 */
		function ProcessingInstruction(target, data) {
			CharacterData.call(this, Node.PROCESSING_INSTRUCTION_NODE, data);

			/**
			 * After the <? and before whitespace delimiting it from data
			 *
			 * @property target
			 * @type {string}
			 */
			this.target = target;
		}
		ProcessingInstruction.prototype = new CharacterData();
		ProcessingInstruction.prototype.constructor = ProcessingInstruction;

		/**
		 * Returns a duplicate of the node on which this method was called.
		 *asdasdasd as TODO: how to document an override method
		 * @method cloneNode
		 * 
		 * @param  {Boolean} [deep]        true if the children of the node should also be cloned, or false to clone only the specified node.
		 * 
		 * @return {ProcessingInstruction} The new node that will be a clone of node
		 */
		ProcessingInstruction.prototype.cloneNode = function(deep) {
			return CharacterData.prototype.cloneNode.call(this, deep, new ProcessingInstruction(this.target, this.nodeValue));
		};

		return ProcessingInstruction;
	}
);
