define(
	[
		'./Document',
		'./DocumentType'
	],
	function(
		Document,
		DocumentType
		) {
		'use strict';

		/**
		 * The DOMImplementation interface represents an object providing methods which are not dependent on any
		 * particular document. Such an object is returned by the Document.implementation property.
		 *
		 * @class DOMImplementation
		 *
		 * @constructor
		 */
		function DOMImplementation() {
		}

		/**
		 * Returns a DocumentType object which can either be used with DOMImplementation.createDocument upon document
		 * creation or can be put into the document via methods like Node.insertBefore() or Node.replaceChild().
		 *
		 * @param {String} qualifiedName Is a String containing the qualified name of the doctype
		 * @param {String} publicId      Is a String containing the PUBLIC identifier.
		 * @param {String} systemId      Is a String containing the SYSTEM identifiers.
		 *
		 * @return {DocumentType} The new document type node.
		 */
		DOMImplementation.prototype.createDocumentType = function(qualifiedName, publicId, systemId) {
			return new DocumentType(qualifiedName, publicId, systemId);
		};

		/**
		 * Creates and returns a new Document.
		 *
		 * @param {String}       [namespace]    Is a String containing the namespace URI of the document to be
		 *                                        created, or null if the document doesn't belong to one. Note that
		 *                                        as namespaces are not yet supported, this parameter is ignored.
		 * @param {String}       qualifiedName  Is a String containing the qualified name, that is an optional prefix
		 *                                        and colon plus the local root element name, of the document to be
		 *                                        created. If set to the empty string, no root element is created.
		 *                                        Note that as namespaces are not yet supported, any prefix used will
		 *                                        be ignored.
		 * @param {DocumentType} [doctype]      Is the DocumentType of the document to be created. Defaults to null.
		 *
		 * @return {Document} The new document node
		 */
		DOMImplementation.prototype.createDocument = function(namespace, qualifiedName, doctype) {
			// Shuffle arguments if namespace is omitted
			var qualifiedNameType = typeof qualifiedName;
			if (qualifiedNameType === 'undefined') {
				qualifiedName = namespace;
				namespace = null;
			} else if (qualifiedNameType === 'object') {
				doctype = qualifiedName;
				qualifiedName = namespace;
				namespace = null;
			}

			var document = new Document(),
				element = null;
			if (qualifiedName !== '') {
				// TODO: use createElementNS once it is supported
				element = document.createElement(qualifiedName);
			}

			if (doctype) {
				document.appendChild(doctype);
			}

			if (element) {
				document.appendChild(element);
			}

			return document;
		};

		return DOMImplementation;
	}
);
