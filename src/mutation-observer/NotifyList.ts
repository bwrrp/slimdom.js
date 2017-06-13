import { MutationCallback, default as MutationObserver } from './MutationObserver';
import MutationRecord from './MutationRecord';
import { removeTransientRegisteredObserversForObserver } from './RegisteredObservers';

// Declare functions without having to bring in the entire DOM lib
declare function setImmediate(handler: (...args: any[]) => void): number
declare function setTimeout(handler: (...args: any[]) => void, timeout: number): number

const hasSetImmediate = typeof setImmediate === 'function';

function queueCompoundMicrotask(callback: (...args: any[]) => void, thisArg: NotifyList, ...args: any[]): number {
	return (hasSetImmediate ? setImmediate : setTimeout)(() => {
		callback.apply(thisArg, args);
	}, 0);
}

/**
 * A helper class which is responsible for scheduling the queued MutationRecord objects for reporting by their
 * observer. Reporting means the callback of the observer (a MutationObserver object) gets called with the
 * relevant MutationRecord objects.
 */
export default class NotifyList {
	private _notifyList: MutationObserver[] = [];
	private _compoundMicrotaskQueued: number | null = null;

	/**
	 * Appends a given MutationRecord to the recordQueue of the given MutationObserver and schedules it for reporting.
	 *
	 * @param observer The observer for which to enqueue the record
	 * @param record   The record to enqueue
	 */
	appendRecord(observer: MutationObserver, record: MutationRecord) {
		observer._recordQueue.push(record);
		this._notifyList.push(observer);
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
		this._compoundMicrotaskQueued = queueCompoundMicrotask(() => {
			this._notifyMutationObservers();
		}, this);
	}

	/**
	 * To notify mutation observers, run these steps:
	 */
	private _notifyMutationObservers() {
		// 1. Unset mutation observer compound microtask queued flag.
		this._compoundMicrotaskQueued = null;

		// 2. Let notify list be a copy of unit of related similar-origin browsing contexts' list of MutationObserver
		// objects.
		const notifyList = this._notifyList.concat();
		// Clear the notify list - for efficiency this list only tracks observers that have a non-empty queue
		this._notifyList.length = 0;

		// 3. Let signalList be a copy of unit of related similar-origin browsing contexts' signal slot list.
		// 4. Empty unit of related similar-origin browsing contexts' signal slot list.
		// (shadow dom not implemented)

		// 5. For each MutationObserver object mo in notify list, execute a compound microtask subtask to run these
		// steps: [HTML]
		notifyList.forEach(mo => {
			queueCompoundMicrotask(
				(mo: MutationObserver) => {
					// 5.1. Let queue be a copy of mo’s record queue.
					// 5.2. Empty mo’s record queue.
					const queue = mo.takeRecords();

					// 5.3. Remove all transient registered observers whose observer is mo.
					removeTransientRegisteredObserversForObserver(mo);

					// 5.4. If queue is non-empty, invoke mo’s callback with a list of arguments consisting of queue and mo,
					// and mo as the callback this value. If this throws an exception, report the exception.
					if (queue.length) {
						mo._callback(queue, mo);
					}
				},
				this,
				mo
			);
		});

		// 6. For each slot slot in signalList, in order, fire an event named slotchange, with its bubbles
		// attribute set to true, at slot.
		// (shadow dom not implemented)
	}
}
