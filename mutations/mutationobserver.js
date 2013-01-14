define(
	[
		'lodash'
	],
	function(_) {
		function MutationObserver(callback) {
			this.callback = callback;
			this.recordQueue = [];

			this.targets = [];
		}
		MutationObserver.prototype = {};
		MutationObserver.prototype.constructor = MutationObserver;

		function isRegisteredObserverForObserver(entry) {
			return entry.observer === this;
		}

		MutationObserver.prototype.observe = function(target, options) {
			if (_.contains(this.targets, target)) {
				// Already registered for this target, update the options
				var registeredObserver = _.find(
					target.registeredObservers,
					isRegisteredObserverForObserver,
					this);
				registeredObserver.options = options;
				return;
			}

			// Register observer for this target
			this.targets.push(target);
			target.registeredObservers.push({
				observer: this,
				options: options
			});
		};

		MutationObserver.prototype.disconnect = function() {
			// Disconnect from each target
			for (var i = 0, l = this.targets.length; i < l; ++i) {
				var target = this.targets[i];
				// Remove the corresponding registered observer for this target
				target.registeredObservers = _.reject(target.registeredObservers, isRegisteredObserverForObserver, this);
			}
			this.targets = [];
			// Empty the record queue
			this.recordQueue = [];
		};

		MutationObserver.prototype.takeRecords = function() {
			var recordQueue = this.recordQueue;
			this.recordQueue = [];
			return recordQueue;
		};

		return MutationObserver;
	}
);
