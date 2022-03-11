import Document from '../Document';
import Node from '../Node';
import { isElement } from '../util/NodeType';
import { document, isWhitespace } from './grammar';
import { ParserEventType } from './parserEvents';

const builtinEntities = new Map([
	['amp', '&'],
	['lt', '<'],
	['gt', '>'],
	['apos', "'"],
	['quot', '"'],
]);

export function parseDocument(input: string): Document {
	const doc = new Document();
	const parentStack: Node[] = [];
	let parent: Node = doc;

	let collectedText: string[] = [];

	function flushCollectedText() {
		if (collectedText.length > 0) {
			const text = collectedText.join('');
			if (parent !== doc || !isWhitespace(text)) {
				parent.appendChild(doc.createTextNode(collectedText.join('')));
			}
		}
		collectedText.length = 0;
	}

	const gen = document(input, 0);
	let it = gen.next();
	for (; !it.done; it = gen.next()) {
		const event = it.value;
		if (typeof event === 'string') {
			collectedText.push(event);
			continue;
		}

		switch (event.type) {
			case ParserEventType.CharRef:
				collectedText.push(event.char);
				continue;

			case ParserEventType.EntityRef:
				const char = builtinEntities.get(event.name);
				if (char === undefined) {
					throw new Error(`unknown entity "${event.name}`);
				}
				collectedText.push(char);
				continue;
		}

		flushCollectedText();

		switch (event.type) {
			case ParserEventType.CDSect:
				parent.appendChild(doc.createCDATASection(event.data));
				continue;

			case ParserEventType.Comment:
				parent.appendChild(doc.createComment(event.data));
				continue;

			case ParserEventType.Doctypedecl:
				parent.appendChild(
					doc.implementation.createDocumentType(
						event.name,
						event.ids?.publicId || '',
						event.ids?.systemId || ''
					)
				);
				continue;

			case ParserEventType.PI:
				parent.appendChild(doc.createProcessingInstruction(event.target, event.data || ''));
				continue;

			case ParserEventType.STag:
			case ParserEventType.EmptyElemTag: {
				// TODO: update local namespaces
				// TODO: resolve namespace
				const element = doc.createElementNS(null, event.name);
				// TODO: create attributes
				parent.appendChild(element);
				if (event.type === ParserEventType.STag) {
					parentStack.push(parent);
					parent = element;
				}
				continue;
			}

			case ParserEventType.ETag:
				if (
					!isElement(parent) ||
					parent.nodeName !== event.name ||
					parentStack.length === 0
				) {
					throw new Error(`unbalanced end tag: ${event.name}`);
				}
				parent = parentStack.pop()!;
				continue;
		}
	}

	if (!it.value.success) {
		const quoted = it.value.expected.map((str) => `"${str}"`);
		throw new Error(
			`Error parsing document at offset ${it.value.offset}: expected ${
				quoted.length > 1 ? 'one of ' + quoted.join(', ') : quoted[0]
			} but found "${input.slice(it.value.offset, it.value.offset + 1)}"`
		);
	}

	flushCollectedText();

	return doc;
}
