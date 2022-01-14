export type BlockReasonByTestName = Record<string, string>;
export type Blocklist = Record<string, string | BlockReasonByTestName>;
const blocklist: Blocklist = {
	'dom/abort': 'AbortController not implemented',
	'dom/collections': 'This implementation uses arrays instead of collection types',
	'dom/events': 'Events not implemented',
	'dom/eventPathRemoved.html': 'Events not implemented',
	'dom/lists': 'DOMTokenList (Element#classList) not implemented',
	'dom/nodes/Document-contentType': 'Document#contentType not implemented',
	'dom/nodes/aria-attribute-reflection.tentative.html': 'ARIA properties not implemented',
	'dom/nodes/aria-element-reflection.tentative.html': 'ARIA properties not implemented',
	'dom/nodes/attributes.html': {
		'Attributes should work in document fragments.':
			'Element#attributes not implemented as NamedNodeMap',
		'getAttributeNames tests': 'Element#getAttributeNames not implemented',
		'Only lowercase attributes are returned on HTML elements (upper case attribute)':
			'HTML attribute lowercasing not implemented',
		'Only lowercase attributes are returned on HTML elements (mixed case attribute)':
			'HTML attribute lowercasing not implemented',
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
			'Element#attributes not implemented as NamedNodeMap',
		'setAttribute should lowercase its name argument (upper case attribute)':
			'HTML attribute lowercasing not implemented',
		'setAttribute should lowercase its name argument (mixed case attribute)':
			'HTML attribute lowercasing not implemented',
		'setAttributeNode, if it fires mutation events, should fire one with the new node when resetting an existing attribute (outer shell)':
			'Mutation events not implemented',
		'toggleAttribute should lowercase its name argument (mixed case attribute)':
			'HTML attribute lowercasing not implemented',
		'toggleAttribute should lowercase its name argument (upper case attribute)':
			'HTML attribute lowercasing not implemented',
		'Toggling element with inline style should make inline style disappear':
			'style property not implemented',
	},
	'dom/nodes/attributes-namednodemap.html':
		'This implementation uses arrays instead of collection types',
	'dom/nodes/case.html': 'HTML case behavior not implemented',
	'dom/nodes/ChildNode-after.html': {
		'Comment.after() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Comment.after() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.after() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Comment.after() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented (nice, copy paste error in this test name)',
		'Comment.after() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Comment.after() when pre-insert behaves like append.':
			'HTML-specific serialization not implemented',
		'Comment.after() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.after() without any argument.': 'HTML-specific serialization not implemented',
		'Element.after() with null as an argument.': 'HTML-specific serialization not implemented',
		'Element.after() with undefined as an argument.':
			'HTML-specific serialization not implemented',
		'Element.after() with only text as an argument.':
			'HTML-specific serialization not implemented',
		'Element.after() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Element.after() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.after() with context object itself as the argument.':
			'HTML-specific serialization not implemented',
		'Element.after() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Element.after() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Element.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented (another copy-paste error in test name)',
		'Element.after() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Element.after() when pre-insert behaves like append.':
			'HTML-specific serialization not implemented',
		'Element.after() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.after() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Text.after() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.after() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Text.after() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Text.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented (copy-paste error in test name)',
		'Text.after() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Text.after() when pre-insert behaves like append.':
			'HTML-specific serialization not implemented',
		'Text.after() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
	},
	'dom/nodes/ChildNode-before.html': {
		'Comment.before() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Comment.before() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.before() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Comment.before() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented',
		'Comment.before() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Comment.before() when pre-insert behaves like prepend.':
			'HTML-specific serialization not implemented',
		'Comment.before() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.before() without any argument.': 'HTML-specific serialization not implemented',
		'Element.before() with null as an argument.': 'HTML-specific serialization not implemented',
		'Element.before() with undefined as an argument.':
			'HTML-specific serialization not implemented',
		'Element.before() with only text as an argument.':
			'HTML-specific serialization not implemented',
		'Element.before() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Element.before() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.before() with context object itself as the argument.':
			'HTML-specific serialization not implemented',
		'Element.before() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Element.before() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Element.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented',
		'Element.before() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Element.before() when pre-insert behaves like prepend.':
			'HTML-specific serialization not implemented',
		'Element.before() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.before() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Text.before() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.before() with context object itself and node as the arguments, switching positions.':
			'HTML-specific serialization not implemented',
		'Text.before() with all siblings of child as arguments.':
			'HTML-specific serialization not implemented',
		'Text.before() with some siblings of child as arguments; no changes in tree; viable sibling is first child.':
			'HTML-specific serialization not implemented',
		'Text.before() with some siblings of child as arguments; no changes in tree.':
			'HTML-specific serialization not implemented',
		'Text.before() when pre-insert behaves like prepend.':
			'HTML-specific serialization not implemented',
		'Text.before() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
	},
	'dom/nodes/ChildNode-replaceWith.html': {
		'Comment.replaceWith() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Comment.replaceWith() with sibling of child as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.replaceWith() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.replaceWith() with one sibling of child and child itself as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.replaceWith() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Comment.replaceWith() on a parentless child with two elements as arguments.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() with sibling of child as arguments.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() with one sibling of child and child itself as arguments.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Element.replaceWith() on a parentless child with two elements as arguments.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() with only one element as an argument.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() with sibling of child as arguments.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() with one sibling of child and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() with one sibling of child and child itself as arguments.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() with one element and text as arguments.':
			'HTML-specific serialization not implemented',
		'Text.replaceWith() on a parentless child with two elements as arguments.':
			'HTML-specific serialization not implemented',
	},
	'dom/nodes/Comment-constructor.html':
		'ownerDocument does not match document used in test runner',
	'dom/nodes/Document-adoptNode.html': {
		"Adopting an Element called 'x<' should work.":
			'HTML-specific serialization not implemented (test harness fails because innerHTML throws for XML documents)',
	},
	'dom/nodes/Document-characterSet-normalization.html': 'Document#characterSet not implemented',
	'dom/nodes/Document-characterSet-normalization-1.html': 'Document#characterSet not implemented',
	'dom/nodes/Document-characterSet-normalization-2.html': 'Document#characterSet not implemented',
	'dom/nodes/Document-constructor.html': {
		'new Document(): URL parsing': 'HTMLAnchorElement not implemented',
	},
	'dom/nodes/Document-createAttribute.html': {
		'HTML document.createAttribute("TITLE")': 'HTML attribute lowercasing not implemented',
		'HTML document.createAttribute("X")': 'HTML attribute lowercasing not implemented',
	},
	'dom/nodes/Document-createCDATASection.html': 'HTML documents not implemented',
	'dom/nodes/Document-createElement.html': 'Document load using iframe not implemented',
	'dom/nodes/Document-createElement-namespace.html': 'DOMParser / contentType not implemented',
	'dom/nodes/Document-createElement-namespace-tests':
		'Document load using iframe not implemented',
	'dom/nodes/Document-createElementNS.html': 'Document load using iframe not implemented',
	'dom/nodes/Document-createEvent.html': 'Document#createEvent not implemented',
	'dom/nodes/Document-createEvent.https.html': 'Document#createEvent not implemented',
	'dom/nodes/Document-createTreeWalker.html': 'Document#createTreeWalker not implemented',
	'dom/nodes/Document-getElementById.html': 'Document#getElementById not implemented',
	'dom/nodes/Document-getElementsByClassName.html':
		'Document#getElementsByClassName not implemented',
	'dom/nodes/Document-getElementsByTagName.html': {
		Interfaces: 'This implementation uses arrays instead of collection types',
		"Shouldn't be able to set unsigned properties on a HTMLCollection (non-strict mode)":
			'This implementation uses arrays instead of collection types',
		"Shouldn't be able to set unsigned properties on a HTMLCollection (strict mode)":
			'This implementation uses arrays instead of collection types',
		'Should be able to set expando shadowing a proto prop (item)':
			'This implementation uses arrays instead of collection types',
		'Should be able to set expando shadowing a proto prop (namedItem)':
			'This implementation uses arrays instead of collection types',
		'hasOwnProperty, getOwnPropertyDescriptor, getOwnPropertyNames':
			'This implementation uses arrays instead of collection types',
		'HTML element with uppercase tagName never matches in HTML Documents':
			'HTML casing not implemented',
		'Element in HTML namespace, no prefix, non-ascii characters in name':
			'HTML casing not implemented',
		'Element in HTML namespace, prefix, non-ascii characters in name':
			'HTML casing not implemented',
		'getElementsByTagName() should be a live collection':
			'Result is not live in this implementation',
	},
	'dom/nodes/Document-getElementsByTagName-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Document-getElementsByTagNameNS.html': {
		'Document.getElementsByTagNameNS':
			'This implementation uses arrays instead of collection types',
		'getElementsByTagNameNS() should be a live collection':
			'Result is not live in this implementation',
	},
	'dom/nodes/Document-URL.html': 'Document#URL not implemented',
	'dom/nodes/Document-URL.sub.html': 'Document#URL not implemented',
	'dom/nodes/DocumentFragment-constructor.html':
		'ownerDocument does not match document used in test runner',
	'dom/nodes/DocumentFragment-getElementById.html':
		'getElementById and innerHTML setter not implemented',
	'dom/nodes/DocumentFragment-querySelectorAll-after-modification.html':
		'DocumentFragment#querySelectorAll not implemented',
	'dom/nodes/DocumentType-literal.html': 'Depends on HTML parsing',
	'dom/nodes/DOMImplementation-createDocument.html': {
		'createDocument test: metadata for "http://www.w3.org/1999/xhtml","",null':
			'HTML contentType not implemented',
		'createDocument test: metadata for "http://www.w3.org/2000/svg","",null':
			'SVG contentType not implemented',
	},
	'dom/nodes/DOMImplementation-createDocument-with-null-browsing-context-crash.html':
		'Automatic globals by element id not implemented',
	'dom/nodes/DOMImplementation-createHTMLDocument.html':
		'HTML*Element interfaces not implemented',
	'dom/nodes/DOMImplementation-createHTMLDocument-with-null-browsing-context-crash.html':
		'Automatic globals by element id not implemented',
	'dom/nodes/DOMImplementation-createHTMLDocument-with-saved-implementation.html':
		'iframe not implemented',
	'dom/nodes/DOMImplementation-hasFeature.html': 'DOMImplementation#hasFeature not implemented',
	'dom/nodes/Element-childElement-null-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-childElementCount-dynamic-add-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-childElementCount-dynamic-remove-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-childElementCount-nochild-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-childElementCount-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-children.html': 'Element#children not implemented as HTMLCollection',
	'dom/nodes/Element-classlist.html': 'Element#classList not implemented',
	'dom/nodes/Element-closest.html': 'Element#closest not implemented',
	'dom/nodes/Element-firstElementChild-entity-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-firstElementChild-namespace-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-firstElementChild-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-getElementsByClassName.html':
		'Element#getElementsByClassName not implemented',
	'dom/nodes/Element-getElementsByTagName.html': {
		Interfaces: 'This implementation uses arrays instead of collection types',
		"Shouldn't be able to set unsigned properties on a HTMLCollection (non-strict mode)":
			'This implementation uses arrays instead of collection types',
		"Shouldn't be able to set unsigned properties on a HTMLCollection (strict mode)":
			'This implementation uses arrays instead of collection types',
		'Should be able to set expando shadowing a proto prop (item)':
			'This implementation uses arrays instead of collection types',
		'Should be able to set expando shadowing a proto prop (namedItem)':
			'This implementation uses arrays instead of collection types',
		'hasOwnProperty, getOwnPropertyDescriptor, getOwnPropertyNames':
			'This implementation uses arrays instead of collection types',
		'HTML element with uppercase tagName never matches in HTML Documents':
			'HTML casing not implemented',
		'Element in HTML namespace, no prefix, non-ascii characters in name':
			'HTML casing not implemented',
		'Element in HTML namespace, prefix, non-ascii characters in name':
			'HTML casing not implemented',
		'getElementsByTagName() should be a live collection':
			'Result is not live in this implementation',
	},
	'dom/nodes/Element-getElementsByTagName-change-document-HTMLNess.html':
		'HTML casing not implemented',
	'dom/nodes/Element-getElementsByTagNameNS.html': {
		'Element.getElementsByTagNameNS':
			'This implementation uses arrays instead of collection types',
		'getElementsByTagNameNS() should be a live collection':
			'Result is not live in this implementation',
		'Empty string namespace': 'Test expects createElement to use HTML namespace',
		"getElementsByTagNameNS('http://www.w3.org/1999/xhtml', '*')":
			'Test expects createElement to use HTML namespace',
	},
	'dom/nodes/Element-hasAttribute.html': {
		'hasAttribute should work with all attribute casings':
			'HTML case insensitivity not implemented',
	},
	'dom/nodes/Element-insertAdjacentElement.html': 'Element#insertAdjacentElement not implemented',
	'dom/nodes/Element-insertAdjacentText.html': 'Element#insertAdjacentText not implemented',
	'dom/nodes/Element-lastElementChild-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-matches.html': 'Element#matches not implemented',
	'dom/nodes/Element-matches-namespaced-elements.html': 'Element#matches not implemented',
	'dom/nodes/Element-nextElementSibling-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-previousElementSibling-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-setAttribute.html': {
		'setAttribute should lowercase before setting': 'HTML casing not implemented',
	},
	'dom/nodes/Element-setAttribute-crbug-1138487.html': 'HTML casing not implemented',
	'dom/nodes/Element-siblingElement-null-xhtml.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Element-tagName.html': 'HTML tagName uppercasing not implemented',
	'dom/nodes/Element-webkitMatchesSelector.html': 'Element#webkitMatchesSelector not implemented',
	'dom/nodes/getElementsByClassName-32.html': 'getElementsByClassName not implemented',
	'dom/nodes/getElementsByClassName-empty-set.html': 'getElementsByClassName not implemented',
	'dom/nodes/getElementsByClassName-whitespace-class-names.html':
		'getElementsByClassName not implemented',
	'dom/nodes/insert-adjacent.html':
		'Element#insertAdjacentElement / Element#insertAdjacentText not implemented',
	'dom/nodes/MutationObserver-attributes.html':
		'TODO: fails with timeout because of unsupported tests',
	'dom/nodes/MutationObserver-callback-arguments.html': 'className setter not implemented',
	'dom/nodes/MutationObserver-childList.html':
		'TODO: fails with timeout because of unsupported tests',
	'dom/nodes/MutationObserver-disconnect.html': 'Element#id not implemented',
	'dom/nodes/MutationObserver-document.html': 'Running script during parsing not implemented',
	'dom/nodes/MutationObserver-inner-outer.html':
		'Element#innerHTML / Element#outerHTML setters not implemented',
	'dom/nodes/MutationObserver-sanity.html': {
		'Should throw if attributeFilter is present and attributes is false':
			'attributeFilter not implemented',
	},
	'dom/nodes/MutationObserver-takeRecords.html': {
		'All records present': 'className and id setters not implemented',
	},
	'dom/nodes/MutationObserver-subtree.html': 'Element#id not implemented',
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
		'node with children': 'HTMLElement interfaces not implemented',
		'Node with custom prototype': 'HTMLElement interfaces not implemented',
	},
	'dom/nodes/Node-cloneNode-document-with-doctype.html': 'DOMParser not implemented',
	'dom/nodes/Node-cloneNode-external-stylesheet-no-bc.sub.html':
		'innerHTML setter not implemented',
	'dom/nodes/Node-cloneNode-on-inactive-document-crash.html':
		'Automatic globals by element id not implemented',
	'dom/nodes/Node-cloneNode-svg.html': 'querySelector not implemented',
	'dom/nodes/Node-compareDocumentPosition.html': 'Node#compareDocumentPosition not implemented',
	'dom/nodes/Node-constants.html': {
		'Constants for createDocumentPosition on Node interface object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Node prototype object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Element object.':
			'Node#compareDocumentPosition not implemented',
		'Constants for createDocumentPosition on Text object.':
			'Node#compareDocumentPosition not implemented',
	},
	'dom/nodes/Node-isConnected.html': 'Node#isConnected not implemented',
	'dom/nodes/Node-isConnected-shadow-dom.html': 'Node#isConnected not implemented',
	'dom/nodes/Node-isEqualNode.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isEqualNode-iframe1.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isEqualNode-iframe2.html': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isEqualNode-xhtml.xhtml': 'Node#isEqualNode not implemented',
	'dom/nodes/Node-isSameNode.html': 'Node#isSameNode not implemented',
	'dom/nodes/NodeList-Iterable.html': 'NodeList not implemented',
	'dom/nodes/Node-lookupPrefix.xhtml': 'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/Node-nodeName.html': {
		'For Element nodes, nodeName should return the same as tagName.':
			'HTML tagName uppercasing not implemented',
	},
	'dom/nodes/Node-normalize.html': 'DOMParser not implemented',
	'dom/nodes/Node-parentNode.html': 'Document load using iframe not implemented',
	'dom/nodes/Node-properties.html': 'id and className properties not implemented',
	'dom/nodes/Node-replaceChild.html': {
		'replaceChild should work in the presence of mutation events.':
			'Mutation events not implemented',
	},
	'dom/nodes/ParentNode-children.html': {
		'ParentNode.children should be a live collection':
			'Result is not live in this implementation',
	},
	'dom/nodes/ParentNode-querySelector-All-content.html':
		'ParentNode#querySelectorAll not implemented',
	'dom/nodes/ParentNode-querySelector-All.html': 'ParentNode#querySelectorAll not implemented',
	'dom/nodes/ParentNode-querySelector-case-insensitive.html':
		'ParentNode#querySelector not implemented',
	'dom/nodes/ParentNode-querySelector-escapes.html': 'ParentNode#querySelector not implemented',
	'dom/nodes/ParentNode-querySelector-scope.html': 'ParentNode#querySelector not implemented',
	'dom/nodes/ParentNode-querySelectorAll-removed-elements.html':
		'ParentNode#querySelectorAll not implemented',
	'dom/nodes/ParentNode-querySelectors-exclusive.html':
		'ParentNode#querySelector* not implemented',
	'dom/nodes/ParentNode-querySelectors-namespaces.html':
		'ParentNode#querySelector* not implemented',
	'dom/nodes/ParentNode-querySelectors-space-and-dash-attribute-value.html':
		'ParentNode#querySelector* not implemented',
	'dom/nodes/ProcessingInstruction-escapes-1.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/ProcessingInstruction-literal-1.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/ProcessingInstruction-literal-2.xhtml':
		'TODO: use XML parser instead of parse5 for xhtml files',
	'dom/nodes/query-target-in-load-event.html': 'ParentNode#querySelector not implemented',
	'dom/nodes/remove-and-adopt-thcrash.html': 'Automatic globals by element id not implemented',
	'dom/nodes/remove-from-shadow-host-and-adopt-into-iframe.html': 'Shadow DOM not implemented',
	'dom/nodes/remove-unscopable.html': 'Methods not implemented',
	'dom/nodes/rootNode.html': 'Node#getRootNode not implemented',
	'dom/nodes/svg-template-querySelector.html': 'innerHTML setter not implemented',
	'dom/nodes/Text-constructor.html': 'ownerDocument does not match document used in test runner',
	'dom/ranges': 'TODO',
	'dom/slot-recalc.html': 'Shadow DOM not implemented',
	'dom/traversal': 'NodeIterator and TreeWalker not implemented',
	'dom/historical.html': 'WebIDL parsing not implemented',
	'dom/interface-objects.html': 'window not implemented',
	'dom/interfaces.html': 'WebIDL parsing not implemented',
	'dom/window-extends-event-target.html': 'window not implemented',
	'dom/xslt/invalid-output-encoding-crash.html': 'XSLT not implemented',
	'dom/xslt/transformToFragment-on-node-from-inactive-document-crash.html':
		'XSLT not implemented',
};

export default blocklist;
