import { MutationObserverInit, default as MutationObserver } from './MutationObserver';
import MutationRecord from './MutationRecord';
import Node from '../Node';

/**
 * This is an internal helper class that is used to work with a MutationObserver.
 *
 * Each node has an associated list of registered observers. A registered observer consists of an observer
 * (a MutationObserver object) and options (a MutationObserverInit dictionary). A transient registered observer
 * is a specific type of registered observer that has a source which is a registered observer.
 */
export default class RegisteredObserver {
	/**
	 * The observer that is registered.
	 */
	public observer: MutationObserver;

	/**
	 * The Node that is being observed by the given observer.
	 */
	public target: Node;

	/**
	 * An options object (formally a MutationObserverInit object, but just a plain js object in Slimdom) which
	 * specifies which DOM mutations should be reported. TODO: add options property docs.
	 */
	public options: MutationObserverInit;

	/**
	 * A transient observer is an observer that has a source which is an observer. TODO: clarify the "source"
	 * keyword in this context.
	 */
	public isTransient: boolean;

    /**
	 * @param observer    The observer being registered
	 * @param target      The node being observed
	 * @param options     Options for the registration
	 * @param isTransient Whether the registration is automatically removed when control returns to the event loop
	 */
	constructor (observer: MutationObserver, target: Node, options: MutationObserverInit, isTransient: boolean) {
		this.observer = observer;
		this.target = target;
		this.options = options;
		this.isTransient = isTransient;
	}

	/**
	 * Adds the given mutationRecord to the NotifyList of the registered MutationObserver. It only adds the record
	 * when it's type isn't blocked by one of the flags of this registered MutationObserver options (formally the
	 * MutationObserverInit object).
	 *
	 * @param mutationRecord The record to enqueue
	 */
	public queueRecord (mutationRecord: MutationRecord) {
		const options = this.options;

		// Only trigger ancestors if they are listening for subtree mutations
		if (mutationRecord.target !== this.target && !options.subtree) {
			return;
		}

		// Ignore attribute modifications if we're not listening for them
		if (!options.attributes && mutationRecord.type === 'attributes') {
			return;
		}

		// TODO: implement attribute filter?

		// Ignore user data modifications if we're not listening for them
		if (!options.userData && mutationRecord.type === 'userData') {
			return;
		}

		// Ignore character data modifications if we're not listening for them
		if (!options.characterData && mutationRecord.type === 'characterData') {
			return;
		}

		// Ignore child list modifications if we're not listening for them
		if (!options.childList && mutationRecord.type === 'childList') {
			return;
		}

		// Queue the record
		// TODO: we should probably make a copy here according to the options, but who cares about extra info?
		MutationObserver._notifyList.queueRecord(this.observer, mutationRecord);
	}
}
