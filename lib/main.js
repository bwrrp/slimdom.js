/**
 * define description 3
 * @namespace slimdom
 * @module slimdom
 * @class slimdom
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
		 * @name slimdom
		 * @memberOf slimdom#
		 * @property {Document} Document - Constructor for the Document object
		 * @property {Node} Node - Constructor for the Node object
		 * @property {MutationObserver} MutationObserver - Constructor for the MutationObserver object
		 */
		return {
			/**
			 * Constructor function for the Document object
			 * @memberOf slimdom#
			 * @return {Document} The newly created Document object
			 */
			createDocument: function() {
				return new Document();
			},

			Document: Document,
			Node: Node,
			MutationObserver: MutationObserver
		};
	}
);
