define(
	[
		'./node',
		'./mutations/mutationrecord',
		'./util'
	],
	function(Node, MutationRecord, util, undefined) {
		function CharacterData(type, data) {
			if (!arguments.length) return;

			Node.call(this, type);
			// NOTE: we'll use 'nodeValue' here instead of the standard 'data' to avoid having duplicate accessors
			this.nodeValue = data || '';
		}
		CharacterData.prototype = new Node();
		CharacterData.prototype.constructor = CharacterData;

		CharacterData.prototype.length = function() {
			return this.nodeValue.length;
		};

		CharacterData.prototype.substringData = function(offset, count) {
			return this.nodeValue.substring(offset, count);
		};

		CharacterData.prototype.appendData = function(data) {
			this.replaceData(this.length(), 0, data);
		};

		CharacterData.prototype.insertData = function(offset, data) {
			this.replaceData(offset, 0, data);
		};

		CharacterData.prototype.deleteData = function(offset, count) {
			// Omitting count means 'delete from offset to end'
			if (count === undefined) count = this.length() - offset;
			this.replaceData(offset, count, '');
		};

		CharacterData.prototype.replaceData = function(offset, count, data) {
			var length = this.length();

			if (offset > length)
				offset = length;

			if (offset + count > length)
				count = length - offset;

			// Queue mutation record
			var record = new MutationRecord('characterData', this);
			record.oldValue = this.nodeValue;
			util.queueMutationRecord(record);

			// Replace data
			var before = this.substringData(0, offset),
				after = this.substringData(offset + count);
			this.nodeValue = before + data + after;
		};

		CharacterData.prototype.toString = function() {
			return this.nodeValue;
		};

		return CharacterData;
	}
);
