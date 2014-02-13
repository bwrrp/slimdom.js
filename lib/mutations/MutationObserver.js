/**
 * The mutations submodule defines the MutationObserver object and related objects.
 * MutationObserver provides developers a way to react to changes in a DOM. It is designed as a replacement for
 * Mutation Events defined in the DOM3 Events specification.
 *
 * TODO: add more high level explanation of what, how, why MutationObserver and MutationRecord, possibly add examples?
 *
 * @submodule mutations
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	[
		'./NotifyList'
	],
	function(NotifyList) {
		'use strict';

		/**
		 * A MutationObserver object can be used to observe mutations to the tree of nodes.
		 *
		 * @class MutationObserver
		 *
		 * @constructor
		 *
		 * @param  {Function}  callback  The function which will be called on each DOM mutation. The observer will call
		 * this function with two arguments. The first is an array of objects, each of type MutationRecord. The second
		 * is this MutationObserver instance.
		 */
		function MutationObserver(callback) {
			/**
			 * The function which will be called on each DOM mutation. The observer will call this function with two
			 * arguments. The first is an array of objects, each of type MutationRecord. The second is this
			 * MutationObserver instance.
			 *
			 * @property callback
			 * @type {Function}
			 * @final
			 */
			this.callback = callback;

			// not exposed, use takeRecords() instead
			this.recordQueue = [];

			/**
			 * A list of Node objects for which this MutationObserver is a registered observer.
			 *
			 * @property targets
			 * @type {Node[]}
			 * @final
			 */
			this.targets = [];

			/**
			 * The NotifyList instance that is shared between all MutationObserver objects. Each observer queues it's
			 * MutationRecord object on this list with a reference to itself.
			 * The NotifyList is then responsible for periodic reporting of these records to the observers.
			 *
			 * @property notifyList
			 * @type {NotifyList}
			 * @final
			 */
			this.notifyList = MutationObserver.notifyList;
		}
		MutationObserver.prototype = {};
		MutationObserver.prototype.constructor = MutationObserver;

		// Global list of active mutation observers
		MutationObserver.notifyList = new NotifyList();

		/**
		 * Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.
		 *
		 * <em>NOTE: Adding observer to an element is just like addEventListener, if you observe the element multiple
		 * times it does not make a difference. Meaning if you observe element twice, the observe callback does not fire
		 * twice, nor will you have to run disconnect() twice. In other words, once an element is observed, observing it
		 * again with the same will do nothing. However if the callback object is different it will of course add
		 * another observer to it.</em>
		 *
		 * @method observe
		 * 
		 * @param  {Node}     target       The Node on which to observe DOM mutations.
		 * @param  {Object}   options      An options object (formally a MutationObserverInit object, but just a plain js
		 * object in Slimdom) which specifies which DOM mutations should be reported. TODO: add options property docs.
		 * @param  {Boolean}  isTransient  A transient observer is an observer that has a source which is an observer.
		 * TODO: clarify the "source" keyword in this context.
		 */
		MutationObserver.prototype.observe = function(target, options, isTransient) {
			target.registeredObservers.register(this, options, isTransient);
		};

		/**
		 * Stops the MutationObserver instance from receiving notifications of DOM mutations. Until the observe() method
		 * is used again, observer's callback will not be invoked.
		 *
		 * @method disconnect
		 */
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

		/**
		 * Empties the MutationObserver instance's record queue and returns what was in there.
		 *
		 * @method takeRecords
		 *
		 * @return {MutationRecord[]}  An Array of MutationRecord objects that were recorded.
		 */
		MutationObserver.prototype.takeRecords = function() {
			var recordQueue = this.recordQueue;
			this.recordQueue = [];
			return recordQueue;
		};

		return MutationObserver;
	}
);
