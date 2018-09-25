import * as parse5 from 'parse5';
import * as slimdom from '../../../src/index';

function undefinedAsNull<T>(value: T | undefined): T | null {
	return value === undefined ? null : value;
}

export default class SlimdomTreeAdapter implements parse5.TreeAdapter {
	private _globalDocument = new slimdom.Document();
	private _mode: parse5.DocumentMode = 'no-quirks';

	createDocument(): parse5.Document {
		return this._globalDocument.implementation.createDocument(null, '');
	}

	createDocumentFragment(): parse5.DocumentFragment {
		throw new Error('Method not implemented.');
	}

	createElement(
		tagName: string,
		namespaceURI: string,
		attrs: parse5.Attribute[]
	): parse5.Element {
		const [localName, prefix] =
			tagName.indexOf(':') >= 0 ? tagName.split(':') : [tagName, null];
		// Create element without validation, as per HTML parser spec
		const element = slimdom.unsafeCreateElement(
			this._globalDocument,
			localName!,
			namespaceURI,
			prefix
		);
		attrs.forEach(attr => {
			// Create and append Attr node without validation, as per HTML parser spec
			const attribute = slimdom.unsafeCreateAttribute(
				undefinedAsNull(attr.namespace),
				undefinedAsNull(attr.prefix),
				attr.name,
				attr.value,
				element
			);
			attribute.ownerDocument = this._globalDocument;
			slimdom.unsafeAppendAttribute(attribute, element);
		});
		return element;
	}

	createCommentNode(data: string): parse5.CommentNode {
		return this._globalDocument.createComment(data);
	}

	appendChild(parentNode: parse5.ParentNode, newNode: parse5.Node): void {
		(parentNode as slimdom.Node).appendChild(newNode as slimdom.Node);
	}

	insertBefore(
		parentNode: parse5.ParentNode,
		newNode: parse5.Node,
		referenceNode: parse5.Node
	): void {
		(parentNode as slimdom.Node).insertBefore(
			newNode as slimdom.Node,
			referenceNode as slimdom.Node
		);
	}

	setTemplateContent(
		templateElement: parse5.Element,
		contentElement: parse5.DocumentFragment
	): void {
		throw new Error('Method not implemented.');
	}

	getTemplateContent(templateElement: parse5.Element): parse5.DocumentFragment {
		throw new Error('Method not implemented.');
	}

	setDocumentType(
		document: parse5.Document,
		name: string,
		publicId: string,
		systemId: string
	): void {
		const doctype = this._globalDocument.implementation.createDocumentType(
			name,
			publicId,
			systemId
		);
		const doc = document as slimdom.Document;
		if (doc.doctype) {
			doc.replaceChild(doctype, doc.doctype);
		} else {
			doc.insertBefore(doctype, doc.documentElement);
		}
	}

	setDocumentMode(document: parse5.Document, mode: parse5.DocumentMode): void {
		this._mode = mode;
	}

	getDocumentMode(document: parse5.Document): parse5.DocumentMode {
		return this._mode;
	}

	detachNode(node: parse5.Node): void {
		const parent = (node as slimdom.Node).parentNode;
		if (parent) {
			parent.removeChild(node as slimdom.Node);
		}
	}

	insertText(parentNode: parse5.ParentNode, text: string): void {
		const lastChild = (parentNode as slimdom.Node).lastChild;
		if (lastChild && lastChild.nodeType === slimdom.Node.TEXT_NODE) {
			(lastChild as slimdom.Text).appendData(text);
			return;
		}

		(parentNode as slimdom.Node).appendChild(this._globalDocument.createTextNode(text));
	}

	insertTextBefore(
		parentNode: parse5.ParentNode,
		text: string,
		referenceNode: parse5.Node
	): void {
		const sibling = referenceNode && (referenceNode as slimdom.Node).previousSibling;
		if (sibling && sibling.nodeType === slimdom.Node.TEXT_NODE) {
			(sibling as slimdom.Text).appendData(text);
			return;
		}

		(parentNode as slimdom.Node).insertBefore(
			this._globalDocument.createTextNode(text),
			referenceNode as slimdom.Node
		);
	}

	adoptAttributes(recipient: parse5.Element, attrs: parse5.Attribute[]): void {
		const element = recipient as slimdom.Element;
		attrs.forEach(attr => {
			if (!element.hasAttributeNS(undefinedAsNull(attr.namespace), attr.name)) {
				element.setAttributeNS(
					undefinedAsNull(attr.namespace),
					attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name,
					attr.value
				);
			}
		});
	}

	getFirstChild(node: parse5.ParentNode): parse5.Node {
		return (node as slimdom.Node).firstChild!;
	}

	getChildNodes(node: parse5.ParentNode): parse5.Node[] {
		return (node as slimdom.Node).childNodes;
	}

	getParentNode(node: parse5.Node): parse5.ParentNode {
		return (node as slimdom.Node).parentNode!;
	}

	getAttrList(element: parse5.Element): parse5.Attribute[] {
		return (element as slimdom.Element).attributes.map(attr => ({
			name: attr.localName,
			namespace: attr.namespaceURI || undefined,
			prefix: attr.prefix || undefined,
			value: attr.value
		}));
	}

	getTagName(element: parse5.Element): string {
		return (element as slimdom.Element).tagName;
	}

	getNamespaceURI(element: parse5.Element): string {
		return (element as slimdom.Element).namespaceURI!;
	}

	getTextNodeContent(textNode: parse5.TextNode): string {
		return (textNode as slimdom.Text).data;
	}

	getCommentNodeContent(commentNode: parse5.CommentNode): string {
		return (commentNode as slimdom.Comment).data;
	}

	getDocumentTypeNodeName(doctypeNode: parse5.DocumentType): string {
		return (doctypeNode as slimdom.DocumentType).name;
	}

	getDocumentTypeNodePublicId(doctypeNode: parse5.DocumentType): string {
		return (doctypeNode as slimdom.DocumentType).publicId;
	}

	getDocumentTypeNodeSystemId(doctypeNode: parse5.DocumentType): string {
		return (doctypeNode as slimdom.DocumentType).systemId;
	}

	isTextNode(node: parse5.Node): boolean {
		return node && (node as slimdom.Node).nodeType === slimdom.Node.TEXT_NODE;
	}

	isCommentNode(node: parse5.Node): boolean {
		return node && (node as slimdom.Node).nodeType === slimdom.Node.COMMENT_NODE;
	}

	isDocumentTypeNode(node: parse5.Node): boolean {
		return node && (node as slimdom.Node).nodeType === slimdom.Node.DOCUMENT_TYPE_NODE;
	}

	isElementNode(node: parse5.Node): boolean {
		return node && (node as slimdom.Node).nodeType === slimdom.Node.ELEMENT_NODE;
	}
}
