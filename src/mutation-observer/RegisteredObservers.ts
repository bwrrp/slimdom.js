import { MutationObserverInit, default as MutationObserver } from './MutationObserver';
import { MutationRecordInit } from './MutationRecord';
import RegisteredObserver from './RegisteredObserver';
import Node from '../Node';

/**
 * Each node has an associated list of registered observers.
 */
export default class RegisteredObservers {
	/**
	 * The node for which this RegisteredObservers lists registered MutationObserver objects.
	 */
	private _node: Node;

	private _registeredObservers: RegisteredObserver[] = [];

	/**
	 * @param node - Node for which this instance holds RegisteredObserver instances.
	 */
	constructor(node: Node) {
		this._node = node;
	}

	/**
	 * Registers a given MutationObserver with the given options.
	 *
	 * @param observer - Observer to create a registration for
	 * @param options  - Options for the registration
	 */
	public register(observer: MutationObserver, options: MutationObserverInit) {
		// (continuing from MutationObserver#observe)
		// 7. For each registered registered of target’s registered observer list, if registered's
		// observer is this:
		const registeredObservers = this._registeredObservers;
		let hasRegisteredObserverForObserver = false;
		registeredObservers.forEach((registered) => {
			if (registered.observer !== observer) {
				return;
			}

			hasRegisteredObserverForObserver = true;

			// 7.1. For each node of this's node list, remove all transient registered
			// observers whose source is registered from node's registered observer list.
			removeTransientRegisteredObserversForSource(registered);

			// 7.2. Set registered’s options to options.
			registered.options = options;
		});

		// 8. Otherwise:
		if (!hasRegisteredObserverForObserver) {
			// 8.1. Append a new registered observer whose observer is this and
			// options is options to target's registered observer list.
			this._registeredObservers.push(new RegisteredObserver(observer, this._node, options));
			// 8.2. Append target to this's node list.
			observer._nodes.push(this._node);
		}
	}

	/**
	 * Removes the given transient registered observer.
	 *
	 * Transient registered observers never have a corresponding entry in the observer's list of
	 * nodes. They are guaranteed to be present in the array, as MutationObserver#_transients and
	 * RegisteredObservers#_registeredObservers are kept in sync.
	 *
	 * @param transientRegisteredObserver - The registered observer to remove
	 */
	public removeTransientRegisteredObserver(
		transientRegisteredObserver: RegisteredObserver
	): void {
		this._registeredObservers.splice(
			this._registeredObservers.indexOf(transientRegisteredObserver),
			1
		);
	}

	/**
	 * Remove any registered observer on the associated node for which observer is the observer.
	 *
	 * As this only occurs for all nodes at once, it is the caller's responsibility to remove the
	 * associated node from the observer's list of nodes.
	 *
	 * @param observer - Observer for which to remove the registration
	 */
	public removeForObserver(observer: MutationObserver): void {
		// Filter the array in-place
		let write = 0;
		for (let read = 0, l = this._registeredObservers.length; read < l; ++read) {
			const registered = this._registeredObservers[read];
			if (registered.observer === observer) {
				continue;
			}

			if (read !== write) {
				this._registeredObservers[write] = registered;
			}
			++write;
		}
		this._registeredObservers.length = write;
	}

	/**
	 * Determines interested observers for the given record.
	 *
	 * @param type                - The type of mutation record to queue
	 * @param target              - The target node
	 * @param data                - The data for the mutation record
	 * @param interestedObservers - Array of mutation observer objects to append to
	 * @param pairedStrings       - Paired strings for the mutation observer objects
	 */
	public collectInterestedObservers(
		type: string,
		target: Node,
		data: MutationRecordInit,
		interestedObservers: MutationObserver[],
		pairedStrings: (string | null | undefined)[]
	) {
		// (continuing from queueMutationRecord)
		// 3. ...and then for each registered of node's registered observer list:
		this._registeredObservers.forEach((registeredObserver) => {
			registeredObserver.collectInterestedObservers(
				type,
				target,
				data,
				interestedObservers,
				pairedStrings
			);
		});
	}

	/**
	 * Append transient registered observers for any registered observers whose options' subtree is
	 * true.
	 *
	 * @param node - Node to append the transient registered observers to
	 */
	public appendTransientRegisteredObservers(node: Node): void {
		this._registeredObservers.forEach((registeredObserver) => {
			if (registeredObserver.options.subtree) {
				node._registeredObservers.registerTransient(registeredObserver);
			}
		});
	}

	/**
	 * Appends a transient registered observer for the given registered observer.
	 *
	 * @param source - The source registered observer
	 */
	public registerTransient(source: RegisteredObserver): void {
		this._registeredObservers.push(
			new RegisteredObserver(source.observer, this._node, source.options, source)
		);
		// Note that node is not added to the transient observer's observer's list of nodes.
	}
}

/**
 * Removes all transient registered observers whose observer is observer.
 *
 * @param observer - The mutation observer object to remove transient registered observers for
 */
export function removeTransientRegisteredObserversForObserver(observer: MutationObserver): void {
	observer._transients.forEach((transientRegisteredObserver) => {
		transientRegisteredObserver.node._registeredObservers.removeTransientRegisteredObserver(
			transientRegisteredObserver
		);
	});
	observer._transients.length = 0;
}

/**
 * Removes all transient registered observer whose source is source.
 *
 * @param source - The registered observer to remove transient registered observers for
 */
export function removeTransientRegisteredObserversForSource(source: RegisteredObserver): void {
	for (let i = source.observer._transients.length - 1; i >= 0; --i) {
		const transientRegisteredObserver = source.observer._transients[i];
		if (transientRegisteredObserver.source !== source) {
			return;
		}

		transientRegisteredObserver.node._registeredObservers.removeTransientRegisteredObserver(
			transientRegisteredObserver
		);
		source.observer._transients.splice(i, 1);
	}
}
