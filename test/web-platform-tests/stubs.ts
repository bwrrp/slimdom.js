import * as slimdom from '../../src/index';

// Some web platform tests are a bit slow
jest.setTimeout(20000);

(slimdom.Document.prototype as any).getElementById = function getElementById(
	this: slimdom.Node,
	id: string
): slimdom.Node | null {
	return (function getElementById(node: slimdom.Node): slimdom.Node | null {
		for (let child = node.firstChild; child; child = child.nextSibling) {
			if (
				child.nodeType === slimdom.Node.ELEMENT_NODE &&
				(child as slimdom.Element).getAttribute('id') === id
			) {
				return child;
			}
			const descendant = getElementById(child);
			if (descendant) {
				return descendant;
			}
		}

		return null;
	})(this);
};

// Stub not implemented properties to prevent createDocument tests from failing on these
Object.defineProperties(slimdom.Document.prototype, {
	URL: {
		value: 'about:blank',
	},
	documentURI: {
		value: 'about:blank',
	},
	location: {
		value: null,
	},
	compatMode: {
		value: 'CSS1Compat',
	},
	characterSet: {
		value: 'UTF-8',
	},
	charset: {
		value: 'UTF-8',
	},
	inputEncoding: {
		value: 'UTF-8',
	},
	contentType: {
		value: 'application/xml',
	},
	origin: {
		value: 'null',
	},
	body: {
		get() {
			return this.getElementsByTagName('body')[0] || null;
		},
	},
	title: {
		get() {
			return this.getElementsByTagName('title')[0]?.textContent || '';
		},
	},
});

(slimdom.Document.prototype as any).querySelectorAll = () => [];
(slimdom.Document.prototype as any).querySelector = () => null;

Object.defineProperties(slimdom.Attr.prototype, { specified: { value: true } });
Object.defineProperties(slimdom.Element.prototype, { style: { value: {} } });
