import { default as MutationObserver } from './MutationObserver';
import MutationRecord from './MutationRecord';
import { removeTransientRegisteredObserversForObserver } from './RegisteredObservers';

type AnyCallback = (...args: any[]) => void;
declare const queueMicrotask: undefined | ((callback: AnyCallback) => void);

/* istanbul ignore next */
function queueMicrotaskWithAppropriateApi(
	callback: AnyCallback,
	thisArg: NotifySet,
	...args: any[]
): void {
	if (typeof queueMicrotask === 'function') {
		queueMicrotask(() => callback.apply(thisArg, args));
		return;
	}

	// Fall back to Promise.then callbacks - these run as microtasks, but handle errors differently
	Promise.resolve().then(() => callback.apply(thisArg, args));
}

/**
 * Tracks MutationObserver instances which have a non-empty record queue and schedules their
 * callbacks to be called.
 */
export default class NotifySet {
	private _notifySet: Set<MutationObserver> = new Set();
	private _mutationObserverMicrotaskQueued: boolean = false;

	/**
	 * Appends a given MutationRecord to the recordQueue of the given MutationObserver and schedules
	 * it for reporting.
	 *
	 * @param observer - The observer for which to enqueue the record
	 * @param record   - The record to enqueue
	 */
	appendRecord(observer: MutationObserver, record: MutationRecord) {
		observer._recordQueue.push(record);
		this._notifySet.add(observer);
	}

	/**
	 * To queue a mutation observer microtask, run these steps:
	 */
	public queueMutationObserverMicrotask() {
		// 1. If the surrounding agent's mutation observer microtask queued is true, then return.
		if (this._mutationObserverMicrotaskQueued) {
			return;
		}

		// 2. Set the surrounding agent's mutation observer microtask queued to true.
		this._mutationObserverMicrotaskQueued = true;

		// 3. Queue a microtask to notify mutation observers.
		queueMicrotaskWithAppropriateApi(() => {
			this._notifyMutationObservers();
		}, this);
	}

	/**
	 * To notify mutation observers, run these steps:
	 */
	private _notifyMutationObservers() {
		// 1. Set the surrounding agent's mutation observer microtask queued to false.
		this._mutationObserverMicrotaskQueued = false;

		// 2. Let notifySet be a clone of the surrounding agent's mutation observers
		const notifySet = Array.from(this._notifySet);
		// Clear the notify set - for efficiency this set only tracks observers that have a
		// non-empty queue
		this._notifySet.clear();

		// 3. Let signalSet be a clone of the surrounding agent's signal slots.
		// 4. Empty the surrounding agent's signal slots.
		// (shadow dom not implemented)

		// 5. For each mo of notifySet:
		// [HTML]
		notifySet.forEach((mo) => {
			queueMicrotaskWithAppropriateApi(
				(mo: MutationObserver) => {
					// 5.1. Let records be a clone of mo’s record queue.
					// 5.2. Empty mo’s record queue.
					const records = mo.takeRecords();

					// 5.3. For each node of mo's node list, remove all transient registered
					// observers whose observer is mo from node's registered observer list.
					removeTransientRegisteredObserversForObserver(mo);

					// 5.4. If records is not empty, then invoke mo’s callback with « records, mo »,
					// and mo. If this throws an exception, catch it, and report the exception.
					// (A try/catch is not necessary here, as this microtask does nothing else and
					// letting the exception through will likely cause the environment to report it)
					if (records.length > 0) {
						mo._callback(records, mo);
					}
				},
				this,
				mo
			);
		});

		// 6. For each slot of signalSet, fire an event named slotchange, with its bubbles attribute
		// set to true, at slot.
		// (shadow dom not implemented)
	}
}
