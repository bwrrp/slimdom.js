/**
 * @module slimdom
 */
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
		 * &lt;?xml-stylesheet ?&gt;).
		 *
		 * @class ProcessingInstruction
		 * @extends CharacterData
		 * 
		 * @constructor
		 *
		 * @param {String}  target  The string that goes after the &lt;? and before the whitespace,
		 * delimiting it from the data.
		 * @param {String}  data    The first non-whitespace character after target and before ?&gt;.
		 */
		function ProcessingInstruction(target, data) {
			CharacterData.call(this, Node.PROCESSING_INSTRUCTION_NODE, data);

			/**
			 * The string that goes after the <? and before the whitespace, delimiting it from the data.
			 *
			 * @property target
			 * @type {String}
			 */
			this.target = '' + target;
		}
		ProcessingInstruction.prototype = new CharacterData();
		ProcessingInstruction.prototype.constructor = ProcessingInstruction;

		/**
		 * Override cloneNode to pass a new ProcessingInstruction as a shallow copy to ensure the cloned node that is
		 * returned is a ProcessingInstruction node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new ProcessingInstruction node with the same target and nodeValue (data)
		 * as the current ProcessingInstruction.
		 *
		 * @return {Node}     The clone.
		 */
		ProcessingInstruction.prototype.cloneNode = function(deep, copy) {
			copy = copy || new ProcessingInstruction(this.target, this.data);

			return CharacterData.prototype.cloneNode.call(this, deep, copy);
		};

		return ProcessingInstruction;
	}
);
