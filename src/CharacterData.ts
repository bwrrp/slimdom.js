import Document from './Document';
import Node from './Node';

import MutationRecord from './mutations/MutationRecord';
import queueMutationRecord from './mutations/queueMutationRecord';

/**
 * The CharacterData abstract interface represents a Node object that contains characters. This is an abstract
 * interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces,
 * like Text, Comment, or ProcessingInstruction which aren't abstract.
 */
export default class CharacterData extends Node {
	private _data: string;

	public get data (): string {
		return this._data;
	}

	public set data (newValue: string) {
		this.replaceData(0, this._data.length, newValue);
	}

	/**
	 * Alias for data.
	 */
	public get nodeValue (): string {
		return this._data;
	}

	/**
	 * The length of the string used as textual data for this CharacterData node.
	 */
	public get length (): number {
		return this._data.length;
	}

	constructor (type: number, data: string) {
		super(type);
		
		this._data = data;
	}

	/**
	 * Returns a string containing the part of CharacterData.data of the specified length and starting at the
	 * specified offset.
	 * 
	 * If count is omitted, returns all data starting at offset.
	 */
	public substringData (offset: number, count?: number): string {
		return this._data.substr(offset, count);
	}

	/**
	 * Appends the given string to the CharacterData.data string; when this method returns, data contains the
	 * concatenated string.
	 */
	public appendData (data: string) {
		this.replaceData(this.length, 0, data);
	}

	/**
	 * Inserts the specified characters, at the specified offset, in the CharacterData.data string; when this method
	 * returns, data contains the modified string.
	 */
	public insertData (offset: number, data: string) {
		this.replaceData(offset, 0, data);
	}

	/**
	 * Removes the specified amount of characters, starting at the specified offset, from the CharacterData.data
	 * string; when this method returns, data contains the shortened string.
	 * 
	 * Omitting count deletes from offset to the end of data.
	 */
	public deleteData (offset: number, count: number = this.length) {
		this.replaceData(offset, count, '');
	}

	/**
	 * Replaces the specified amount of characters, starting at the specified offset, with the specified string;
	 * when this method returns, data contains the modified string.
	 */
	public replaceData (offset: number, count: number, data: string) {
		const length = this.length;
		if (offset > length) {
			offset = length;
		}

		if (offset + count > length) {
			count = length - offset;
		}

		const before = this.substringData(0, offset);
		const after = this.substringData(offset + count);
		const newData = before + data + after;

		if (newData !== this._data) {
			// Queue mutation record
			var record = new MutationRecord('characterData', this);
			record.oldValue = this._data;
			queueMutationRecord(record);

			// Replace data
			this._data = newData;
		}

		// Update ranges
		var document = this.ownerDocument as Document;
		document._ranges.forEach(range => {
			if (range.startContainer === this && range.startOffset > offset && range.startOffset <= offset + count) {
				range.setStart(range.startContainer, offset);
			}
			if (range.endContainer === this && range.endOffset > offset && range.endOffset <= offset + count) {
				range.setEnd(range.endContainer, offset);
			}
			const startOffset = range.startOffset;
			const endOffset = range.endOffset;
			if (range.startContainer === this && startOffset > offset + count) {
				range.setStart(range.startContainer, startOffset - count + data.length);
			}
			if (range.endContainer === this && endOffset > offset + count) {
				range.setEnd(range.endContainer, endOffset - count + data.length);
			}
		});
	}
}
