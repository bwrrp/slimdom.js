/**
 * Fast, tiny DOM implementation in pure JS.
 * This file provides an API object which exposes the usual entry points for this library.
 *
 * @module slimdom
 * @main
 * @requires amdefine, lodash
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./Document',
		'./Node',
		'./mutations/MutationObserver'
	],
	function(
		Document,
	 	Node,
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
			 * The MutationObserver class constructor.
			 *
			 * @property MutationObserver
			 * @type {Function}
			 */
			MutationObserver: MutationObserver
		};
	}
);
