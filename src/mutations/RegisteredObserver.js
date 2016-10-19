/**
 * @submodule mutations
 */
define(
	function() {
		'use strict';

		/**
		 * This is an internal helper class that is used to work with a MutationObserver.
		 *
		 * Each node has an associated list of registered observers. A registered observer consists of an observer
		 * (a MutationObserver object) and options (a MutationObserverInit dictionary). A transient registered observer
		 * is a specific type of registered observer that has a source which is a registered observer.
		 *
		 * @class RegisteredObserver
		 * @private
		 *
		 * @constructor
		 *
		 * @param  {MutationObserver}  observer     The observer that is registered.
		 * @param  {Node}              target       The Node that is being observed by the given observer.
		 * @param  {Object}            options      An options object (formally a MutationObserverInit object, but just
		 * a plain js object in Slimdom) which specifies which DOM mutations should be reported. TODO: add options
		 * property docs.
		 * @param  {Boolean}           isTransient  A transient observer is an observer that has a source which is an
		 * observer. TODO: clarify the "source" keyword in this context.
		 */
		function RegisteredObserver(observer, target, options, isTransient) {
			/**
			 * The observer that is registered.
			 *
			 * @property observer
			 * @type  {MutationObserver}
			 * @final
			 */
			this.observer = observer;

			/**
			 * The Node that is being observed by the given observer.
			 *
			 * @property target
			 * @type  {Node}
			 * @final
			 */
			this.target = target;

			/**
			 * An options object (formally a MutationObserverInit object, but just a plain js object in Slimdom) which
			 * specifies which DOM mutations should be reported. TODO: add options property docs.
			 *
			 * @property options
			 * @type  {MutationObserver}
			 * @final
			 */
			this.options = options;

			/**
			 * A transient observer is an observer that has a source which is an observer. TODO: clarify the "source"
			 * keyword in this context.
			 *
			 * @property isTransient
			 * @type  {Boolean}
			 * @final
			 */
			this.isTransient = isTransient;
		}

		/**
		 * Adds the given mutationRecord to the NotifyList of the registered MutationObserver. It only adds the record
		 * when it's type isn't blocked by one of the flags of this registered MutationObserver options (formally the
		 * MutationObserverInit object). TODO: add options property docs.
		 *
		 * @method queueRecord
		 *
		 * @param  {MutationRecord}  mutationRecord  The record that gets added if it matches the registered observer's
		 * options flags.
		 */
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
