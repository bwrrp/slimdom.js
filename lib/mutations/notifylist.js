if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

		function NotifyList() {
			this.notifyList = [];

			this.scheduled = null;

			this.callbacks = [];
			this.callbackQueues = [];
		}

		NotifyList.prototype.queueRecord = function(observer, record) {
			// Only queue the same record once per observer
			if (observer.recordQueue[observer.recordQueue.length - 1] === record)
				return;

			observer.recordQueue.push(record);
			this.notifyList.push(observer);
			this.scheduleInvoke();
		};

		NotifyList.prototype.clear = function() {
			for (var i = 0, l = this.notifyList.length; i < l; ++i) {
				// Empty all record queues
				var observer = this.notifyList[i];
				observer.takeRecords();
			}

			// Clear the notify list
			this.notifyList.length = 0;
		};

		var hasSetImmediate = (typeof setImmediate === 'function');
		function schedule(callback, thisArg) {
			return (hasSetImmediate ? setImmediate : setTimeout)(function() {
				callback.call(thisArg);
			}, 0);
		}

		NotifyList.prototype.scheduleInvoke = function() {
			if (this.scheduled)
				return;

			this.scheduled = schedule(function() {
				this.scheduled = null;
				this.invokeMutationObservers();
			}, this);
		};

		function removeTransientRegisteredObserversForObserver(observer) {
			// Remove all transient registered observers for this observer
			// Process in reverse order, as the targets array may change during traversal
			for (var i = observer.targets.length - 1; i >= 0; --i) {
				observer.targets[i].registeredObservers.removeTransients(observer);
			}
		}

		NotifyList.prototype.invokeMutationObservers = function() {
			// Process notify list
			var numCallbacks = 0;
			for (var i = 0, l = this.notifyList.length; i < l; ++i) {
				var observer = this.notifyList[i],
					queue = observer.takeRecords();

				if (!queue.length) {
					removeTransientRegisteredObserversForObserver(observer);
					continue;
				}

				// Observer has records, schedule its callback
				++numCallbacks;
				schedule(function() {
					try {
						// According to the spec, transient registered observers for observer
						// should be removed just before its callback is called.
						removeTransientRegisteredObserversForObserver(observer);
						observer.callback.call(null, queue, observer);
					} finally {
						--numCallbacks;
						if (!numCallbacks) {
							// Callbacks may have queued additional mutations, check again later
							this.scheduleInvoke();
						}
					}
				}, this);
			}

			this.notifyList.length = 0;
		};

		return NotifyList;
	}
);
