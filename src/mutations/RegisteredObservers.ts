import MutationObserver from './MutationObserver';
import MutationRecord from './MutationRecord';
import RegisteredObserver from './RegisteredObserver';
import Node from '../Node';

/**
 * This is an internal helper class that is used to work with a MutationObserver.
 *
 * Each node has an associated list of registered observers. A registered observer consists of an observer
 * (a MutationObserver object) and options (a MutationObserverInit dictionary). A transient registered observer
 * is a specific type of registered observer that has a source which is a registered observer.
 */
export default class RegisteredObservers {
	/**
	 * The node for which this RegisteredObservers lists registered MutationObserver objects.
	 */

	private _target: Node;

	private _registeredObservers: RegisteredObserver[] = [];

	/**
	 * @param target Node for which this instance holds RegisteredObserver instances.
	 */
	constructor (target: Node) {
		this._target = target;
	}

	/**
	 * Registers a given MutationObserver with the given options.
	 *
	 * @param observer    Observer to create a registration for
	 * @param options     Options for the registration
	 * @param isTransient Whether the registration is automatically removed when control returns to the event loop
	 */
	public register (observer: MutationObserver, options: MutationObserverInit, isTransient: boolean) {
		// Ensure our node is in the observer's list of targets
		if (observer._targets.indexOf(this._target) < 0) {
			observer._targets.push(this._target);
		}

		if (!isTransient) {
			// Replace options for existing registered observer, if any
			for (var i = 0, l = this._registeredObservers.length; i < l; ++i) {
				var registeredObserver = this._registeredObservers[i];
				if (registeredObserver.observer !== observer) {
					continue;
				}

				if (registeredObserver.isTransient) {
					continue;
				}

				registeredObserver.options = options;
				return;
			}
		}

		this._registeredObservers.push(new RegisteredObserver(observer, this._target, options, isTransient));
	}

	/**
	 * Creates transient registrations for all subtree observers on an ancestor of our target when target nodes are
	 * removed from under that ancestor.
	 *
	 * @param registeredObserversForAncestor Registrations for an ancestor of our target
	 */
	public appendTransientsForAncestor (registeredObserversForAncestor: RegisteredObservers) {
		registeredObserversForAncestor._registeredObservers.forEach(ancestorRegisteredObserver => {
			// Only append transients for subtree observers
			if (!ancestorRegisteredObserver.options.subtree) {
				return;
			}

			this.register(ancestorRegisteredObserver.observer, ancestorRegisteredObserver.options, true);
		});
	};

	/**
	 * @param observer       Observer for which to remove the registration
	 * @param transientsOnly Whether to remove only transient registrations
	 *
	 * @return Whether any non-transient registrations were not removed because transientsOnly was set to true
	 */
	public removeObserver (observer: MutationObserver, transientsOnly: boolean = false): boolean {
		// Remove all registered observers for this observer
		let write = 0;
		let hasMore = false;
		for (let read = 0, l = this._registeredObservers.length; read < l; ++read) {
			const registeredObserver = this._registeredObservers[read];
			if (registeredObserver.observer === observer) {
				if (!transientsOnly || registeredObserver.isTransient) {
					continue;
				}
				// Record the fact a non-transient registered observer was skipped
				if (!registeredObserver.isTransient) {
					hasMore = true;
				}
			}

			if (read !== write) {
				this._registeredObservers[write] = registeredObserver;
			}
			++write;
		}
		this._registeredObservers.length = write;

		return hasMore;
	}

	/**
	 * @param observer Observer to remove any transient registrations for
	 */
	public removeTransients (observer: MutationObserver) {
		const hasNonTransients = this.removeObserver(observer, true);
		if (!hasNonTransients) {
			// Remove target from observer
			var targetIndex = observer._targets.indexOf(this._target);
			if (targetIndex >= 0) {
				observer._targets.splice(targetIndex, 1);
			}
		}
	}

	/**
	 * Queues a given MutationRecord on each registered MutationObserver in this list of registered observers.
	 *
	 * @param mutationRecord Record to enqueue
	 */
	public queueRecord (mutationRecord: MutationRecord) {
		this._registeredObservers.forEach(registeredObserver => registeredObserver.queueRecord(mutationRecord));
	}
}
