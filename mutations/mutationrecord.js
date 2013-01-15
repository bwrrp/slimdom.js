define(
	function() {
		function MutationRecord(type, target) {
			this.type = type;
			this.target = target;

			this.addedNodes = [];
			this.removedNodes = [];

			this.previousSibling = null;
			this.nextSibling = null;

			this.attributeName = null;

			this.oldValue = null;
		}

		return MutationRecord;
	}
);
