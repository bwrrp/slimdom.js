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

	constructor (target: Node) {
		this._target = target;
	}

	/**
	 * Registers a given MutationObserver with the given options.
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

	public appendTransientsForAncestor (registeredObserversForAncestor: RegisteredObservers) {
		registeredObserversForAncestor._registeredObservers.forEach(ancestorRegisteredObserver => {
			// Only append transients for subtree observers
			if (!ancestorRegisteredObserver.options.subtree) {
				return;
			}

			this.register(ancestorRegisteredObserver.observer, ancestorRegisteredObserver.options, true);
		});
	};

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
	 */
	public queueRecord (mutationRecord: MutationRecord) {
		this._registeredObservers.forEach(registeredObserver => registeredObserver.queueRecord(mutationRecord));
	}
}
