/**
 * @submodule mutations
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./RegisteredObserver'
	],
	function(RegisteredObserver) {
		'use strict';

		/**
		 * This is an internal helper class that is used to work with a MutationObserver.
		 *
		 * Each node has an associated list of registered observers. A registered observer consists of an observer
		 * (a MutationObserver object) and options (a MutationObserverInit dictionary). A transient registered observer
		 * is a specific type of registered observer that has a source which is a registered observer.
		 *
		 * @class RegisteredObservers
		 * @private
		 *
		 * @constructor
		 *
		 * @param  {Node}  node  The node for which this RegisteredObservers lists registered MutationObserver objects.
		 */
		function RegisteredObservers(node) {
			/**
			 * The node for which this RegisteredObservers lists registered MutationObserver objects.
			 *
			 * @property target
			 * @type {Node}
			 * @final
			 */
			this.target = node;

			/**
			 * The actual list of registered MutationObserver objects.
			 *
			 * @property registeredObservers
			 * @type {MutationObserver[]}
			 * @final
			 */
			this.registeredObservers = [];
		}

		/**
		 * Registers a given MutationObserver with the given options.
		 *
		 * @method register
		 *
		 * @param  {MutationObserver}  observer     The observer that is registered.
		 * @param  {Object}            options      An options object (formally a MutationObserverInit object, but just
		 * a plain js object in Slimdom) which specifies which DOM mutations should be reported. TODO: add options
		 * property docs.
		 * @param  {Boolean}           isTransient  A transient observer is an observer that has a source which is an
		 * observer. TODO: clarify the "source" keyword in this context.
		 */
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

		/**
		 * TODO: add a description about the what, how and why of this method.
		 *
		 * @method appendTransientsForAncestor
		 *
		 * @param  {RegisteredObserver[]}  registeredObserversForAncestor  A list of RegisterObserver objects. TODO:
		 * clarify this some more.
		 */
		RegisteredObservers.prototype.appendTransientsForAncestor = function(registeredObserversForAncestor) {
			for (var i = 0, l = registeredObserversForAncestor.registeredObservers.length; i < l; ++i) {
				// Only append transients for subtree observers
				var ancestorRegisteredObserver = registeredObserversForAncestor.registeredObservers[i];
				if (!ancestorRegisteredObserver.options.subtree)
					continue;

				this.register(ancestorRegisteredObserver.observer, ancestorRegisteredObserver.options, true);
			}
		};

		/**
		 * TODO: add a description about the what, how and why of this method.
		 *
		 * @method appendTransientsForAncestor
		 *
		 * @param  {MutationObserver}  observer  The observer to remove from this list.
		 * @param  {Boolean}  transientsOnly  Whether or not to remove any transient MutationObserver objects. TODO:
		 * clarify this some more.
		 */
		RegisteredObservers.prototype.removeObserver = function(observer, transientsOnly) {
			// Remove all registered observers for this observer
			var write = 0,
				hasMore = false;
			for (var read = 0, l = this.registeredObservers.length; read < l; ++read) {
				var registeredObserver = this.registeredObservers[read];
				if (registeredObserver.observer === observer) {
					if (!transientsOnly || registeredObserver.isTransient) {
						continue;
					}
					// Record the fact a non-transient registered observer was skipped
					if (!registeredObserver.isTransient)
						hasMore = true;
				}

				if (read !== write)
					this.registeredObservers[write] = registeredObserver;
				++write;
			}
			this.registeredObservers.length = write;

			return hasMore;
		};

		/**
		 * TODO: add a description about the what, how and why of this method.
		 *
		 * @method removeTransients
		 *
		 * @param  {MutationObserver}  observer  The observer to remove from this list.
		 */
		RegisteredObservers.prototype.removeTransients = function(observer) {
			var hasNonTransients = this.removeObserver(observer, true);
			if (!hasNonTransients) {
				// Remove target from observer
				var targetIndex = observer.targets.indexOf(this.target);
				if (targetIndex >= 0)
					observer.targets.splice(targetIndex, 1);
			}
		};

		/**
		 * Queues a given MutationRecord on each registered MutationObserver in this list of registered observers.
		 *
		 * @method queueRecord
		 *
		 * @param  {MutationRecord}  mutationRecord  The record to queue on each of the MutationObserver objects in this
		 * list of registered observers.
		 */
		RegisteredObservers.prototype.queueRecord = function(mutationRecord) {
			for (var i = 0, l = this.registeredObservers.length; i < l; ++i) {
				var registeredObserver = this.registeredObservers[i];
				registeredObserver.queueRecord(mutationRecord);
			}
		};

		return RegisteredObservers;
	}
);
