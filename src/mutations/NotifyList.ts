import { MutationObserverCallback, default as MutationObserver } from './MutationObserver';
import MutationRecord from './MutationRecord';

const hasSetImmediate = (typeof setImmediate === 'function');

function schedule (callback: MutationObserverCallback, thisArg: NotifyList, ...args: any[]): number {
	return (hasSetImmediate ? setImmediate : setTimeout)(() => {
		callback.apply(thisArg, args);
	}, 0);
}

function removeTransientRegisteredObserversForObserver (observer: MutationObserver) {
	// Remove all transient registered observers for this observer
	// Process in reverse order, as the targets array may change during traversal
	for (var i = observer._targets.length - 1; i >= 0; --i) {
		observer._targets[i]._registeredObservers.removeTransients(observer);
	}
}

/**
 * A helper class which is responsible for scheduling the queued MutationRecord objects for reporting by their
 * observer. Reporting means the callback of the observer (a MutationObserver object) gets called with the
 * relevant MutationRecord objects.
 */
export default class NotifyList {
	private _notifyList: MutationObserver[] = [];
	private _scheduled: number | null = null;
	private _callbacks: MutationObserverCallback[] = [];

	/**
	 * Adds a given MutationRecord to the recordQueue of the given MutationObserver and schedules it for reporting.
	 *
	 * @param observer The observer for which to enqueue the record
	 * @param record   The record to enqueue
	 */
	queueRecord (observer: MutationObserver, record: MutationRecord) {
		// Only queue the same record once per observer
		if (observer._recordQueue[observer._recordQueue.length - 1] === record) {
			return;
		}

		observer._recordQueue.push(record);
		this._notifyList.push(observer);
		this._scheduleInvoke();
	}

	/**
	 * Takes all the records from all the observers currently on this list and clears the current list.
	 */
	clear () {
		this._notifyList.forEach(observer => observer.takeRecords());
		this._notifyList.length = 0;
	}

	/**
	 * An internal helper method which is used to start the scheduled invocation of the callback from each of the
	 * observers on the current list, i.e. to report the MutationRecords.
	 */
	private _scheduleInvoke () {
		if (this._scheduled) {
			return;
		}

		this._scheduled = schedule(() => {
			this._scheduled = null;
			this._invokeMutationObservers();
		}, this);
	}

	/**
	 * An internal helper method which is used to invoke the callback from each of the observers on the current
	 * list, i.e. to report the MutationRecords.
	 */
	private _invokeMutationObservers () {
		// Process notify list
		let numCallbacks = 0;
		this._notifyList.forEach(observer => {
			const queue = observer.takeRecords();
			if (!queue.length) {
				removeTransientRegisteredObserversForObserver(observer);
				return;
			}

			// Observer has records, schedule its callback
			++numCallbacks;
			schedule((queue, observer) => {
				try {
					// According to the spec, transient registered observers for observer
					// should be removed just before its callback is called.
					removeTransientRegisteredObserversForObserver(observer);
					observer._callback.call(null, queue, observer);
				}
				finally {
					--numCallbacks;
					if (!numCallbacks) {
						// Callbacks may have queued additional mutations, check again later
						this._scheduleInvoke();
					}
				}
			}, this, queue, observer);
		});

		this._notifyList.length = 0;
	}
}
