import CharacterData from './CharacterData';
import Document from './Document';
import { getContext } from './context/Context';
import { NodeType } from './util/NodeType';

/**
 * 3.13. Interface ProcessingInstruction
 *
 * @public
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
	 * @param target - The target of the processing instruction
	 * @param data   - The data of the processing instruction
	 */
	constructor(target: string, data: string) {
		super(data);

		this.target = target;
	}

	/**
	 * (non-standard) Creates a copy of this, not including its children.
	 *
	 * @param document - The node document to associate with the copy
	 *
	 * @returns A shallow copy of this
	 */
	public _copy(document: Document): ProcessingInstruction {
		// Set copy’s target and data to those of node.
		const context = getContext(document);
		const copy = new context.ProcessingInstruction(this.target, this.data);
		copy.ownerDocument = document;
		return copy;
	}
}
