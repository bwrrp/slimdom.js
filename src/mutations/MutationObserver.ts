import MutationRecord from './MutationRecord';
import NotifyList from './NotifyList';
import Node from '../Node';

export interface MutationObserverInit {
	/**
	 * Whether to observe childList mutations.
	 */
	childList?: boolean;

	/**
	 * Whether to observe attribute mutations.
	 */
	attributes?: boolean;

	/**
	 * Whether to observe character data mutations.
	 */
	characterData?: boolean;

	/**
	 * (non-standard) whether to observe user data mutations.
	 */
	userData?: boolean;

	/**
	 * Whether to observe mutations on any descendant in addition to those on the target.
	 */
	subtree?: boolean;

	/**
	 * Whether to record the previous value of attributes.
	 */
	attributeOldValue?: boolean;

	/**
	 * Whether to record the previous value of character data nodes.
	 */
	characterDataOldValue?: boolean;
}

export type MutationObserverCallback = (records: MutationRecord[], observer: MutationObserver) => void;

/**
 * A MutationObserver object can be used to observe mutations to the tree of nodes.
 */
export default class MutationObserver {

	/**
	 * (internal) The function that will be called on each DOM mutation. The observer will call this function with two
	 * arguments. The first is an array of objects, each of type MutationRecord. The second is this
	 * MutationObserver instance.
	 */
	public _callback: MutationObserverCallback;

	/**
	 * (internal) List of records collected so far.
	 */
	public _recordQueue: MutationRecord[] = [];

	/**
	 * (internal) A list of Node objects for which this MutationObserver is a registered observer.
	 */
	public _targets: Node[] = [];

	/**
	 * (internal) The NotifyList instance that is shared between all MutationObserver objects. Each observer queues 
	 * its MutationRecord object on this list with a reference to itself. The NotifyList is then responsible for 
	 * periodically reporting of these records to the observers.
	 */
	static _notifyList = MutationObserver._notifyList;

	constructor (callback: MutationObserverCallback) {
		this._callback = callback;
	}

	/**
	 * Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.
	 *
	 * NOTE: Adding an observer to an element is just like addEventListener, if you observe the element multiple
	 * times it does not make a difference. Meaning if you observe element twice, the observe callback does not fire
	 * twice, nor will you have to run disconnect() twice. In other words, once an element is observed, observing it
	 * again with the same will do nothing. However if the callback object is different it will of course add
	 * another observer to it.
	 */
	observe (target: Node, options: MutationObserverInit, isTransient: boolean) {
		target._registeredObservers.register(this, options, isTransient);
	}

	/**
	 * Stops the MutationObserver instance from receiving notifications of DOM mutations. Until the observe() method
	 * is used again, observer's callback will not be invoked.
	 */
	disconnect () {
		// Disconnect from each target
		this._targets.forEach(target => target._registeredObservers.removeObserver(this));
		this._targets.length = 0;

		// Empty the record queue
		this._recordQueue.length = 0;
	}

	/**
	 * Empties the MutationObserver instance's record queue and returns what was in there.
	 * @return {MutationRecord[]}  An Array of MutationRecord objects that were recorded.
	 */
	takeRecords (): MutationRecord[] {
		const recordQueue = this._recordQueue;
		this._recordQueue = [];
		return recordQueue;
	}
}
