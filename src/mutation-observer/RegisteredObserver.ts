import { MutationObserverInit, default as MutationObserver } from './MutationObserver';
import { MutationRecordInit, default as MutationRecord } from './MutationRecord';
import Node from '../Node';

/**
 * A registered observer consists of an observer (a MutationObserver object) and options (a
 * MutationObserverInit dictionary).
 *
 * A transient registered observer is a registered observer that also consists of a source (a
 * registered observer).
 *
 * Transient registered observers are used to track mutations within a given node’s descendants
 * after node has been removed so they do not get lost when subtree is set to true on node’s parent.
 */
export default class RegisteredObserver {
	/**
	 * The observer that is registered.
	 */
	public observer: MutationObserver;

	/**
	 * The Node that is being observed by the given observer.
	 */
	public node: Node;

	/**
	 * The options for the registered observer.
	 */
	public options: MutationObserverInit;

	/**
	 * A transient observer is an observer that has a source which is an observer.
	 */
	public source: RegisteredObserver | null = null;

	/**
	 * @param observer - The observer being registered
	 * @param node     - The node being observed
	 * @param options  - Options for the registration
	 * @param source   - If non-null, creates a transient registered observer for the given
	 *                   registered observer
	 */
	constructor(
		observer: MutationObserver,
		node: Node,
		options: MutationObserverInit,
		source?: RegisteredObserver
	) {
		this.observer = observer;
		this.node = node;
		this.options = options;
		this.source = source || null;
		if (source) {
			observer._transients.push(this);
		}
	}

	/**
	 * Adds the given mutationRecord to the NotifyList of the registered MutationObserver. It only
	 * adds the record when it's type isn't blocked by one of the flags of this registered
	 * MutationObserver options (formally the MutationObserverInit object).
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
		// (continued from RegisteredObservers#queueMutationRecord)

		// 3.1. Let options be registered's options.
		// 3.2. If none of the following are true
		// node is not target and options’ subtree is false
		if (this.node !== target && !this.options.subtree) {
			return;
		}

		// type is "attributes" and options’ attributes is not true
		if (type === 'attributes' && !this.options.attributes) {
			return;
		}

		// type is "attributes", options’ attributeFilter is present, and options’ attributeFilter
		// does not contain name or namespace is non-null
		// (attributeFilter not implemented)

		// type is "characterData" and options’ characterData is not true
		if (type === 'characterData' && !this.options.characterData) {
			return;
		}

		// type is "childList" and options’ childList is false
		if (type === 'childList' && !this.options.childList) {
			return;
		}

		// then:

		// 3.2.1. Let mo be registered's observer.
		// 3.2.2. If interestedObservers[mo] does not exist, then set interestedObservers[mo] to
		// null
		let index = interestedObservers.indexOf(this.observer);
		if (index < 0) {
			index = interestedObservers.length;
			interestedObservers.push(this.observer);
			pairedStrings.push(undefined);
		}

		// 3.2.3. If either type is "attributes" and options’ attributeOldValue is true, or type is
		// "characterData" and options’ characterDataOldValue is true, then set
		// interestedObservers[mo] to oldValue.
		if (
			(type === 'attributes' && this.options.attributeOldValue) ||
			(type === 'characterData' && this.options.characterDataOldValue)
		) {
			pairedStrings[index] = data.oldValue;
		}
	}
}
