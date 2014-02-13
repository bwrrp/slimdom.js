/**
 * @submodule mutations
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(
	function() {
		'use strict';

		/**
		 * A helper class which describes a specific mutation as it is observed by a MutationObserver.
		 *
		 * @class MutationRecord
		 *
		 * @constructor
		 *
		 * @param  {String}  type  Should be set to "attributes" if it was an attribute mutation, "characterData" if it
		 * was a mutation to a CharacterData node or "childList" if it was a mutation to the tree of nodes.
		 * @param  {Node}  target  The node the mutation affected, depending on the type. For "attributes", it is the
		 * element whose attribute changed. For "characterData", it is the CharacterData node. For "childList", it is
		 * the node whose children changed.
		 */
		function MutationRecord(type, target) {
			/**
			 * Returns "attributes" if it was an attribute mutation, "characterData" if it was a mutation to a
			 * CharacterData node or "childList" if it was a mutation to the tree of nodes.
			 *
			 * @property type
			 * @type {String}
			 * @final
			 */
			this.type = type;
			/**
			 * Returns the node the mutation affected, depending on the type. For "attributes", it is the element whose
			 * attribute changed. For "characterData", it is the CharacterData node. For "childList", it is the node
			 * whose children changed.
			 *
			 * @property target
			 * @type {Node}
			 * @final
			 */
			this.target = target;

			/**
			 * An Array of Node objects that were added during the mutation for which this record was created.
			 *
			 * @property addedNodes
			 * @type {Node[]}
			 */
			this.addedNodes = [];
			/**
			 * An Array of Node objects that were removed during the mutation for which this record was created.
			 *
			 * @property addedNodes
			 * @type {Node[]}
			 */
			this.removedNodes = [];

			/**
			 * The previous sibling Node of the added or removed nodes if there were any.
			 *
			 * @property previousSibling
			 * @type {null|Node}
			 */
			this.previousSibling = null;
			/**
			 * The next sibling Node of the added or removed nodes if there were any.
			 *
			 * @property nextSibling
			 * @type {null|Node}
			 */
			this.nextSibling = null;

			/**
			 * The name of the changed attribute if there was any.
			 *
			 * @property attributeName
			 * @type {null|String}
			 */
			this.attributeName = null;

			/**
			 * Depending on the type: for "attributes", it is the value of the changed attribute before the change;
			 * for "characterData", it is the data of the changed node before the change; for "childList", it is null.
			 *
			 * @property oldValue
			 * @type {null|any}
			 */
			this.oldValue = null;
		}

		return MutationRecord;
	}
);
