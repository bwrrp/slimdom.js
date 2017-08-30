import MutationRecord from './MutationRecord';
import NotifyList from './NotifyList';
import RegisteredObserver from './RegisteredObserver';
import Node from '../Node';
import { expectArity } from '../util/errorHelpers';
import { asObject } from '../util/typeHelpers';

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

export type MutationCallback = (records: MutationRecord[], observer: MutationObserver) => void;

/**
 * 3.3.1. Interface MutationObserver
 *
 * A MutationObserver object can be used to observe mutations to the tree of nodes.
 */
export default class MutationObserver {
	/**
	 * The NotifyList instance is shared between all MutationObserver objects. It holds references
	 * to all MutationObserver instances that have collected records, and is responsible for
	 * invoking their callbacks when control returns to the event loop (using setImmediate or
	 * setTimeout).
	 */
	static _notifyList = new NotifyList();

	/**
	 * The function that will be called when control returns to the event loop, if there are any
	 * queued records. The function is passed the MutationRecords and the observer instance that
	 * collected them.
	 */
	public _callback: MutationCallback;

	/**
	 * The list of nodes on which this observer is a RegisteredObserver's observer.
	 */
	public _nodes: Node[] = [];

	/**
	 * The list of MutationRecord objects collected so far.
	 */
	public _recordQueue: MutationRecord[] = [];

	/**
	 * Tracks transient registered observers created for this observer, to simplify their removal.
	 */
	public _transients: RegisteredObserver[] = [];

	/**
	 * Constructs a MutationObserver object and sets its callback to callback. The callback is
	 * invoked with a list of MutationRecord objects as first argument and the constructed
	 * MutationObserver object as second argument. It is invoked after nodes registered with the
	 * observe() method, are mutated.
	 *
	 * @param callback Function called after mutations have been observed.
	 */
	constructor(callback: MutationCallback) {
		expectArity(arguments, 1);
		callback = asObject(callback, Function);

		// create a new MutationObserver object with callback set to callback
		this._callback = callback;

		// append it to the unit of related similar-origin browsing contexts' list of
		// MutationObserver objects (for efficiency, this implementation only tracks
		// MutationObserver objects that have records queued)
	}

	/**
	 * Instructs the user agent to observe a given target (a node) and report any mutations based on
	 * the criteria given by options (an object).
	 *
	 * NOTE: Adding an observer to an element is just like addEventListener, if you observe the
	 * element multiple times it does not make a difference. Meaning if you observe element twice,
	 * the observe callback does not fire twice, nor will you have to run disconnect() twice. In
	 * other words, once an element is observed, observing it again with the same will do nothing.
	 * However if the callback object is different it will of course add another observer to it.
	 *
	 * @param target  Node (or root of subtree) to observe
	 * @param options Determines which types of mutations to observe
	 */
	observe(target: Node, options: MutationObserverInit) {
		expectArity(arguments, 2);
		target = asObject(target, Node);

		// Defaults from IDL
		options.childList = !!options.childList;
		options.subtree = !!options.subtree;

		// 1. If either options’ attributeOldValue or attributeFilter is present and options’
		// attributes is omitted, set options’ attributes to true.
		if (options.attributeOldValue !== undefined && options.attributes === undefined) {
			options.attributes = true;
		}

		// 2. If options’ characterDataOldValue is present and options’ characterData is omitted,
		// set options’ characterData to true.
		if (options.characterDataOldValue !== undefined && options.characterData === undefined) {
			options.characterData = true;
		}
		// 3. If none of options’ childList, attributes, and characterData is true, throw a
		// TypeError.
		if (!(options.childList || options.attributes || options.characterData)) {
			throw new TypeError(
				'The options object must set at least one of "attributes", "characterData", or ' +
					'"childList" to true.'
			);
		}

		// 4. If options’ attributeOldValue is true and options’ attributes is false, throw a
		// TypeError.
		if (options.attributeOldValue && !options.attributes) {
			throw new TypeError(
				'The options object may only set "attributeOldValue" to true when "attributes" ' +
					'is true or not present.'
			);
		}

		// 5. If options’ attributeFilter is present and options’ attributes is false, throw a
		// TypeError. (attributeFilter not yet implemented)

		// 6. If options’ characterDataOldValue is true and options’ characterData is false, throw a
		// TypeError.
		if (options.characterDataOldValue && !options.characterData) {
			throw new TypeError(
				'The options object may only set "characterDataOldValue" to true when ' +
					'"characterData" is true or not present.'
			);
		}

		// 7. For each registered observer registered in target’s list of registered observers whose
		// observer is the context object:
		// 7.1. Remove all transient registered observers whose source is registered.
		// 7.2. Replace registered’s options with options.
		// 8. Otherwise, add a new registered observer to target’s list of registered observers with
		// the context object as the observer and options as the options, and add target to context
		// object’s list of nodes on which it is registered.
		target._registeredObservers.register(this, options);
	}

	/**
	 * Stops the MutationObserver instance from receiving notifications of DOM mutations. Until the
	 * observe() method is used again, observer's callback will not be invoked.
	 */
	disconnect() {
		// for each node node in context object’s list of nodes, remove any registered observer on
		// node for which context object is the observer,
		this._nodes.forEach(node => node._registeredObservers.removeForObserver(this));
		this._nodes.length = 0;

		// and also empty context object’s record queue.
		this._recordQueue.length = 0;
	}

	/**
	 * Empties the MutationObserver instance's record queue and returns what was in there.
	 *
	 * @return An Array of MutationRecord objects that were recorded.
	 */
	takeRecords(): MutationRecord[] {
		// return a copy of the record queue
		const recordQueue = this._recordQueue.concat();
		// and then empty the record queue
		this._recordQueue.length = 0;
		return recordQueue;
	}
}
