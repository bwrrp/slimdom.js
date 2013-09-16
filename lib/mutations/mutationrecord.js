if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

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
