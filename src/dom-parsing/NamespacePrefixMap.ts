import Element from '../Element';
import { XML_NAMESPACE, XMLNS_NAMESPACE } from '../util/namespaceHelpers';

// 3.2.1.1.2 The Namespace Prefix Map

/**
 * A namespace prefix map is a map that associates namespaceURI and namespace prefix lists, where
 * namespaceURI values are the map's unique keys (which can include the null value representing no
 * namespace), and ordered lists of associated prefix values are the map's key values. The namespace
 * prefix map will be populated by previously seen namespaceURIs and all their previously
 * encountered prefix associations for a given node and its ancestors.
 *
 * NOTE: the last seen prefix for a given namespaceURI is at the end of its respective list. The
 * list is searched to find potentially matching prefixes, and if no matches are found for the given
 * namespaceURI, then the last prefix in the list is used. See copy a namespace prefix map and
 * retrieve a preferred prefix string for additional details.
 */
export class NamespacePrefixMap {
	private _map: Map<string | null, string[]> = new Map();

	/**
	 * To copy a namespace prefix map map means to copy the map's keys into a new empty namespace
	 * prefix map, and to copy each of the values in the namespace prefix list associated with each
	 * keys' value into a new list which should be associated with the respective key in the new
	 * map.
	 *
	 * @returns A copy of the namespace prefix map
	 */
	public copy(): NamespacePrefixMap {
		const copy = new NamespacePrefixMap();
		// Array.from needed to allow compilation to ES5 targets
		for (const [namespace, prefixes] of Array.from(this._map.entries())) {
			copy._map.set(namespace, prefixes.concat());
		}
		return copy;
	}

	/**
	 * To retrieve a preferred prefix string preferred prefix from the namespace prefix map map
	 * given a namespace ns, the user agent should:
	 *
	 * @param preferredPrefix - The prefix to look up
	 * @param ns              - The namespace for the prefix
	 *
	 * @returns The matching candidate prefix, if found, or null otherwise
	 */
	public retrievePreferredPrefixString(
		preferredPrefix: string | null,
		ns: string | null
	): string | null {
		// 1. Let candidates list be the result of retrieving a list from map where there exists a
		// key in map that matches the value of ns or if there is no such key, then stop running
		// these steps, and return the null value.
		const candidatesList = this._map.get(ns);
		if (candidatesList === undefined) {
			return null;
		}

		// 2. Otherwise, for each prefix value prefix in candidates list, iterating from beginning
		// to end:
		// NOTE: There will always be at least one prefix value in the list.
		for (const prefix of candidatesList) {
			// 2.1. If prefix matches preferred prefix, then stop running these steps and return
			// prefix.
			if (prefix === preferredPrefix) {
				return prefix;
			}

			// 2.2. If prefix is the last item in the candidates list, then stop running these steps
			// and return prefix.
		}
		return candidatesList[candidatesList.length - 1];
	}

	/**
	 * To check if a prefix string prefix is found in a namespace prefix map map given a namespace
	 * ns, the user agent should:
	 *
	 * @param prefix - The prefix to check
	 * @param ns     - The namespace to check
	 *
	 * @returns Whether the combination of prefix and ns is found in the map
	 */
	public checkIfFound(prefix: string, ns: string | null): boolean {
		// 1. Let candidates list be the result of retrieving a list from map where there exists a
		// key in map that matches the value of ns or if there is no such key, then stop running
		// these steps, and return false.
		const candidatesList = this._map.get(ns);
		if (candidatesList === undefined) {
			return false;
		}

		// 2. If the value of prefix occurs at least once in candidates list, return true, otherwise
		// return false.
		return candidatesList.indexOf(prefix) >= 0;
	}

	/**
	 * To add a prefix string prefix to the namespace prefix map map given a namespace ns, the user
	 * agent should:
	 *
	 * @param prefix - The prefix to add
	 * @param ns     - The namespace to add for prefix
	 */
	public add(prefix: string, ns: string | null): void {
		// 1. Let candidates list be the result of retrieving a list from map where there exists a
		// key in map that matches the value of ns or if there is no such key, then let candidates
		// list be null.
		// (undefined used instead of null for convenience)
		const candidatesList = this._map.get(ns);

		// 2. If candidates list is null, then create a new list with prefix as the only item in the
		// list, and associate that list with a new key ns in map.
		if (candidatesList === undefined) {
			this._map.set(ns, [prefix]);
		} else {
			// 3. Otherwise, append prefix to the end of candidates list.
			candidatesList.push(prefix);
		}

		// NOTE: The steps in retrieve a preferred prefix string use the list to track the most
		// recently used (MRU) prefix associated with a given namespace, which will be the prefix at
		// the end of the list. This list may contain duplicates of the same prefix value seen
		// earlier (and that's OK).
	}
}

export type LocalPrefixesMap = { [key: string]: string | null };

// 3.2.1.1.1 Recording the namespace

/**
 * This following algorithm will update the namespace prefix map with any found namespace prefix
 * definitions, add the found prefix definitions to the local prefixes map, and return a local
 * default namespace value defined by a default namespace attribute if one exists. Otherwise it
 * returns null.
 *
 * @param element          - Element for which to record namespace information
 * @param map              - The namespace prefix map to update
 * @param localPrefixesMap - The local prefixes map to update
 *
 * @returns The local default namespace value for element, or null if element does not define one
 */
export function recordNamespaceInformation(
	element: Element,
	map: NamespacePrefixMap,
	localPrefixesMap: LocalPrefixesMap
): string | null {
	// 1. Let default namespace attr value be null.
	let defaultNamespaceAttrValue: string | null = null;

	// 2. Main: For each attribute attr in element's attributes, in the order they are specified in
	// the element's attribute list:
	// NOTE: The following conditional steps find namespace prefixes. Only attributes in the XMLNS
	// namespace are considered (e.g., attributes made to look like namespace declarations via
	// setAttribute("xmlns:pretend-prefix", "pretend-namespace") are not included).
	for (const attr of element.attributes) {
		// 2.1. Let attribute namespace be the value of attr's namespaceURI value.
		const attributeNamespace = attr.namespaceURI;

		// 2.2. Let attribute prefix be the value of attr's prefix.
		const attributePrefix = attr.prefix;

		// 2.3. If the attribute namespace is the XMLNS namespace, then:
		if (attributeNamespace === XMLNS_NAMESPACE) {
			// 2.3.1. If attribute prefix is null, then attr is a default namespace declaration. Set
			// the default namespace attr value to attr's value and stop running these steps,
			// returning to Main to visit the next attribute.
			if (attributePrefix === null) {
				defaultNamespaceAttrValue = attr.value;
				continue;
			}

			// 2.3.2. Otherwise, the attribute prefix is non-null and attr is a namespace prefix
			// definition. Run the following steps:
			// 2.3.2.1. Let prefix definition be the value of attr's localName.
			const prefixDefinition = attr.localName;

			// 2.3.2.2. Let namespace definition be the value of attr's value.
			let namespaceDefinition: string | null = attr.value;

			// 2.3.2.3. If namespace definition is the XML namespace, then stop running these steps,
			// and return to Main to visit the next attribute.
			// NOTE: XML namespace definitions in prefixes are completely ignored (in order to avoid
			// unnecessary work when there might be prefix conflicts). XML namespaced elements are
			// always handled uniformly by prefixing (and overriding if necessary) the element's
			// localname with the reserved "xml" prefix.
			if (namespaceDefinition === XML_NAMESPACE) {
				continue;
			}

			// 2.3.2.4. If namespace definition is the empty string (the declarative form of having
			// no namespace), then let namespace definition be null instead.
			if (namespaceDefinition === '') {
				namespaceDefinition = null;
			}

			// 2.3.2.5. If prefix definition is found in map given the namespace namespace
			// definition, then stop running these steps, and return to Main to visit the next
			// attribute.
			// NOTE: This step avoids adding duplicate prefix definitions for the same namespace in
			// the map. This has the side-effect of avoiding later serialization of duplicate
			// namespace prefix declarations in any descendant nodes.
			if (map.checkIfFound(prefixDefinition, namespaceDefinition)) {
				continue;
			}

			// 2.3.2.6. Add the prefix prefix definition to map given namespace namespace
			// definition.
			map.add(prefixDefinition, namespaceDefinition);

			// 2.3.2.7. Add the value of prefix definition as a new key to the local prefixes map,
			// with the namespace definition as the key's value replacing the value of null with the
			// empty string if applicable.
			localPrefixesMap[prefixDefinition] =
				namespaceDefinition === null ? '' : namespaceDefinition;
		}
	}

	// 3. Return the value of default namespace attr value.
	// NOTE: The empty string is a legitimate return value and is not converted to null.
	return defaultNamespaceAttrValue;
}
