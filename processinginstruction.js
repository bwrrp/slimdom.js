define(
	[
		'./characterdata',
		'./node'
	],
	function(CharacterData, Node) {
		function ProcessingInstruction(target, data) {
			CharacterData.call(this, Node.PROCESSING_INSTRUCTION_NODE, data);

			this.target = target;
		}
		ProcessingInstruction.prototype = new CharacterData();
		ProcessingInstruction.prototype.constructor = ProcessingInstruction;

		return ProcessingInstruction;
	}
);
