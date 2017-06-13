import CharacterData from './CharacterData';
import Document from './Document';
import { NodeType } from './util/NodeType';

/**
 * 3.13. Interface ProcessingInstruction
 */
export default class ProcessingInstruction extends CharacterData {
	// Node

	public get nodeType(): number {
		return NodeType.PROCESSING_INSTRUCTION_NODE;
	}

	public get nodeName(): string {
		return this.target;
	}

	// ProcessingInstruction

	public target: string;

	/**
	 * (non-standard) Use Document#createProcessingInstruction to create a processing instruction.
	 *
	 * @param document The node document to associate with the processing instruction
	 * @param target   The target of the processing instruction
	 */
	constructor(document: Document, target: string, data: string) {
		super(document, data);
		this.target = target;
	}

	/**
	 * (non-standard) Creates a copy of the context object, not including its children.
	 *
	 * @param document The node document to associate with the copy
	 *
	 * @return A shallow copy of the context object
	 */
	public _copy(document: Document): ProcessingInstruction {
		// Set copy’s target and data to those of node.
		return new ProcessingInstruction(document, this.target, this.data);
	}
}
