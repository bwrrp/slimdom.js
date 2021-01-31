import { getContext } from '../context/Context';
import MutationObserver from './MutationObserver';
import { MutationRecordInit, default as MutationRecord } from './MutationRecord';
import Node from '../Node';

/**
 * 3.3.2. Queuing a mutation record
 *
 * To queue a mutation record of type for target with name, namespace, oldValue, addedNodes,
 * removedNodes, previousSibling and nextSibling, run these steps:
 * namespace namespace, oldValue oldValue, addedNodes addedNodes, removedNodes removedNodes,
 *
 * To queue a tree mutation record for target with addedNodes, removedNodes, previousSibling, and
 * nextSibling, run these steps:
 *  - Assert: either addedNodes or removedNodes is not empty.
 *  - Queue a mutation record of "childList" for target with null, null, null, addedNodes,
 *    removedNodes, previousSibling, and nextSibling.
 *
 * @param type   - The type of mutation record to queue
 * @param target - The target node
 * @param data   - The data for the mutation record
 */
export default function queueMutationRecord(type: string, target: Node, data: MutationRecordInit) {
	// 1. Let interested observers be an empty map
	const interestedObservers: MutationObserver[] = [];
	const pairedStrings: (string | null | undefined)[] = [];

	// 2. Let nodes be the inclusive ancestors of target.
	// 3. For each node in nodes, ...:
	for (let node: Node | null = target; node; node = node.parentNode) {
		node._registeredObservers.collectInterestedObservers(
			type,
			target,
			data,
			interestedObservers,
			pairedStrings
		);
	}

	const context = getContext(target);

	// 4. For each observer → mappedOldValue of interestedObservers:
	interestedObservers.forEach((observer, index) => {
		const mappedOldValue = pairedStrings[index];

		// 4.1. Let record be a new MutationRecord object with its type set to type and target set
		// to target,
		const record = new MutationRecord(type, target);

		// ...attributeName set to to name, attributeNamespace set to namespace...
		if (data.name !== undefined && data.namespace !== undefined) {
			record.attributeName = data.name;
			record.attributeNamespace = data.namespace;
		}

		// ...oldValue set to mappedOldValue...
		if (mappedOldValue !== undefined) {
			record.oldValue = mappedOldValue;
		}

		// ...addedNodes set to addedNodes...
		if (data.addedNodes !== undefined) {
			record.addedNodes = data.addedNodes;
		}

		// ...removedNodes set to removedNodes...
		if (data.removedNodes !== undefined) {
			record.removedNodes = data.removedNodes;
		}

		// ...previousSibling set to previousSibling...
		if (data.previousSibling !== undefined) {
			record.previousSibling = data.previousSibling;
		}

		// ...and nextSibling set to nextSibling.
		if (data.nextSibling !== undefined) {
			record.nextSibling = data.nextSibling;
		}

		// 4.2. Enqueue record to observer’s record queue.
		context._notifySet.appendRecord(observer, record);
	});

	// 5. Queue a mutation observer microtask.
	context._notifySet.queueMutationObserverMicrotask();
}
