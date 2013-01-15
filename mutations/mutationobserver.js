define(
	[
		'lodash'
	],
	function(_) {
		// Global list of active mutation observers
		var notifyList = [];

		function MutationObserver(callback) {
			this.callback = callback;
			this.recordQueue = [];

			this.targets = [];
		}
		MutationObserver.prototype = {};
		MutationObserver.prototype.constructor = MutationObserver;

		// Helper: whether this refers to the given registered observer's observer
		function isRegisteredObserverForObserver(entry) {
			return entry.observer === this;
		}

		MutationObserver.prototype.observe = function(target, options, isTransient) {
			// Add observer to notify list
			if (!_.contains(notifyList, this)) {
				notifyList.push(this);
			}

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
				options: options,
				isTransient: isTransient
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

			// Remove the observer from the notify list
			notifyList = _.without(notifyList, this);
		};

		MutationObserver.prototype.takeRecords = function() {
			var recordQueue = this.recordQueue;
			this.recordQueue = [];
			return recordQueue;
		};

		// Helper: whether the given registered observer is a transient registered observer whose observer is this
		function isTransientRegisteredObserverForObserver(entry) {
			return entry.isTransient && isRegisteredObserverForObserver.call(this);
		}

		// Helper: whether the given mutation observer has a non-empty record queue
		function hasNonEmptyRecordQueue(mo) {
			return !!mo.recordQueue.length;
		}

		// Invokes callbacks for all active mutation observers
		MutationObserver.invoke = function() {
			for (var iMo = 0, nMo = notifyList.length; iMo < nMo; ++iMo) {
				var mo = notifyList[iMo],
					queue = mo.takeRecords();
				// Remove all transient registered observers for this observer
				for (var iTarget = 0, nTargets = mo.targets.length; iTarget < nTargets; ++iTarget) {
					var node = mo.targets[iTarget];
					node.registeredObservers = _.reject(node.registeredObservers,
						isTransientRegisteredObserverForObserver, this);
				}
				// Invoke callback
				if (queue.length)
					mo.callback.call(null, queue, mo);
			}
			// If any MutationObserver has a non-empty record queue, schedule invoke again
			if (_.any(notifyList, hasNonEmptyRecordQueue))
				setTimeout(MutationObserver.invoke, 0);
		};

		return MutationObserver;
	}
);
