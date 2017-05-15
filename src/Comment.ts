import CharacterData from './CharacterData';
import Node from './Node';

/**
 * The Comment interface represents textual notations within markup; although it is generally not visually
 * shown, such comments are available to be read in the source view. Comments are represented in HTML and
 * XML as content between '&lt;!--' and '--&gt;'. In XML, the character sequence '--' cannot be used within
 * a comment.
 */
export default class Comment extends CharacterData {
	constructor (data: string = '') {
		super(Node.COMMENT_NODE, data);
	}

	public cloneNode (deep: boolean = true, _copy?: Comment): Comment {
		_copy = _copy || new Comment(this.data);
		return super.cloneNode(deep, _copy) as Comment;
	}
}
