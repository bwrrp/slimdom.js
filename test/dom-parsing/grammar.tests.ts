import { collect } from 'prsc';
import { document } from '../../src/dom-parsing/grammar';
import { DocumentParseEvent, ParserEventType } from '../../src/dom-parsing/parserEvents';

describe('grammar', () => {
	function testParser(
		input: string,
		isValid: boolean,
		expectedEvents: DocumentParseEvent[]
	): void {
		const [events, res] = collect(document(input, 0));
		expect(res.success).toBe(isValid);
		if (res.success) {
			expect(events).toEqual(expectedEvents);
		}
	}

	it('can parse a document with a version declaration', () => {
		testParser('<?xml version="1.0"?><root/>', true, [
			{ type: ParserEventType.XMLDecl, version: '1.0', encoding: null, standalone: null },
			{
				type: ParserEventType.EmptyElemTag,
				name: 'root',
				attributes: [],
			},
		]);
		testParser('<?xml version="1.0" encoding="utf8" standalone="yes"?><root/>', true, [
			{ type: ParserEventType.XMLDecl, version: '1.0', encoding: 'utf8', standalone: true },
			{
				type: ParserEventType.EmptyElemTag,
				name: 'root',
				attributes: [],
			},
		]);
	});

	it('can parse a document with nested tags, attributes and other stuff', () => {
		testParser(
			'<root attr="value" another="yay">before<child a="b">inside<!--comment--></child><?pi?></root><?target data?>',
			true,
			[
				{
					type: ParserEventType.STag,
					name: 'root',
					attributes: [
						{ name: 'attr', value: ['value'] },
						{ name: 'another', value: ['yay'] },
					],
				},
				'before',
				{
					type: ParserEventType.STag,
					name: 'child',
					attributes: [{ name: 'a', value: ['b'] }],
				},
				'inside',
				{ type: ParserEventType.Comment, data: 'comment' },
				{ type: ParserEventType.ETag, name: 'child' },
				{ type: ParserEventType.PI, target: 'pi', data: null },
				{ type: ParserEventType.ETag, name: 'root' },
				{ type: ParserEventType.PI, target: 'target', data: 'data' },
			]
		);
	});
});
