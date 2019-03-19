import { default as MutationObserver } from './MutationObserver';
import MutationRecord from './MutationRecord';
import { removeTransientRegisteredObserversForObserver } from './RegisteredObservers';

function queueCompoundMicrotask(
	callback: (...args: any[]) => void,
	thisArg: NotifySet,
	...args: any[]
): void {
	Promise.resolve().then(() => callback.apply(thisArg, args));
}

/**
 * Tracks MutationObserver instances which have a non-empty record queue and schedules their
 * callbacks to be called.
 */
export default class NotifySet {
	private _notifySet: Set<MutationObserver> = new Set();
	private _compoundMicrotaskQueued: boolean = false;

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
	 * To queue a mutation observer compound microtask, run these steps:
	 */
	public queueMutationObserverCompoundMicrotask() {
		// 1. If mutation observer compound microtask queued flag is set, then return.
		if (this._compoundMicrotaskQueued) {
			return;
		}

		// 2. Set mutation observer compound microtask queued flag.
		// 3. Queue a compound microtask to notify mutation observers.
		this._compoundMicrotaskQueued = true;
		queueCompoundMicrotask(() => {
			this._notifyMutationObservers();
		}, this);
	}

	/**
	 * To notify mutation observers, run these steps:
	 */
	private _notifyMutationObservers() {
		// 1. Unset mutation observer compound microtask queued flag.
		this._compoundMicrotaskQueued = false;

		// 2. Let notifySet be a clone of the surrounding agent's mutation observers
		const notifySet = Array.from(this._notifySet);
		// Clear the notify set - for efficiency this set only tracks observers that have a
		// non-empty queue
		this._notifySet.clear();

		// 3. Let signalSet be a clone of the surrounding agent's signal slots.
		// 4. Empty the surrounding agent's signal slots.
		// (shadow dom not implemented)

		// 5. For each mo of notifySet, execute a compound microtask subtask to run these steps:
		// [HTML]
		notifySet.forEach(mo => {
			queueCompoundMicrotask(
				(mo: MutationObserver) => {
					// 5.1. Let queue be a copy of mo’s record queue.
					// 5.2. Empty mo’s record queue.
					const queue = mo.takeRecords();

					// 5.3. For each node of mo's node list, remove all transient registered
					// observers whose observer is mo from node's registered observer list.
					removeTransientRegisteredObserversForObserver(mo);

					// 5.4. If records is not empty, then invoke mo’s callback with « records, mo »,
					// and mo. If this throws an exception, then report the exception.
					if (queue.length) {
						mo._callback(queue, mo);
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
