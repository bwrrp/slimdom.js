if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

		function RegisteredObserver(observer, target, options, isTransient) {
			this.observer = observer;
			this.target = target;
			this.options = options;
			this.isTransient = isTransient;
		}

		RegisteredObserver.prototype.queueRecord = function(mutationRecord) {
			var options = this.options;

			// Only trigger ancestors if they are listening for subtree mutations
			if (mutationRecord.target !== this.target && !options.subtree)
				return;

			// Ignore attribute modifications if we're not listening for them
			if (!options.attributes && mutationRecord.type === 'attributes')
				return;

			// TODO: implement attribute filter?

			// Ignore user data modifications if we're not listening for them
			if (!options.userData && mutationRecord.type === 'userData')
				return;

			// Ignore character data modifications if we're not listening for them
			if (!options.characterData && mutationRecord.type === 'characterData')
				return;

			// Ignore child list modifications if we're not listening for them
			if (!options.childList && mutationRecord.type === 'childList')
				return;

			// Queue the record
			// TODO: we should probably make a copy here according to the options, but who cares about extra info?
			var notifyList = this.observer.notifyList;
			notifyList.queueRecord(this.observer, mutationRecord);
		};

		return RegisteredObserver;
	}
);