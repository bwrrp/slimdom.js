if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./document',
		'./node',
		'./mutations/mutationobserver'
	],
	function(Document, Node, MutationObserver) {
		'use strict';

		return {
			createDocument: function() {
				return new Document();
			},

			Document: Document,
			Node: Node,
			MutationObserver: MutationObserver
		};
	}
);
