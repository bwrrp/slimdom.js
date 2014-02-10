if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./CharacterData',
		'./Node'
	],
	function(CharacterData,
			 Node) {
		'use strict';

		function ProcessingInstruction(target, data) {
			CharacterData.call(this, Node.PROCESSING_INSTRUCTION_NODE, data);

			this.target = target;
		}
		ProcessingInstruction.prototype = new CharacterData();
		ProcessingInstruction.prototype.constructor = ProcessingInstruction;

		// Returns a copy of node. If deep is true or omitted, the copy also includes the node's children.
		ProcessingInstruction.prototype.cloneNode = function(deep) {
			return CharacterData.prototype.cloneNode.call(this, deep, new ProcessingInstruction(this.target, this.nodeValue));
		};

		return ProcessingInstruction;
	}
);
