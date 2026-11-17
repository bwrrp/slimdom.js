import Attr from '../Attr';
import Element from '../Element';
import Node from '../Node';

/**
 * A part of the string that was parsed, from start (inclusive) to end (exclusive).
 *
 * The offsets count UTF-16 code units in the original string, before the byte order mark is removed
 * and line endings are normalized.
 *
 * @public
 */
export type Span = { start: number; end: number };

/**
 * The position of a text node, CDATA section, comment, processing instruction or document type.
 *
 * The span covers the whole node. A text node spans from the start of its first piece to the end
 * of its last piece.
 *
 * @public
 */
export type SimpleNodePosition = { type: 'node'; span: Span };

/**
 * The position of an element.
 *
 * The start tag span covers the start tag or the empty-element tag. The end tag span is null for an
 * empty-element tag.
 *
 * @public
 */
export type ElementPosition = { type: 'element'; startTag: Span; endTag: Span | null };

/**
 * The position of an attribute.
 *
 * The span covers the whole attribute. The value span covers its value including the quotes.
 *
 * @public
 */
export type AttributePosition = { type: 'attribute'; span: Span; value: Span };

/**
 * The position of the XML declaration of a document.
 *
 * It is recorded for the document because the declaration is not a node.
 *
 * @public
 */
export type XmlDeclarationPosition = { type: 'xmlDeclaration'; span: Span };

/**
 * The position of the text declaration of a fragment.
 *
 * It is recorded for the document fragment because the declaration is not a node.
 *
 * @public
 */
export type TextDeclarationPosition = { type: 'textDeclaration'; span: Span };

/**
 * Where a node was found in the string that was parsed.
 *
 * The `type` property tells which of the variants it is.
 *
 * @public
 */
export type NodePosition =
	| SimpleNodePosition
	| ElementPosition
	| AttributePosition
	| XmlDeclarationPosition
	| TextDeclarationPosition;

/**
 * Records the positions of parsed nodes.
 *
 * The parser works on the normalized input and reports offsets into it. The recorder translates
 * them back to the original input.
 *
 * Nodes from the replacement text of an entity get no position. A text node gets a position only
 * if all its pieces are in the input. A reference to an entity counts as a piece only if its
 * replacement text contains nothing but text.
 */
export default class PositionRecorder {
	private _positions: WeakMap<Node, NodePosition>;

	// Length of the removed byte order mark (0 or 1)
	private _bomLength: number;

	// Offsets in the normalized input of each line feed that was a CR LF in the original input,
	// in ascending order. Each of them had one character removed before it.
	private _removedBefore: number[] = [];

	// Number of replacement texts of entities currently being parsed
	private _depth = 0;

	// The reference to the outermost entity currently being parsed
	private _entityStart = 0;
	private _entityEnd = 0;
	private _entityHasMarkup = false;

	// The text collected for the next text node
	private _textStart = 0;
	private _textEnd = 0;
	private _textHasPosition = false;
	private _textFromEntity = false;

	constructor(positions: WeakMap<Node, NodePosition>, originalInput: string) {
		this._positions = positions;
		this._bomLength = originalInput.charCodeAt(0) === 0xfeff ? 1 : 0;
		const crlf = /\r\n/g;
		crlf.lastIndex = this._bomLength;
		for (
			let match = crlf.exec(originalInput);
			match !== null;
			match = crlf.exec(originalInput)
		) {
			// Index of the line feed in the normalized input
			this._removedBefore.push(
				match.index + 1 - this._bomLength - (this._removedBefore.length + 1)
			);
		}
	}

	/**
	 * Translates an offset in the normalized input to the original input.
	 */
	private _toOriginal(offset: number): number {
		// Count removed characters before offset (binary search for the first entry >= offset)
		const removed = this._removedBefore;
		let low = 0;
		let high = removed.length;
		while (low < high) {
			const middle = (low + high) >>> 1;
			if (removed[middle] < offset) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		return offset + this._bomLength + low;
	}

	private _span(start: number, end: number): Span {
		return { start: this._toOriginal(start), end: this._toOriginal(end) };
	}

	/**
	 * Called when the parser starts on the replacement text of an entity.
	 */
	public enterEntity(start: number, end: number): void {
		if (this._depth === 0) {
			this._entityStart = start;
			this._entityEnd = end;
			this._entityHasMarkup = false;
			this._textFromEntity = false;
		}
		this._depth += 1;
	}

	/**
	 * Called when the parser has finished the replacement text of an entity.
	 *
	 * @param hasCollectedText - whether text was collected that does not form a node yet
	 */
	public exitEntity(hasCollectedText: boolean): void {
		this._depth -= 1;
		if (this._depth === 0 && hasCollectedText && !this._entityHasMarkup) {
			// The whole reference belongs to the text
			this._textEnd = this._entityEnd;
		}
	}

	/**
	 * Called for each piece of text: character data, a character reference, or a CDATA section that
	 * is treated as text.
	 *
	 * @param isFirst - whether this piece starts a new text node
	 */
	public textPiece(start: number, end: number, isFirst: boolean): void {
		if (this._depth === 0) {
			if (isFirst) {
				this._textStart = start;
				this._textHasPosition = true;
				this._textFromEntity = false;
			}
			this._textEnd = end;
			return;
		}
		if (isFirst) {
			this._textStart = this._entityStart;
			this._textHasPosition = !this._entityHasMarkup;
		}
		this._textFromEntity = true;
	}

	/**
	 * Called for each event that is not text, before the collected text becomes a node.
	 */
	public markup(): void {
		if (this._depth === 0) {
			return;
		}
		this._entityHasMarkup = true;
		if (this._textFromEntity) {
			// The text node would contain part of the replacement text
			this._textHasPosition = false;
		}
	}

	/**
	 * Called when the collected text becomes a text node.
	 */
	public text(node: Node): void {
		if (this._textHasPosition) {
			this._positions.set(node, {
				type: 'node',
				span: this._span(this._textStart, this._textEnd),
			});
		}
	}

	/**
	 * Records a node that is represented by a single span in the input.
	 */
	public node(node: Node, start: number, end: number): void {
		if (this._depth === 0) {
			this._positions.set(node, { type: 'node', span: this._span(start, end) });
		}
	}

	/**
	 * Records the XML declaration of a document or the text declaration of a fragment.
	 */
	public declaration(node: Node, isDocument: boolean, start: number, end: number): void {
		this._positions.set(node, {
			type: isDocument ? 'xmlDeclaration' : 'textDeclaration',
			span: this._span(start, end),
		});
	}

	/**
	 * Records the start tag or empty-element tag of an element.
	 */
	public startTag(element: Element, start: number, end: number): void {
		if (this._depth === 0) {
			this._positions.set(element, {
				type: 'element',
				startTag: this._span(start, end),
				endTag: null,
			});
		}
	}

	/**
	 * Records the end tag of an element.
	 */
	public endTag(element: Element, start: number, end: number): void {
		if (this._depth === 0) {
			const position = this._positions.get(element);
			if (position?.type === 'element') {
				position.endTag = this._span(start, end);
			}
		}
	}

	/**
	 * Records an attribute that is written in a start tag or empty-element tag.
	 */
	public attribute(attr: Attr, start: number, valueStart: number, valueEnd: number): void {
		if (this._depth === 0) {
			this._positions.set(attr, {
				type: 'attribute',
				span: this._span(start, valueEnd),
				value: this._span(valueStart, valueEnd),
			});
		}
	}
}
