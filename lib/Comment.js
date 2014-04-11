/**
 * @module slimdom
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./CharacterData',
		'./Node'
	],
	function(
		CharacterData,
	 	Node) {
		'use strict';

		/**
		 * The Comment interface represents textual notations within markup; although it is generally not visually
		 * shown, such comments are available to be read in the source view. Comments are represented in HTML and
		 * XML as content between '&lt;!--' and '--&gt;'. In XML, the character sequence '--' cannot be used within
		 * a comment.
		 *
		 * @class Comment
		 * @extends CharacterData
		 * 
		 * @constructor
		 *
		 * @param {String}  [data]  The comment's text.
		 */
		function Comment(data) {
			CharacterData.call(this, Node.COMMENT_NODE, data || '');
		}
		Comment.prototype = new CharacterData();
		Comment.prototype.constructor = Comment;

		/**
		 * Override cloneNode to pass a new Comment as a shallow copy to ensure the cloned node that is
		 * returned is a Comment node.
		 *
		 * @method cloneNode
		 *
		 * @param  {Boolean}  [deep=true]  If deep is true or omitted, the copy also includes the node's children.
		 * @param  {Node}     [copy]       A new Comment node with the same nodeValue (data)
		 *                                   as the current Comment.
		 *
		 * @return {Node}     The clone.
		 */
		Comment.prototype.cloneNode = function(deep, copy) {
			copy = copy || new Comment(this.nodeValue);

			return CharacterData.prototype.cloneNode.call(this, deep, copy);
		};

		return Comment;
	}
);
