import * as parse5 from 'parse5';
import * as slimdom from '../../../src/index';
import SlimdomTreeAdapter from './SlimdomTreeAdapter';

function parseHTML(html: string): slimdom.Document {
	return parse5.parse(html, { treeAdapter: new SlimdomTreeAdapter() }) as slimdom.Document;
}

describe('Example: parse5 integration', () => {
	it('Can parse an HTML file', () => {
		const doc = parseHTML(`
<!DOCTYPE html>
<html>
<body>
	<h1>My First Heading</h1>
	<p class="test">My first paragraph.<br>With multiple lines.</p>
</body>
</html>`);

		expect(doc.doctype!.name).toBe('html');
		expect(doc.documentElement!.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(doc.documentElement!.localName).toBe('html');

		// HTML parsers treat whitespace a bit differently
		expect(slimdom.serializeToWellFormedString(doc)).toBe(
			`<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>
	<h1>My First Heading</h1>
	<p class="test">My first paragraph.<br />With multiple lines.</p>

</body></html>`
		);
	});
});
