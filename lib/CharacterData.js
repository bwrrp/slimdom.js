if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Node',
		'./mutations/MutationRecord',
		'./util'
	],
	function(
		Node,
		MutationRecord,
		util,

		undefined) {
		'use strict';

		/**
		 * The CharacterData abstract interface represents a Node object that contains characters. This is an abstract
		 * interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces,
		 * like Text, Comment, or ProcessingInstruction which aren't abstract.
		 *
		 * @class CharacterData
		 * @extends Node
		 * 
		 * @constructor
		 *
		 * @param  {number}  type  The Node type to assign to this CharacterData object
		 * @param  {string}  data  Is a string representing the textual data contained in this object.
		 */
		function CharacterData(type, data) {
			if (!arguments.length) return;

			Node.call(this, type);
			/**
			 * nodeValue is a string representing the textual data contained in this CharacterData node.
			 *
			 * NOTE: we'll use 'nodeValue' here instead of the standard 'data' to avoid having duplicate accessors.
			 *
			 * @property nodeValue
			 * @type {string}
			 * @readOnly
			 */
			this.nodeValue = data || '';
		}
		CharacterData.prototype = new Node();
		CharacterData.prototype.constructor = CharacterData;

		/**
		 * Returns a number representing the size of the string contained in CharacterData.nodeValue.
		 *
		 * @method length
		 * 
		 * @return {number}  The length of the string used as textual data for this CharacterData node.
		 */
		CharacterData.prototype.length = function() {
			return this.nodeValue.length;
		};

		/**
		 * Returns a string containing the part of CharacterData.nodeValue of the specified length and starting at the
		 * specified offset.
		 *
		 * @method substringData
		 * 
		 * @param  {number}  offset   An integer between 0 and the length of the string.
		 * @param  {number}  [count]  An integer between 0 and the length of the string.
		 * 
		 * @return {string}          The substring extracted from the textual data of this CharacterData node.
		 */
		CharacterData.prototype.substringData = function(offset, count) {
			return this.nodeValue.substr(offset, count);
		};

		/**
		 * Appends the given string to the CharacterData.nodeValue string; when this method returns, data contains the
		 * concatenated string.
		 *
		 * @method  appendData
		 * 
		 * @param  {string}  data  Is a string representing the textual data to append to the CharacterData node.
		 */
		CharacterData.prototype.appendData = function(data) {
			this.replaceData(this.length(), 0, data);
		};

		/**
		 * Inserts the specified characters, at the specified offset, in the CharacterData.data string; when this method
		 * returns, data contains the modified string.
		 *
		 * @method insertData
		 * 
		 * @param  {number}  offset  An integer between 0 and the length of the string.
		 * @param  {string}  data    Is a string representing the textual data to insert into the CharacterData node.
		 */
		CharacterData.prototype.insertData = function(offset, data) {
			this.replaceData(offset, 0, data);
		};

		/**
		 * Removes the specified amount of characters, starting at the specified offset, from the CharacterData.data
		 * string; when this method returns, data contains the shortened string.
		 *
		 * @method deleteData
		 * 
		 * @param  {number}  offset   An integer between 0 and the length of the string.
		 * @param  {number}  [count]  An integer between 0 and the length of the string. Omitting count means 'delete
		 * from offset to end'
		 */
		CharacterData.prototype.deleteData = function(offset, count) {
			// Omitting count means 'delete from offset to end'
			if (count === undefined) count = this.length() - offset;
			this.replaceData(offset, count, '');
		};

		/**
		 * Replaces the specified amount of characters, starting at the specified offset, with the specified string;
		 * when this method returns, data contains the modified string.
		 *
		 * @method replaceData
		 * 
		 * @param  {number}  offset  An integer between 0 and the length of the string.
		 * @param  {number}  count   An integer between 0 and the length of the string.
		 * @param  {string}  data    Is a string representing the textual data to use as replacement for the
		 * CharacterData node.
		 */
		CharacterData.prototype.replaceData = function(offset, count, data) {
			var length = this.length();

			if (offset > length)
				offset = length;

			if (offset + count > length)
				count = length - offset;

			// Queue mutation record
			var record = new MutationRecord('characterData', this);
			record.oldValue = this.nodeValue;
			util.queueMutationRecord(record);

			// Replace data
			var before = this.substringData(0, offset),
				after = this.substringData(offset + count);
			this.nodeValue = before + data + after;

			// Update ranges
			var document = this.ownerDocument || this;
			for (var iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
				var range = document.ranges[iRange];
				if (range.startContainer === this && range.startOffset > offset && range.startOffset <= offset + count)
					range.setStart(range.startContainer, offset);
				if (range.endContainer === this && range.endOffset > offset && range.endOffset <= offset + count)
					range.setEnd(range.endContainer, offset);
				var startOffset = range.startOffset,
					endOffset = range.endOffset;
				if (range.startContainer === this && startOffset > offset + count) {
					range.setStart(range.startContainer, startOffset - count + data.length);
				}
				if (range.endContainer === this && endOffset > offset + count) {
					range.setEnd(range.endContainer, endOffset - count + data.length);
				}
			}
		};

		return CharacterData;
	}
);
