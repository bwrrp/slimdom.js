/**
 * @module slimdom
 */
define(
	[
		'./CharacterData',
		'./Node',
		'./util'
	],
	function(
		CharacterData,
		Node,
		util
		) {
		'use strict';

		/**
		 * The Text interface represents the textual content of an Element node. If an element has no markup within its
		 * content, it has a single child implementing Text that contains the element's text.  However, if the element
		 * contains markup, it is parsed into information items and Text nodes that form its children.
		 *
		 * New documents have a single Text node for each block of text. Over time, more Text nodes may be created as
		 * the document's content changes.  The Node.normalize() method merges adjacent Text objects back into a single
		 * node for each block of text.
		 *
		 * @class Text
		 * @extends CharacterData
		 *
		 * @constructor
		 *
		 * @param {String} [content=""]  Is a string representing the textual data contained in this object.
		 */
		function Text(content) {
			CharacterData.call(this, Node.TEXT_NODE, content);
		}
		Text.prototype = new CharacterData();
		Text.prototype.constructor = Text;

		/**
		 * Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
		 *
		 * After the split, the current node contains all the content up to the specified offset point, and a newly
		 * created node of the same type contains the remaining text.  The newly created node is returned to the caller.
		 * If the original node had a parent, the new node is inserted as the next sibling of the original node.
		 * If the offset is equal to the length of the original node, the newly created node has no data.
		 *
		 * Separated text nodes can be concatenated using the Node.normalize() method.
		 *
		 * @method splitText
		 *
		 * @param  {Number}  offset  The offset at which to split te textual content of the Text node
		 *
		 * @return {Text}    The new Text node containing the textual content after the offset
		 */
		Text.prototype.splitText = function(offset) {
			// Check offset
			var length = this.length;
			if (offset < 0) offset = 0;
			if (offset > length) offset = length;

			var count = length - offset,
				newData = this.substringData(offset, count),
				document = this.ownerDocument,
				newNode = document.createTextNode(newData),
				iRange, nRanges, range;

			// If the current node is part of a tree, insert the new node
			if (this.parentNode) {
				this.parentNode.insertBefore(newNode, this.nextSibling);

				// Update ranges
				var nodeIndex = util.getNodeIndex(this);
				for (iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
					range = document.ranges[iRange];
					if (range.startContainer === this.parentNode && range.startOffset === nodeIndex + 1)
						range.setStart(range.startContainer, range.startOffset + 1);
					if (range.endContainer === this.parentNode && range.endOffset === nodeIndex + 1)
						range.setEnd(range.endContainer, range.endOffset + 1);
					if (range.startContainer === this && range.startOffset > offset)
						range.setStart(newNode, range.startOffset - offset);
					if (range.endContainer === this && range.endOffset > offset)
						range.setEnd(newNode, range.endOffset - offset);
				}
			}

			// Truncate our own data
			this.deleteData(offset, count);

			if (!this.parentNode) {
				// Update ranges
				for (iRange = 0, nRanges = document.ranges.length; iRange < nRanges; ++iRange) {
					range = document.ranges[iRange];
					if (range.startContainer === this && range.startOffset > offset)
						range.setStart(range.startContainer, offset);
					if (range.endContainer === this && range.endOffset > offset)
						range.setEnd(range.endContainer, offset);
				}
			}

			// Return the new node
			return newNode;
		};

		/**
		 * Override cloneNode to pass a new Text as a shallow copy to ensure the cloned node that is returned is a
		 * Text node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new Text node with the same nodeValue (content) as the current Text.
		 *
		 * @return {Node}     The clone.
		 */
		Text.prototype.cloneNode = function(deep, copy) {
			copy = copy || new Text(this.data);

			return CharacterData.prototype.cloneNode.call(this, deep, copy);
		};

		return Text;
	}
);
