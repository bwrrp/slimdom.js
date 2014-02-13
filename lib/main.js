/**
 * Fast, tiny DOM implementation in pure JS.
 * This module provides an API object which exposes the usual entry points for this library.
 *
 * TODO: add more high level explanation of what, how, why (Slim)DOM, possibly add examples?
 *
 * @module slimdom
 * @requires amdefine, lodash
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Document',
		'./Node',
		'./Element',
		'./selections/Range',
		'./mutations/MutationObserver'
	],
	function(
		Document,
	 	Node,
		Element,
		Range,
	 	MutationObserver) {
		'use strict';

		/**
		 * The API object for the slimdom library.
		 *
		 * @class API
		 * @static
		 */
		return {
			/**
			 * Creates a new Document and returns it.
			 *
			 * @method createDocument
			 * @return {Document} The newly created Document.
			 */
			createDocument: function() {
				return new Document();
			},
			/**
			 * The Document class constructor.
			 *
			 * @property Document
			 * @type {Function}
			 */
			Document: Document,
			/**
			 * The Node class constructor.
			 *
			 * @property Node
			 * @type {Function}
			 */
			Node: Node,
			/**
			 * The Element class constructor.
			 *
			 * @property Element
			 * @type {Function}
			 */
			Element: Element,
			/**
			 * The Range class constructor.
			 *
			 * @property Range
			 * @type {Function}
			 */
			Range: Range,
			/**
			 * The MutationObserver class constructor.
			 *
			 * @property MutationObserver
			 * @type {Function}
			 */
			MutationObserver: MutationObserver
		};
	}
);
