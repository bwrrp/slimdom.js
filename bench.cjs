const { Document, serializeToWellFormedString } = require('.');

const TABLE_SIZE = 1000;

function createTable() {
	const doc = new Document();
	const table = doc.createElementNS("http://example.com", "table");
	doc.appendChild(table);

	for (let num = 1; num < TABLE_SIZE; ++num) {
		const newRow = doc.createElementNS("http://example.com", "tr");
		table.appendChild(newRow);

		for (let i = 1; i < num; ++i) {
			const newCell = doc.createElementNS("http://example.com", "td");
			newRow.appendChild(newCell);
		}

		for (const row of table.childNodes) {
			const newCell = doc.createElementNS("http://example.com", "td");
			row.appendChild(newCell);
		}
	}

	return doc;
}

console.group('createTable');
for (let i = 0; i < 20; ++i) {
	console.time();
	createTable();
	console.timeEnd();
}
console.groupEnd();

console.group('serializeTable');
const doc = createTable();
for (let i = 0; i < 20; ++i) {
	console.time();
	serializeToWellFormedString(doc);
	console.timeEnd();
}
console.groupEnd();
