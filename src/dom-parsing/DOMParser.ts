import Document from '../Document';
import { parseDocument } from './parsingAlgorithms';

export default class DOMParser {
	/**
	 * Constructs a new DOMParser object.
	 */
	public constructor() {}

	/**
	 * Parse str using a parser that matches type's supported MIME types (either XML or HTML), and
	 * return a Document object containing the parsed content if successful. If not successful,
	 * returns a Document describing the error.
	 *
	 * @param str  The string to parse
	 * @param type The mime type to parse the string as
	 *
	 * @return Either the document resulting from successfully parsing str, or a document describing
	 * the error.
	 */
	public parseFromString(str: string, type: string): Document {
		switch (type) {
			case 'text/html':
				// Parse str with an HTML parser, and return the newly created Document.
				// The scripting flag must be set to "disabled".
				// NOTE: meta elements are not taken into account for the encoding used, as a
				// Unicode stream is passed into the parser.
				// NOTE: script elements get marked unexecutable and the contents of noscript get
				// parsed as markup.
				throw new Error('HTML parsing is not implemented');

			case 'text/xml':
			case 'application/xml':
			case 'application/xhtml+xml':
			case 'image/svg+xml':
				try {
					// 1. Parse str with a namespace-enabled XML parser.
					// NOTE: For all XHTML script elements parsed using the XML parser, the
					// equivalent of the scripting flag must be set to "disabled".
					const doc = parseDocument(str);

					// 2. If the previous step didn't return an error, return the newly created
					// Document.
					return doc;
				} catch (error: unknown) {
					// 3. Let document be a newly-created XML Document. The document will use the
					// Document interface rather than the XMLDocument interface.
					const document = new Document();

					// 4. Let root be a new Element, with its local name set to "parsererror" and
					// its namespace set to "http://www.mozilla.org/newlayout/xml/parsererror.xml".
					const root = document.createElementNS(
						'http://www.mozilla.org/newlayout/xml/parsererror.xml',
						'parsererror'
					);

					// At this point user agents may append nodes to root, for example to describe
					// the nature of the error.
					root.appendChild(document.createTextNode(`${error}`));

					// 5. Append root to document.
					document.appendChild(root);

					// 6. Return the value of document.
					return document;
				}

			default:
				throw new TypeError(
					`The type "${type}" is not a valid value in the SupportedType enumeration.`
				);
		}
	}
}
