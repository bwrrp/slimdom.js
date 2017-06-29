import * as fs from 'fs';
import * as parse5 from 'parse5';
import * as path from 'path';

import * as slimdom from '../../src/index';

import SlimdomTreeAdapter from './SlimdomTreeAdapter';

const TEST_BLACKLIST: { [key: string]: string | { [key: string]: string } } = {
	'dom/historical.html': 'WebIDL parsing not implemented',
	'dom/interface-objects.html': 'window not implemented',
	'dom/interfaces.html': 'WebIDL parsing not implemented',
	'dom/collections': 'This implementation uses arrays instead of collection types',
	'dom/events': 'Events not implemented',
	'dom/lists': 'DOMTokenList (Element#classList) not implemented',
	'dom/nodes/append-on-Document.html': 'ParentNode#append not implemented',
	'dom/nodes/attributes.html': {
		'setAttribute should lowercase its name argument (upper case attribute)':
			'HTML attribute lowercasing not implemented',
		'setAttribute should lowercase its name argument (mixed case attribute)':
			'HTML attribute lowercasing not implemented',
		'Attributes should work in document fragments.':
			'Element#attributes not implemented as NamedNodeMap',
		'Only lowercase attributes are returned on HTML elements (upper case attribute)':
			'HTML attribute lowercasing not implemented',
		'Only lowercase attributes are returned on HTML elements (mixed case attribute)':
			'HTML attribute lowercasing not implemented',
		'setAttributeNode, if it fires mutation events, should fire one with the new node when resetting an existing attribute (outer shell)':
			'Mutation events not implemented',
		'getAttributeNames tests': 'Element#getAttributeNames not implemented',
		'Own property correctness with basic attributes':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property correctness with non-namespaced attribute before same-name namespaced one':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property correctness with namespaced attribute before same-name non-namespaced one':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property correctness with two namespaced attributes with the same name-with-prefix':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property names should only include all-lowercase qualified names for an HTML element in an HTML document':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property names should include all qualified names for a non-HTML element in an HTML document':
			'Element#attributes not implemented as NamedNodeMap',
		'Own property names should include all qualified names for an HTML element in a non-HTML document':
			'Element#attributes not implemented as NamedNodeMap'
	},
	'dom/nodes/case.html': 'HTML case behavior not implemented',
	'dom/nodes/CharacterData-remove.html': 'ChildNode#remove not implemented',
	'dom/nodes/ChildNode-after.html': 'ChildNode#after not implemented',
	'dom/nodes/ChildNode-before.html': 'ChildNode#before not implemented',
	'dom/nodes/ChildNode-replaceWith.html': 'ChildNode#replaceWith not implemented',
	'dom/nodes/Comment-constructor.html': 'Comment constructor not implemented',
	'dom/nodes/Document-characterSet-normalization.html': 'Document#characterSet not implemented',
	'dom/nodes/Document-constructor.html': {
		'new Document(): URL parsing': 'HTMLAnchorElement not implemented'
	},
	'dom/nodes/Document-contentType': 'Document#contentType not implemented',
	'dom/nodes/Document-createAttribute.html': {
		'HTML document.createAttribute("TITLE")': 'HTML attribute lowercasing not implemented'
	},
	'dom/nodes/Document-createElement.html': 'Document load using iframe not implemented',
	'dom/nodes/Document-createElement-namespace.html': 'DOMParser / contentType not implemented',
	'dom/nodes/Document-createElement-namespace-tests':
		'Document load using iframe not implemented',
	'dom/nodes/Document-createElementNS.html': 'Document load using iframe not implemented',
	'dom/nodes/Document-createEvent.html': 'Document#createEvent not implemented',
	'dom/nodes/Document-createTreeWalker.html': 'Document#createTreeWalker not implemented',
	'dom/nodes/Document-getElementById.html': 'Document#getElementById not implemented',
	'dom/nodes/Document-getElementsByTagName.html': 'Document#getElementsByTagName not implemented',
	'dom/nodes/Document-getElementsByTagNameNS.html':
		'Document#getElementsByTagNameNS not implemented',
	'dom/nodes/Document-URL.sub.html': 'Document#URL not implemented',
	'dom/nodes/DocumentType-literal.html': 'Depends on HTML parsing',
	'dom/nodes/DocumentType-remove.html': 'ChildNode#remove not implemented',
	'dom/nodes/DOMImplementation-createDocument.html': {
		'createDocument test: metadata for "http://www.w3.org/1999/xhtml","",null':
			'HTML contentType not implemented',
		'createDocument test: metadata for "http://www.w3.org/2000/svg","",null':
			'SVG contentType not implemented'
	},
	'dom/nodes/DOMImplementation-createDocumentType.html':
		'DocumentType#ownerDocument not implemented per spec',
	'dom/nodes/DOMImplementation-createHTMLDocument.html':
		'HTML*Element interfaces not implemented',
	'dom/nodes/DOMImplementation-hasFeature.html': 'DOMImplementation#hasFeature not implemented',
	'dom/nodes/Element-children.html': 'Element#children not implemented as HTMLCollection',
	'dom/nodes/Element-classlist.html': 'Element#classList not implemented',
	'dom/nodes/Element-closest.html': 'Element#closest not implemented',
	'dom/nodes/Element-getElementsByClassName.html':
		'Element#getElementsByClassName not implemented',
	'dom/nodes/Element-getElementsByTagName-change-document-HTMLNess.html':
		'Element#getElementsByTagName not implemented',
	'dom/nodes/Element-getElementsByTagName-change-document-HTMLNess-iframe.html':
		'Element#getElementsByTagName not implemented',
	'dom/nodes/Element-getElementsByTagName.html': 'Element#getElementsByTagName not implemented',
	'dom/nodes/Element-getElementsByTagNameNS.html':
		'Element#getElementsByTagNameNS not implemented',
	'dom/nodes/Element-insertAdjacentElement.html': 'Element#insertAdjacentElement not implemented',
	'dom/nodes/Element-insertAdjacentText.html': 'Element#insertAdjacentText not implemented',
	'dom/nodes/Element-matches.html': 'Element#matches not implemented',
	'dom/nodes/Element-remove.html': 'ChildNode#remove not implemented',
	'dom/nodes/Element-tagName.html': 'HTML tagName uppercasing not implemented',
	'dom/nodes/Element-webkitMatchesSelector.html': 'Element#webkitMatchesSelector not implemented',
	'dom/nodes/insert-adjacent.html':
		'Element#insertAdjacentElement / Element#insertAdjacentText not implemented',
	'dom/nodes/MutationObserver-attributes.html': {
		'attributes Element.id: update, no oldValue, mutation': 'Element#id not implemented',
		'attributes Element.id: update mutation': 'Element#id not implemented',
		'attributes Element.id: empty string update mutation': 'Element#id not implemented',
		'attributes Element.id: same value mutation': 'Element#id not implemented',
		'attributes Element.unknown: IDL attribute no mutation': 'Element#id not implemented',
		'attributes HTMLInputElement.type: type update mutation':
			'HTMLInputElement not implemented',
		'attributes Element.className: new value mutation': 'Element#className not implemented',
		'attributes Element.className: empty string update mutation':
			'Element#className not implemented',
		'attributes Element.className: same value mutation': 'Element#className not implemented',
		'attributes Element.className: same multiple values mutation':
			'Element#className not implemented',
		'attributes Element.classList.add: single token addition mutation':
			'Element#classList not implemented',
		'attributes Element.classList.add: multiple tokens addition mutation':
			'Element#classList not implemented',
		'attributes Element.classList.add: syntax err/no mutation':
			'Element#classList not implemented',
		'attributes Element.classList.add: invalid character/no mutation':
			'Element#classList not implemented',
		'attributes Element.classList.add: same value mutation':
			'Element#classList not implemented',
		'attributes Element.classList.remove: single token removal mutation':
			'Element#classList not implemented',
		'attributes Element.classList.remove: multiple tokens removal mutation':
			'Element#classList not implemented',
		'attributes Element.classList.remove: missing token removal mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: token removal mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: token addition mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: forced token removal mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: forced missing token removal no mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: forced existing token addition no mutation':
			'Element#classList not implemented',
		'attributes Element.classList.toggle: forced token addition mutation':
			'Element#classList not implemented',
		'attributes Element.removeAttribute: removal no mutation': 'Element#id not implemented',
		'childList HTMLInputElement.removeAttribute: type removal mutation':
			'Element#id not implemented',
		'attributes Element.removeAttributeNS: removal no mutation': 'Element#id not implemented',
		'attributes Element.removeAttributeNS: prefixed attribute removal no mutation':
			'Element#id not implemented',
		'attributes/attributeFilter Element.id/Element.className: update mutation':
			'attributeFilter not implemented',
		'attributes/attributeFilter Element.id/Element.className: multiple filter update mutation':
			'attributeFilter not implemented',
		'attributeOldValue alone Element.id: update mutation': 'Element#id not implemented',
		'attributeFilter alone Element.id/Element.className: multiple filter update mutation':
			'attributeFilter not implemented',
		'childList false: no childList mutation': 'Element#textContent setter not implemented'
	},
	'dom/nodes/MutationObserver-characterData.html': {
		'characterData Range.deleteContents: child and data removal mutation':
			'Range#deleteContents not implemented',
		'characterData Range.deleteContents: child and data removal mutation (2)':
			'Range#deleteContents not implemented',
		'characterData Range.extractContents: child and data removal mutation':
			'Range#extractContents not implemented',
		'characterData Range.extractContents: child and data removal mutation (2)':
			'Range#extractContents not implemented'
	},
	'dom/nodes/MutationObserver-childList.html': {
		'childList Node.textContent: replace content mutation':
			'Element#textContent setter not implemented',
		'childList Node.textContent: no previous content mutation':
			'Element#textContent setter not implemented',
		'childList Node.textContent: textContent no mutation':
			'Element#textContent setter not implemented',
		'childList Node.textContent: empty string mutation':
			'Element#textContent setter not implemented',
		'childList Range.deleteContents: child removal mutation':
			'Range#deleteContents not implemented',
		'childList Range.deleteContents: child and data removal mutation':
			'Range#deleteContents not implemented',
		'childList Range.extractContents: child removal mutation':
			'Range#extractContents not implemented',
		'childList Range.extractContents: child and data removal mutation':
			'Range#extractContents not implemented',
		'childList Range.insertNode: child insertion mutation': 'Range#insertNode not implemented',
		'childList Range.insertNode: children insertion mutation':
			'Range#insertNode not implemented',
		'childList Range.surroundContents: children removal and addition mutation':
			'Range#surroundContents not implemented'
	},
	'dom/nodes/MutationObserver-disconnect.html': 'Element#id not implemented',
	'dom/nodes/MutationObserver-document.html': 'Running script during parsing not implemented',
	'dom/nodes/MutationObserver-inner-outer.html':
		'Element#innerHTML / Element#outerHTML not implemented',
	'dom/nodes/MutationObserver-subtree.html': 'Element#id not implemented',
	'dom/nodes/MutationObserver-takeRecords.html': 'Element#textContent setter not implemented',
	'dom/nodes/Node-baseURI.html': 'Node#baseURI not implemented',
	'dom/nodes/Node-childNodes.html': 'Node#childNodes not implemented as HTMLCollection',
	'dom/nodes/Node-cloneNode.html': {
		'createElement(a)': 'HTMLElement interfaces not implemented',
		'createElement(abbr)': 'HTMLElement interfaces not implemented',
		'createElement(acronym)': 'HTMLElement interfaces not implemented',
		'createElement(address)': 'HTMLElement interfaces not implemented',
		'createElement(applet)': 'HTMLElement interfaces not implemented',
		'createElement(area)': 'HTMLElement interfaces not implemented',
		'createElement(article)': 'HTMLElement interfaces not implemented',
		'createElement(aside)': 'HTMLElement interfaces not implemented',
		'createElement(audio)': 'HTMLElement interfaces not implemented',
		'createElement(b)': 'HTMLElement interfaces not implemented',
		'createElement(base)': 'HTMLElement interfaces not implemented',
		'createElement(bdi)': 'HTMLElement interfaces not implemented',
		'createElement(bdo)': 'HTMLElement interfaces not implemented',
		'createElement(bgsound)': 'HTMLElement interfaces not implemented',
		'createElement(big)': 'HTMLElement interfaces not implemented',
		'createElement(blockquote)': 'HTMLElement interfaces not implemented',
		'createElement(body)': 'HTMLElement interfaces not implemented',
		'createElement(br)': 'HTMLElement interfaces not implemented',
		'createElement(button)': 'HTMLElement interfaces not implemented',
		'createElement(canvas)': 'HTMLElement interfaces not implemented',
		'createElement(caption)': 'HTMLElement interfaces not implemented',
		'createElement(center)': 'HTMLElement interfaces not implemented',
		'createElement(cite)': 'HTMLElement interfaces not implemented',
		'createElement(code)': 'HTMLElement interfaces not implemented',
		'createElement(col)': 'HTMLElement interfaces not implemented',
		'createElement(colgroup)': 'HTMLElement interfaces not implemented',
		'createElement(data)': 'HTMLElement interfaces not implemented',
		'createElement(datalist)': 'HTMLElement interfaces not implemented',
		'createElement(dialog)': 'HTMLElement interfaces not implemented',
		'createElement(dd)': 'HTMLElement interfaces not implemented',
		'createElement(del)': 'HTMLElement interfaces not implemented',
		'createElement(details)': 'HTMLElement interfaces not implemented',
		'createElement(dfn)': 'HTMLElement interfaces not implemented',
		'createElement(dir)': 'HTMLElement interfaces not implemented',
		'createElement(div)': 'HTMLElement interfaces not implemented',
		'createElement(dl)': 'HTMLElement interfaces not implemented',
		'createElement(dt)': 'HTMLElement interfaces not implemented',
		'createElement(embed)': 'HTMLElement interfaces not implemented',
		'createElement(fieldset)': 'HTMLElement interfaces not implemented',
		'createElement(figcaption)': 'HTMLElement interfaces not implemented',
		'createElement(figure)': 'HTMLElement interfaces not implemented',
		'createElement(font)': 'HTMLElement interfaces not implemented',
		'createElement(footer)': 'HTMLElement interfaces not implemented',
		'createElement(form)': 'HTMLElement interfaces not implemented',
		'createElement(frame)': 'HTMLElement interfaces not implemented',
		'createElement(frameset)': 'HTMLElement interfaces not implemented',
		'createElement(h1)': 'HTMLElement interfaces not implemented',
		'createElement(h2)': 'HTMLElement interfaces not implemented',
		'createElement(h3)': 'HTMLElement interfaces not implemented',
		'createElement(h4)': 'HTMLElement interfaces not implemented',
		'createElement(h5)': 'HTMLElement interfaces not implemented',
		'createElement(h6)': 'HTMLElement interfaces not implemented',
		'createElement(head)': 'HTMLElement interfaces not implemented',
		'createElement(header)': 'HTMLElement interfaces not implemented',
		'createElement(hgroup)': 'HTMLElement interfaces not implemented',
		'createElement(hr)': 'HTMLElement interfaces not implemented',
		'createElement(html)': 'HTMLElement interfaces not implemented',
		'createElement(i)': 'HTMLElement interfaces not implemented',
		'createElement(iframe)': 'HTMLElement interfaces not implemented',
		'createElement(img)': 'HTMLElement interfaces not implemented',
		'createElement(input)': 'HTMLElement interfaces not implemented',
		'createElement(ins)': 'HTMLElement interfaces not implemented',
		'createElement(isindex)': 'HTMLElement interfaces not implemented',
		'createElement(kbd)': 'HTMLElement interfaces not implemented',
		'createElement(label)': 'HTMLElement interfaces not implemented',
		'createElement(legend)': 'HTMLElement interfaces not implemented',
		'createElement(li)': 'HTMLElement interfaces not implemented',
		'createElement(link)': 'HTMLElement interfaces not implemented',
		'createElement(main)': 'HTMLElement interfaces not implemented',
		'createElement(map)': 'HTMLElement interfaces not implemented',
		'createElement(mark)': 'HTMLElement interfaces not implemented',
		'createElement(marquee)': 'HTMLElement interfaces not implemented',
		'createElement(meta)': 'HTMLElement interfaces not implemented',
		'createElement(meter)': 'HTMLElement interfaces not implemented',
		'createElement(nav)': 'HTMLElement interfaces not implemented',
		'createElement(nobr)': 'HTMLElement interfaces not implemented',
		'createElement(noframes)': 'HTMLElement interfaces not implemented',
		'createElement(noscript)': 'HTMLElement interfaces not implemented',
		'createElement(object)': 'HTMLElement interfaces not implemented',
		'createElement(ol)': 'HTMLElement interfaces not implemented',
		'createElement(optgroup)': 'HTMLElement interfaces not implemented',
		'createElement(option)': 'HTMLElement interfaces not implemented',
		'createElement(output)': 'HTMLElement interfaces not implemented',
		'createElement(p)': 'HTMLElement interfaces not implemented',
		'createElement(param)': 'HTMLElement interfaces not implemented',
		'createElement(pre)': 'HTMLElement interfaces not implemented',
		'createElement(progress)': 'HTMLElement interfaces not implemented',
		'createElement(q)': 'HTMLElement interfaces not implemented',
		'createElement(rp)': 'HTMLElement interfaces not implemented',
		'createElement(rt)': 'HTMLElement interfaces not implemented',
		'createElement(ruby)': 'HTMLElement interfaces not implemented',
		'createElement(s)': 'HTMLElement interfaces not implemented',
		'createElement(samp)': 'HTMLElement interfaces not implemented',
		'createElement(script)': 'HTMLElement interfaces not implemented',
		'createElement(section)': 'HTMLElement interfaces not implemented',
		'createElement(select)': 'HTMLElement interfaces not implemented',
		'createElement(small)': 'HTMLElement interfaces not implemented',
		'createElement(source)': 'HTMLElement interfaces not implemented',
		'createElement(spacer)': 'HTMLElement interfaces not implemented',
		'createElement(span)': 'HTMLElement interfaces not implemented',
		'createElement(strike)': 'HTMLElement interfaces not implemented',
		'createElement(style)': 'HTMLElement interfaces not implemented',
		'createElement(sub)': 'HTMLElement interfaces not implemented',
		'createElement(summary)': 'HTMLElement interfaces not implemented',
		'createElement(sup)': 'HTMLElement interfaces not implemented',
		'createElement(table)': 'HTMLElement interfaces not implemented',
		'createElement(tbody)': 'HTMLElement interfaces not implemented',
		'createElement(td)': 'HTMLElement interfaces not implemented',
		'createElement(template)': 'HTMLElement interfaces not implemented',
		'createElement(textarea)': 'HTMLElement interfaces not implemented',
		'createElement(th)': 'HTMLElement interfaces not implemented',
		'createElement(time)': 'HTMLElement interfaces not implemented',
		'createElement(title)': 'HTMLElement interfaces not implemented',
		'createElement(tr)': 'HTMLElement interfaces not implemented',
		'createElement(tt)': 'HTMLElement interfaces not implemented',
		'createElement(track)': 'HTMLElement interfaces not implemented',
		'createElement(u)': 'HTMLElement interfaces not implemented',
		'createElement(ul)': 'HTMLElement interfaces not implemented',
		'createElement(var)': 'HTMLElement interfaces not implemented',
		'createElement(video)': 'HTMLElement interfaces not implemented',
		'createElement(unknown)': 'HTMLElement interfaces not implemented',
		'createElement(wbr)': 'HTMLElement interfaces not implemented',
		'createElementNS HTML': 'HTMLElement interfaces not implemented',
		'node with children': 'HTMLElement interfaces not implemented'
	},
	'dom/nodes/Node-compareDocumentPosition.html': 'Node#compareDocumentPosition not implemented',
	'dom/nodes/Node-constants.html': {
		'Constants for createDocumentPosition on Node interface object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Node prototype object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Element object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Text object.':
			'Node#compareDocumentPosition not implemented'
	},
	'dom/nodes/Node-contains.html': 'Element#textContent setter not implemented',
	'dom/nodes/Node-isConnected.html': 'Node#isConnected not implemented',
	'dom/nodes/Node-isEqualNode.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isEqualNode-iframe1.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isEqualNode-iframe2.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isSameNode.html': 'Node#isSameNode not implemented',
	'dom/nodes/NodeList-Iterable.html': 'NodeList not implemented',
	'dom/nodes/Node-nodeName.html': {
		'For Element nodes, nodeName should return the same as tagName.':
			'HTML tagName uppercasing not implemented'
	},
	'dom/nodes/Node-normalize.html': {
		'Node.normalize()': 'Element#textContent not implemented'
	},
	'dom/nodes/Node-parentNode.html': {
		'Removed iframe': 'Document load using iframe not implemented'
	},
	'dom/nodes/Node-properties.html': 'Element#textContent not implemented',
	'dom/nodes/Node-replaceChild.html': {
		'replaceChild should work in the presence of mutation events.':
			'Mutation events not implemented'
	},
	'dom/nodes/Node-textContent.html': 'Node#textContent not implemented',
	'dom/nodes/ParentNode-append.html': 'ParentNode#append not implemented',
	'dom/nodes/ParentNode-prepend.html': 'ParentNode#prepend not implemented',
	'dom/nodes/ParentNode-querySelector-All-content.html':
		'ParentNode#querySelectorAll not implemented',
	'dom/nodes/ParentNode-querySelector-All.html': 'ParentNode#querySelectorAll not implemented',
	'dom/nodes/prepend-on-Document.html': 'ParentNode#prepend not implemented',
	'dom/nodes/remove-unscopable.html': 'Methods not implemented',
	'dom/nodes/rootNode.html': 'Node#getRootNode not implemented',
	'dom/nodes/Text-constructor.html': 'Text constructor not implemented',
	'dom/ranges/Range-cloneContents.html': 'Range#cloneContents not implemented',
	'dom/ranges/Range-cloneRange.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-collapse.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-commonAncestorContainer.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-compareBoundaryPoints.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-comparePoint.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-constructor.html': 'Range constructor not implemented',
	'dom/ranges/Range-deleteContents.html': 'Range#deleteContents not implemented',
	'dom/ranges/Range-extractContents.html': 'Range#extractContents not implemented',
	'dom/ranges/Range-insertNode.html': 'Range#insertNode not implemented',
	'dom/ranges/Range-intersectsNode.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-isPointInRange.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-appendChild.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-appendData.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-dataChange.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-deleteData.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-insertBefore.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-insertData.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-removeChild.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-replaceChild.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-replaceData.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-mutations-splitText.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-selectNode.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-set.html': 'Element#textContent setter not implemented',
	'dom/ranges/Range-stringifier.html': 'Range#toString not implemented',
	'dom/ranges/Range-surroundContents.html': 'Range#surroundContents not implemented',
	'dom/traversal': 'NodeIterator and TreeWalker not implemented'
};

function getNodes(root: slimdom.Node, ...path: string[]): slimdom.Node[] {
	if (!path.length) {
		return [root];
	}

	const [nodeName, ...remainder] = path;
	const matchingChildren = Array.from((root as slimdom.Element).childNodes).filter(
		n => n.nodeName === nodeName
	);
	return matchingChildren.reduce(
		(nodes, child) => nodes.concat(getNodes(child, ...remainder)),
		[] as slimdom.Node[]
	);
}

function getAllText(root: slimdom.Node, ...path: string[]): string {
	return getNodes(root, ...path)
		.map(n => (n as slimdom.Text).data)
		.join('');
}

function getAllScripts(doc: slimdom.Document, casePath: string) {
	const scriptElements = (doc as any).getElementsByTagName('script');
	return scriptElements
		.reduce((scripts: string[], el: slimdom.Element) => {
			const src = el.attributes.find(a => a.name === 'src');
			if (src) {
				let resolvedPath: string;
				if (src.value === '/resources/WebIDLParser.js') {
					// Historical alias, unfortunately not an actual file
					// https://github.com/w3c/web-platform-tests/issues/5608
					resolvedPath = path.resolve(
						process.env.WEB_PLATFORM_TESTS_PATH as string,
						'resources/webidl2/lib/webidl2.js'
					);
				} else {
					resolvedPath = src.value.startsWith('/')
						? path.resolve(process.env.WEB_PLATFORM_TESTS_PATH as string, src.value.substring(1))
						: path.resolve(path.dirname(casePath), src.value);
				}
				return scripts.concat([fs.readFileSync(resolvedPath, 'utf-8')]);
			}

			return scripts.concat([getAllText(el, '#text')]);
		}, [])
		.join('\n');
}

function createTest(casePath: string, blacklistReason: { [key: string]: string } = {}): void {
	const document = parse5.parse(fs.readFileSync(casePath, 'utf-8'), {
		treeAdapter: new SlimdomTreeAdapter()
	}) as slimdom.Document;
	const title = getAllText(document, 'html', 'head', 'title', '#text') || path.basename(casePath);
	const script = getAllScripts(document, casePath);
	const scriptAsFunction = new Function(
		'stubEnvironment',
		`with (stubEnvironment) { ${script} }`
	);
	let stubs: { global: any; onLoadCallbacks: Function[]; onErrorCallback?: Function };

	const { document: _, ...domInterfaces } = slimdom;

	function createStubEnvironment(
		document: slimdom.Document
	): { global: any; onLoadCallbacks: Function[]; onErrorCallback?: Function } {
		const onLoadCallbacks: Function[] = [];
		let onErrorCallback: Function | undefined = undefined;
		let global: any = {
			document,
			location: { href: casePath },
			window: null,

			get frames() {
				return (document as any).getElementsByTagName('iframe').map((iframe: any) => {
					if (!iframe.contentWindow) {
						const stubs = createStubEnvironment(
							document.implementation.createHTMLDocument()
						);
						iframe.contentWindow = stubs.global.window;
						iframe.contentDocument = stubs.global.document;
						iframe.document = stubs.global.document;
					}

					return iframe;
				});
			},

			addEventListener(event: string, cb: Function) {
				switch (event) {
					case 'load':
						onLoadCallbacks.push(cb);
						break;

					case 'error':
						onErrorCallback = cb;
						break;

					default:
				}
			},

			...domInterfaces
		};
		global.window = global;
		global.parent = global;
		global.self = global;

		return { global, onLoadCallbacks, onErrorCallback };
	}

	beforeEach(() => {
		stubs = createStubEnvironment(document);
	});

	it(title, (done: Function) => {
		try {
			scriptAsFunction(stubs.global);

			if (!stubs.global.add_completion_callback) {
				// No test harness found, assume file is not really a test case
				done();
				return;
			}

			stubs.global.add_completion_callback(function(tests: any[], testStatus: any) {
				// TODO: Seems to be triggered by duplicate names in the createDocument tests
				//expect(testStatus.status).toBe(testStatus.OK);
				tests.forEach(test => {
					// Ignore results of blacklisted tests
					if (!blacklistReason[test.name]) {
						if (test.status !== testStatus.OK) {
							console.log(`${test.name}: ${test.message}`);
						}
						expect(test.status).toBe(testStatus.OK);
					}
				});
				done();
			});

			stubs.onLoadCallbacks.forEach(cb => cb({}));

			// "Run" iframes
			(stubs.global.frames as any[]).forEach(iframe => {
				if (iframe.onload) {
					iframe.onload();
				}
			});
		} catch (e) {
			if (stubs.onErrorCallback) {
				stubs.onErrorCallback(e);
			} else {
				throw e;
			}
		}
	});
}

function createTests(dirPath: string): void {
	fs.readdirSync(dirPath).forEach(entry => {
		const entryPath = path.join(dirPath, entry);
		const relativePath = path.relative(process.env.WEB_PLATFORM_TESTS_PATH as string, entryPath);
		const blacklistReason = TEST_BLACKLIST[relativePath.replace(/\\/g, '/')];
		if (typeof blacklistReason === 'string') {
			// Create a pending test
			it(`${entry}: ${blacklistReason}`);
			return;
		}

		if (fs.statSync(entryPath).isDirectory()) {
			describe(entry, () => {
				createTests(entryPath);
			});
			return;
		}

		if (entry.endsWith('.html')) {
			createTest(entryPath, blacklistReason);
		}
	});
}

describe('web platform DOM test suite', () => {
	if (!process.env.WEB_PLATFORM_TESTS_PATH) {
		it('requires the WEB_PLATFORM_TESTS_PATH environment variable to be set');
		return;
	}

	// Some web platform tests are a bit slow
	// TODO: change to jest.setTimeout(20000); when jest 21 is released
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

	(slimdom.Document.prototype as any).getElementsByTagName = function(
		this: slimdom.Document,
		tagName: string
	): slimdom.Node[] {
		return (function getElementsByTagName(node: slimdom.Node): slimdom.Node[] {
			return node.childNodes.reduce(
				(elements, child) => {
					if (child.nodeName === tagName) {
						elements.push(child);
					}

					if (child.nodeType === slimdom.Node.ELEMENT_NODE) {
						elements = elements.concat(getElementsByTagName(child));
					}

					return elements;
				},
				[] as slimdom.Node[]
			);
		})(this);
	};

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
			value: 'about:blank'
		},
		documentURI: {
			value: 'about:blank'
		},
		compatMode: {
			value: 'CSS1Compat'
		},
		characterSet: {
			value: 'UTF-8'
		},
		charset: {
			value: 'UTF-8'
		},
		inputEncoding: {
			value: 'UTF-8'
		},
		contentType: {
			value: 'application/xml'
		},
		origin: {
			value: 'null'
		},
		body: {
			get() {
				return this.getElementsByTagName('body')[0] || null;
			}
		},
		title: {
			get() {
				return getAllText(this, 'html', 'head', 'title', '#text');
			}
		}
	});

	(slimdom.Document.prototype as any).querySelectorAll = () => [];
	(slimdom.Document.prototype as any).querySelector = () => null;

	Object.defineProperties(slimdom.Attr.prototype, {
		specified: {
			value: true
		},
		textContent: {
			get() {
				return this.nodeValue;
			}
		}
	});
	Object.defineProperties(slimdom.CharacterData.prototype, {
		textContent: {
			get() {
				return this.nodeValue;
			}
		}
	});
	Object.defineProperties(slimdom.Element.prototype, {
		style: {
			value: {}
		}
	});

	createTests(path.join(process.env.WEB_PLATFORM_TESTS_PATH as string, 'dom'));
});
