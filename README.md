# slimdom

[![NPM version](https://badge.fury.io/js/slimdom.svg)](https://badge.fury.io/js/slimdom)
[![CI](https://github.com/bwrrp/slimdom.js/workflows/CI/badge.svg)](https://github.com/bwrrp/slimdom.js/actions?query=workflow%3ACI)

Fast, tiny, standards-compliant XML DOM implementation for node and the browser.

This is a (partial) implementation of the [DOM living standard][domstandard], as last updated 27 January 2021, and the [DOM Parsing and Serialization W3C Editor's Draft][domparsing], as last updated 20 April 2020. See the 'Features and Limitations' section below for details on what's included and what's not.

[domstandard]: https://dom.spec.whatwg.org/
[domparsing]: https://w3c.github.io/DOM-Parsing/

## Installation

The slimdom library can be installed using npm or yarn:

```bat
npm install --save slimdom
```

or

```bat
yarn add slimdom
```

The package includes both a commonJS-compatible UMD bundle (`dist/slimdom.js`) and an ES6 module (`dist/slimdom.mjs`). This means it should work in most JavaScript environments that support the ES2017 standard or newer.

## Usage

Create documents using the slimdom.Document constructor, and manipulate them using the [standard DOM API][domstandard].

```javascript
import * as slimdom from 'slimdom';
// alternatively, in node and other commonJS environments:
// const slimdom = require('slimdom');

const document = new slimdom.Document();
document.appendChild(document.createElementNS('http://www.example.com', 'root'));
const xml = slimdom.serializeToWellFormedString(document);
// -> '<root xmlns="http://www.example.com"/>'
```

Some DOM API's, such as the `DocumentFragment` constructor, require the presence of a global document, for instance to set their initial `ownerDocument` property. In these cases, slimdom will use the instance exposed through `slimdom.document`. Although you could mutate this document, it is recommended to always create your own documents (using the `Document` constructor) to avoid conflicts with other code using slimdom in your application.

When using a `Range`, make sure to call `detach` when you don't need it anymore. Unless you are only targeting environments that implement the WeakRef proposal, we do not have a way to detect when we can stop updating the range for mutations to the surrounding nodes. In environments that support WeakRef, calling detach is optional.

## Features and limitations

This library implements:

-   All node types: `Attr`, `CDATASection`, `Comment`, `Document`, `DocumentFragment`, `DocumentType`, `Element`, `ProcessingInstruction`, `Text` and `XMLDocument`.
-   `Range`, which correctly updates under mutations.
-   `MutationObserver`
-   `XMLSerializer`, and read-only versions of `innerHTML` / `outerHTML` on `Element`.

This library is currently aimed at providing a lightweight and consistent experience for dealing with XML and XML-like data. For simplicity and efficiency, this implementation deviates from the spec in a few minor ways. Most notably, normal JavaScript arrays are used instead of `HTMLCollection` / `NodeList` and `NamedNodeMap`, HTML documents are treated no different from other documents and a number of features from in the DOM spec are missing. In most cases, this is because alternatives are available that can be used together with slimdom with minimal effort.

Do not rely on the behavior or presence of any methods and properties not specified in the DOM standard. For example, do not use JavaScript array methods exposed on properties that should expose a NodeList and do not use Element as a constructor. This behavior is _not_ considered public API and may change without warning in a future release.

### Parsing

This library does not implement the `DOMParser` interface, nor `insertAdjacentHTML` on `Element`, nor `createContextualFragment` on `Range`. The `innerHTML` and `outerHTML` properties are read-only,

If you need to parse XML, use [slimdom-sax-parser][slimdom-sax-parser]. See its README for examples.

If you need to parse HTML, see [this example][parse5-example] which shows how to connect the [parse5][parse5] HTML parser with the help of the [dom-treeadapter][dom-treeadapter] library.

### CSS Selectors and XPath

This library does not implement CSS selectors, which means no `querySelector` / `querySelectorAll` on `ParentNode` and no `closest` / `matches` / `webkitMatchesSelector` on `Element`. This library also does not implement XPath, which means no `XPathResult` / `XPathExpression` / `XPathEvaluator` interfaces and no `createExpression` / `createNSResolver` / `evaluate` on `Document`.

To query a slimdom document using XPath or XQuery, use [FontoXPath][fontoxpath].

To query a slimdom document using CSS, see [this example][sizzle-example] which shows how to use [sizzle][sizzle] to run queries using CSS selectors.

### HTML & browser-specific features and behavior

Emulating a full browser environment is not the goal of this library. Consider using [jsdom][jsdom] instead if you need that.

This implementation offers no special treatment of HTML documents, which means there are no implementations of `HTMLElement` and its subclasses. This also affects HTML-specific casing behavior for attributes and tagNames. The `id` / `className` / `classList` properties on `Element` and `compatMode` / `contentType` on `Document` have not been implemented. HTML-specific query methods (`getElementById` for interface `NonElementParentNode`, `getElementsByClassName` on `Document`) are also missing.

This library also does not currently implement events, including the `Event` / `EventTarget` interfaces. It also currently does not contain an implementation of `AbortController` / `AbortSignal`. As these may have wider applications than browser-specific use cases, please file an issue if you have a use for these in your application and would like support for them to be added.

There is currently no support for shadow DOM, so no `Slottable` / `ShadowRoot` interfaces and no `slot` / `attachShadow` / `shadowRoot` on `Element`. Slimdom also does not support the APIs for custom elements using the `is` option on `createElement` / `createElementNS`.

This library has no notion of URLs (`baseURI` on `Node`, and `URL` / `documentURI` on `Document`), nor of encodings (`characterSet` / `charset` / `inputEncoding` on `Document`). This library only deals with JavaScript strings, not raw byte streams.

This library omits properties and methods that exist mainly for web compatibility reasons (`insertAdjacentElement` / `insertAdjacentText` on `Element`, `hasFeature` on `DOMImplementation`, and `specified` on `Attr`). This also includes all interfaces and interface members listed as removed in the [DOM living standard][domstandard].

### Miscellaneous

The following features are missing simply because I have not yet had a need for them. If you do need one, feel free to create a feature request issue or even submit a pull request.

-   Iteration helpers (`NodeIterator` / `TreeWalker` / `NodeFilter`, and the `createNodeIterator` / `createTreeWalker` methods on `Document`).
-   DOM-modifying methods on Range (`deleteContents` / `extractContents` / `cloneContents` / `insertNode` / `surroundContents`).
-   `attributeFilter` for mutation observers.
-   `isConnected` / `getRootNode` / `isEqualNode` / `isSameNode` / `compareDocumentPosition` on `Node`

[slimdom-sax-parser]: https://github.com/wvbe/slimdom-sax-parser
[fontoxpath]: https://github.com/FontoXML/fontoxpath/
[parse5-example]: https://github.com/bwrrp/slimdom.js/tree/main/test/examples/parse5
[parse5]: https://github.com/inikulin/parse5
[dom-treeadapter]: https://github.com/RReverser/dom-treeadapter
[sizzle-example]: https://github.com/bwrrp/slimdom.js/tree/master/test/examples/sizzle
[sizzle]: https://github.com/jquery/sizzle
[jsdom]: https://github.com/jsdom/jsdom

## Contributing

Pull requests for missing features or tests, bug reports, questions and other feedback are always welcome! Just [open an issue](https://github.com/bwrrp/slimdom.js/issues/new) on the github repo, and provide as much detail as you can.

To work on the slimdom library itself, clone [the repository](https://github.com/bwrrp/slimdom.js) and run `npm install` to install its dependencies.

The slimdom library and tests are developed in [TypeScript](https://www.typescriptlang.org/), using [prettier](https://github.com/prettier/prettier) to automate formatting.

This repository includes a full suite of tests based on [jest](https://facebook.github.io/jest/). Run `npm test` to run the tests, or `npm run test:debug` to debug the tests and code by disabling coverage and enabling the node inspector (see [chrome://inspect](chrome://inspect) in Chrome).

An experimental runner for the W3C [web platform tests](http://web-platform-tests.org/) is <s>included in the `test/web-platform-tests` directory</s> temporarily unavailable due to the migration to jest. To use it (when re-enabled), clone the [web platform tests repository](https://github.com/w3c/web-platform-tests) somewhere and set the `WEB_PLATFORM_TESTS_PATH` environment variable to the corresponding path. Then run `npm test` as normal. The `webPlatform.tests.ts` file contains a blacklist of tests that don't currently run due to missing features.
