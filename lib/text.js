if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./CharacterData',
		'./Node',

		'lodash'
	],
	function(CharacterData,
			 Node,

			 _) {
		'use strict';

		// Text node
		function Text(content) {
			CharacterData.call(this, Node.TEXT_NODE, content);
		}
		Text.prototype = new CharacterData();
		Text.prototype.constructor = Text;

		// Breaks the Text node into two nodes at the specified offset, keeping both nodes in the tree as siblings.
		Text.prototype.splitText = function(offset) {
			// Check offset
			var length = this.length();
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
				var nodeIndex = _.indexOf(this.parentNode.childNodes, this);
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

		// Returns a copy of node. If deep is true or omitted, the copy also includes the node's children.
		Text.prototype.cloneNode = function(deep) {
			return CharacterData.prototype.cloneNode.call(this, deep, new Text(this.nodeValue));
		};

		return Text;
	}
);
