define(
	[
		'./document',
		'./node',
		'./mutations/mutationobserver'
	],
	function(Document, Node, MutationObserver) {
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
