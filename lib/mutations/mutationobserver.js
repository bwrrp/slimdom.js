if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./notifylist'
	],
	function(NotifyList) {
		'use strict';

		function MutationObserver(callback) {
			this.callback = callback;
			this.recordQueue = [];

			this.targets = [];

			// Expose the notifyList
			this.notifyList = MutationObserver.notifyList;
		}
		MutationObserver.prototype = {};
		MutationObserver.prototype.constructor = MutationObserver;

		// Global list of active mutation observers
		MutationObserver.notifyList = new NotifyList();

		MutationObserver.prototype.observe = function(target, options, isTransient) {
			target.registeredObservers.register(this, options, isTransient);
		};

		MutationObserver.prototype.disconnect = function() {
			// Disconnect from each target
			for (var i = 0, l = this.targets.length; i < l; ++i) {
				var target = this.targets[i];
				// Remove the corresponding registered observer for this target
				target.registeredObservers.removeObserver(this);
			}
			this.targets.length = 0;

			// Empty the record queue
			this.recordQueue.length = 0;
		};

		MutationObserver.prototype.takeRecords = function() {
			var recordQueue = this.recordQueue;
			this.recordQueue = [];
			return recordQueue;
		};

		return MutationObserver;
	}
);
