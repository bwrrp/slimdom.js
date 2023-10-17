import Attr from '../Attr';
import Element from '../Element';
import { isAttrNode } from '../util/NodeType';
import { XML_NAMESPACE, XMLNS_NAMESPACE } from '../util/namespaceHelpers';

export type PrefixIndex = { value: number };

// 3.2.1.1.2 The Namespace Prefix Map

/**
 * A namespace prefix map is a map that associates namespaceURI and namespace
 * prefix lists.
 *
 * This deviates from the specification to fix a number of bugs in the spec that
 * can cause it to otherwise produce non-well-formed markup or markup that does
 * not capture the author's intent.
 *
 * Instead of only tracking candidate prefixes by namespace, this also tracks
 * the current prefix to namespace mapping so we can properly detect when
 * prefixes have been redefined. This implementation also tracks maps as a tree
 * to avoid copying as well as the need to separately track locally defined
 * prefixes.
 */
export class NamespacePrefixMap {
	private _parent: NamespacePrefixMap | null;

	private _nsByPrefix = new Map<string | null, string | null>();

	private _prefixCandidatesByNs: Map<string | null, (string | null)[]> = new Map();

	private constructor(parent: NamespacePrefixMap | null) {
		this._parent = parent;
	}

	public static new(): NamespacePrefixMap {
		const map = new NamespacePrefixMap(null);
		// Register implicitly declared namespaces
		map.add(null, null);
		map.add('xml', XML_NAMESPACE);
		map.add('xmlns', XMLNS_NAMESPACE);
		return map;
	}

	/**
	 * To add a prefix string prefix to the namespace prefix map map given a
	 * namespace ns, the user agent should:
	 *
	 * @param prefix - The prefix to add
	 * @param ns     - The namespace to add for prefix
	 */
	public add(prefix: string | null, ns: string | null): void {
		// 1. Let candidates list be the result of retrieving a list from map where there exists a
		// key in map that matches the value of ns or if there is no such key, then let candidates
		// list be null.
		// (undefined used instead of null for convenience)
		const candidatesList = this._prefixCandidatesByNs.get(ns);

		// 2. If candidates list is null, then create a new list with prefix as the only item in the
		// list, and associate that list with a new key ns in map.
		if (candidatesList === undefined) {
			this._prefixCandidatesByNs.set(ns, [prefix]);
		} else {
			// 3. Otherwise, append prefix to the end of candidates list.
			candidatesList.push(prefix);
		}

		// NOTE: The steps in retrieve a preferred prefix string use the list to track the most
		// recently used (MRU) prefix associated with a given namespace, which will be the prefix at
		// the end of the list. This list may contain duplicates of the same prefix value seen
		// earlier (and that's OK).

		this._nsByPrefix.set(prefix, ns);
	}

	public recordNamespaceInformation(element: Element): NamespacePrefixMap {
		const map = new NamespacePrefixMap(this);
		for (const attr of element.attributes) {
			if (attr.namespaceURI !== XMLNS_NAMESPACE) {
				// Not a namespace declaration attribute
				continue;
			}

			const namespaceUri = attr.value === '' ? null : attr.value;
			const definedPrefix = attr.prefix === null ? null : attr.localName;
			map.add(definedPrefix, namespaceUri);
		}
		return map;
	}

	private _localPrefixToNamespace(prefix: string | null): string | null | undefined {
		return this._nsByPrefix.get(prefix);
	}

	private _inheritedPrefixToNamespace(prefix: string | null): string | null | undefined {
		return this._parent?.prefixToNamespace(prefix);
	}

	public prefixToNamespace(prefix: string | null): string | null | undefined {
		const ns = this._localPrefixToNamespace(prefix);
		if (ns !== undefined) {
			return ns;
		}
		return this._inheritedPrefixToNamespace(prefix);
	}

	public shouldSerializeDeclaration(prefix: string | null, ns: string | null): boolean {
		// An existing declaration attribute should be skipped if it doesn't
		// match the local scope. It can be skipped if it doesn't change the
		// inherited value.
		return this.prefixToNamespace(prefix) === ns && this._inheritedPrefixToNamespace(prefix) !== ns;
	}

	private _getCandidatePrefix(namespaceUri: string | null): string | null | undefined {
		const candidates = this._prefixCandidatesByNs.get(namespaceUri);
		if (candidates !== undefined) {
			for (let i = candidates.length - 1; i >= 0; --i) {
				const candidate = candidates[i];
				if (this.prefixToNamespace(candidate) === namespaceUri) {
					return candidate;
				}
			}
		}
		return undefined;
	}

	public getPreferredPrefix(node: Element | Attr, prefixIndex: PrefixIndex): string | null {
		// XML namespace must use the "xml" prefix
		if (node.namespaceURI === XML_NAMESPACE) {
			return 'xml';
		}

		// XMLNS namespace must use "xmlns", except for default namespace
		// declarations, which use no prefix
		const isAttr = isAttrNode(node);
		if (node.namespaceURI === XMLNS_NAMESPACE) {
			if (isAttr && node.prefix === null) {
				return null;
			}
			return 'xmlns';
		}

		// attributes in the null namespace don't have a prefix
		if (isAttr && node.namespaceURI === null) {
			return null;
		}

		// elements use no prefix if their namespace is the inherited default
		// namespace
		if (!isAttr) {
			let inheritedNs = this._inheritedPrefixToNamespace(null) ?? null;
			if (node.namespaceURI === inheritedNs) {
				// The caller should add this to the map to ensure that any
				// current default namespace declaration is ignored.
				return null;
			}
		}

		// If the authored prefix resolves to the requested namespace in scope,
		// we can use it, except that attributes in a namespace can't use an
		// empty prefix.
		if ((!isAttr || node.prefix !== null) && this.prefixToNamespace(node.prefix) === node.namespaceURI) {
			return node.prefix;
		}

		// If any prefixes in scope resolve to the requested namespace, use the
		// most recent one.
		const candidatePrefix = this._getCandidatePrefix(node.namespaceURI);
		if (candidatePrefix !== undefined) {
			return candidatePrefix;
		}

		// No suitable existing declaration, try to use the authored prefix

		// Attributes can't use the authored prefix if it conflicts with an existing local declaration
		if (isAttr) {
			const namespaceForPrefix = this._localPrefixToNamespace(node.prefix);
			const isValidPrefix = node.prefix !== null && (namespaceForPrefix === undefined || namespaceForPrefix === node.namespaceURI);

			if (!isValidPrefix) {
				// Collision - generate a new prefix
				while (true) {
					const generatedPrefix = `ns${prefixIndex.value}`;
					prefixIndex.value += 1;
					if (this._localPrefixToNamespace(generatedPrefix) === undefined) {
						return generatedPrefix;
					}
				}
			}
		}

		return node.prefix;
	}
}
