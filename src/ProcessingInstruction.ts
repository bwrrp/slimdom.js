import CharacterData from './CharacterData';
import Node from './Node';

/**
 * A processing instruction provides an opportunity for application-specific instructions to be embedded within
 * XML and which can be ignored by XML processors which do not support processing their instructions (outside
 * of their having a place in the DOM).
 *
 * A Processing instruction is distinct from a XML Declaration which is used for other information about the
 * document such as encoding and which appear (if it does) as the first item in the document.
 *
 * User-defined processing instructions cannot begin with 'xml', as these are reserved (e.g., as used in
 * <?xml-stylesheet?>).
 */
export default class ProcessingInstruction extends CharacterData {
	/**
	 * The string that goes after the <? and before the whitespace, delimiting it from the data.
	 */
	public target: string;

	/**
	 * @param target Target for the processing instruction
	 * @param data   Content for the processing instruction
	 */
	constructor (target: string, data: string) {
		super(Node.PROCESSING_INSTRUCTION_NODE, data);

		this.target = target;
	}

	public cloneNode (deep: boolean = true, copy?: ProcessingInstruction): ProcessingInstruction {
		copy = copy || new ProcessingInstruction(this.target, this.data);
		return super.cloneNode(deep, copy) as ProcessingInstruction;
	}
}
