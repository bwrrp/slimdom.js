if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./registeredobserver'
	],
	function(RegisteredObserver) {
		'use strict';

		function RegisteredObservers(node) {
			this.target = node;
			this.registeredObservers = [];
		}

		RegisteredObservers.prototype.register = function(observer, options, isTransient) {
			// Ensure our node is in the observer's list of targets
			if (observer.targets.indexOf(this.target) < 0)
				observer.targets.push(this.target);

			if (!isTransient) {
				// Replace options for existing registered observer, if any
				for (var i = 0, l = this.registeredObservers.length; i < l; ++i) {
					var registeredObserver = this.registeredObservers[i];
					if (registeredObserver.observer !== observer)
						continue;

					if (registeredObserver.isTransient)
						continue;

					registeredObserver.options = options;
					return;
				}
			}

			this.registeredObservers.push(new RegisteredObserver(observer, this.target, options, isTransient));
		};

		RegisteredObservers.prototype.appendTransientsForAncestor = function(registeredObserversForAncestor) {
			for (var i = 0, l = registeredObserversForAncestor.registeredObservers.length; i < l; ++i) {
				// Only append transients for subtree observers
				var ancestorRegisteredObserver = registeredObserversForAncestor.registeredObservers[i];
				if (!ancestorRegisteredObserver.options.subtree)
					continue;

				this.register(ancestorRegisteredObserver.observer, ancestorRegisteredObserver.options, true);
			}
		};

		RegisteredObservers.prototype.removeObserver = function(observer, transientsOnly) {
			// Remove all registered observers for this observer
			var write = 0;
			for (var read = 0, l = this.registeredObservers.length; read < l; ++read) {
				var registeredObserver = this.registeredObservers[read];
				if (registeredObserver.observer === observer &&
					(!transientsOnly || registeredObserver.isTransient)) {
					continue;
				}

				if (read !== write)
					this.registeredObservers[write] = registeredObserver;
				++write;
			}
			this.registeredObservers.length = write;
		};

		RegisteredObservers.prototype.removeTransients = function(observer) {
			this.removeObserver(observer, true);
		};

		RegisteredObservers.prototype.queueRecord = function(mutationRecord) {
			for (var i = 0, l = this.registeredObservers.length; i < l; ++i) {
				var registeredObserver = this.registeredObservers[i];
				registeredObserver.queueRecord(mutationRecord);
			}
		};

		return RegisteredObservers;
	}
);
