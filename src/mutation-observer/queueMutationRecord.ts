import MutationObserver from './MutationObserver';
import { MutationRecordInit, default as MutationRecord } from './MutationRecord';
import Node from '../Node';

/**
 * 3.3.2. Queuing a mutation record
 *
 * To queue a mutation record of type for target with one or more of (depends on type) name name,
 * namespace namespace, oldValue oldValue, addedNodes addedNodes, removedNodes removedNodes,
 * previousSibling previousSibling, and nextSibling nextSibling, run these steps:
 *
 * @param type   The type of mutation record to queue
 * @param target The target node
 * @param data   The data for the mutation record
 */
export default function queueMutationRecord(type: string, target: Node, data: MutationRecordInit) {
	// 1. Let interested observers be an initially empty set of MutationObserver objects optionally
	// paired with a string.
	const interestedObservers: MutationObserver[] = [];
	const pairedStrings: (string | null | undefined)[] = [];

	// 2. Let nodes be the inclusive ancestors of target.
	// 3. For each node in nodes, and then for each registered observer (with registered observer’s
	// options as options) in node’s list of registered observers:
	for (let node: Node | null = target; node; node = node.parentNode) {
		// 3.1. If none of the following are true
		// node is not target and options’ subtree is false
		// type is "attributes" and options’ attributes is not true
		// type is "attributes", options’ attributeFilter is present, and options’ attributeFilter
		// does not contain name or namespace is non-null
		// type is "characterData" and options’ characterData is not true
		// type is "childList" and options’ childList is false
		// then:
		// 3.1.1. If registered observer’s observer is not in interested observers, append
		// registered observer’s observer to interested observers.
		// 3.1.2. If either type is "attributes" and options’ attributeOldValue is true, or type is
		// "characterData" and options’ characterDataOldValue is true, set the paired string of
		// registered observer’s observer in interested observers to oldValue.
		node._registeredObservers.collectInterestedObservers(
			type,
			target,
			data,
			interestedObservers,
			pairedStrings
		);
	}

	// 4. For each observer in interested observers:
	interestedObservers.forEach((observer, index) => {
		// 4.1. Let record be a new MutationRecord object with its type set to type and target set
		// to target.
		const record = new MutationRecord(type, target);

		// 4.2. If name and namespace are given, set record’s attributeName to name, and record’s
		// attributeNamespace to namespace.
		if (data.name !== undefined && data.namespace !== undefined) {
			record.attributeName = data.name;
			record.attributeNamespace = data.namespace;
		}

		// 4.3. If addedNodes is given, set record’s addedNodes to addedNodes.
		if (data.addedNodes !== undefined) {
			record.addedNodes = data.addedNodes;
		}

		// 4.4. If removedNodes is given, set record’s removedNodes to removedNodes,
		if (data.removedNodes !== undefined) {
			record.removedNodes = data.removedNodes;
		}

		// 4.5. If previousSibling is given, set record’s previousSibling to previousSibling.
		if (data.previousSibling !== undefined) {
			record.previousSibling = data.previousSibling;
		}

		// 4.6. If nextSibling is given, set record’s nextSibling to nextSibling.
		if (data.nextSibling !== undefined) {
			record.nextSibling = data.nextSibling;
		}

		// 4.7. If observer has a paired string, set record’s oldValue to observer’s paired string.
		const pairedString = pairedStrings[index];
		if (pairedString !== undefined) {
			record.oldValue = pairedString;
		}

		// 4.8. Append record to observer’s record queue.
		MutationObserver._notifyList.appendRecord(observer, record);
	});

	// 5. Queue a mutation observer compound microtask.
	MutationObserver._notifyList.queueMutationObserverCompoundMicrotask();
}
