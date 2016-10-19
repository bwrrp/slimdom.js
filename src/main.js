/**
 * Fast, tiny DOM implementation in pure JS.
 * This module provides an API object which exposes the usual entry points for this library.
 *
 * TODO: add more high level explanation of what, how, why (Slim)DOM, possibly add examples?
 *
 * @module slimdom
 */
define(
	[
		'./Document',
		'./Node',
		'./Element',
		'./selections/Range',
		'./mutations/MutationObserver',

		'./DOMImplementation',
		'./globals'
	],
	function(
		Document,
	 	Node,
		Element,
		Range,
	 	MutationObserver,

	 	DOMImplementation,
	 	globals
	 	) {
		'use strict';

		// Create a single DOMImplementation instance shared by the entire library
		var domImplementation = globals.domImplementation = new DOMImplementation();

		/**
		 * The API object for the slimdom library.
		 *
		 * @class API
		 * @static
		 */
		return {
			/**
			 * The DOMImplementation instance.
			 *
			 * @property implementation
			 * @type {DOMImplementation}
			 * @final
			 */
			implementation: domImplementation,

			/**
			 * Creates a new Document and returns it.
			 *
			 * @method createDocument
			 *
			 * @return {Document} The newly created Document.
			 */
			createDocument: function() {
				return domImplementation.createDocument('');
			},

			/**
			 * The Document class constructor.
			 *
			 * @property Document
			 * @type {Function}
			 * @final
			 */
			Document: Document,
			/**
			 * The Node class constructor.
			 *
			 * @property Node
			 * @type {Function}
			 * @final
			 */
			Node: Node,
			/**
			 * The Element class constructor.
			 *
			 * @property Element
			 * @type {Function}
			 * @final
			 */
			Element: Element,
			/**
			 * The Range class constructor.
			 *
			 * @property Range
			 * @type {Function}
			 * @final
			 */
			Range: Range,
			/**
			 * The MutationObserver class constructor.
			 *
			 * @property MutationObserver
			 * @type {Function}
			 * @final
			 */
			MutationObserver: MutationObserver
		};
	}
);
