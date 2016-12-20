import MutationRecord from './MutationRecord';

/**
 * Queues mutation on all target nodes, and on all target nodes of all its ancestors.
 */
export default function queueMutationRecord (mutationRecord: MutationRecord) {
	// Check all inclusive ancestors of the target for registered observers
	for (let node = mutationRecord.target; node; node = node.parentNode) {
		node._registeredObservers.queueRecord(mutationRecord);
	}
}
