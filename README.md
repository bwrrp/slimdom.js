# slimdom

[![NPM version](https://badge.fury.io/js/slimdom.svg)](https://badge.fury.io/js/slimdom)
[![Build Status](https://travis-ci.org/bwrrp/slimdom.js.svg?branch=master)](https://travis-ci.org/bwrrp/slimdom.js)
[![Greenkeeper badge](https://badges.greenkeeper.io/bwrrp/slimdom.js.svg)](https://greenkeeper.io/)

Fast, tiny, standards-compliant XML DOM implementation for node and the browser.

This is a (partial) implementation of the [DOM living standard][domstandard], as last updated 8 August 2018, and the [DOM Parsing and Serialization W3C Editor's Draft][domparsing]. See the 'Features' and 'Limitations' sections below for details on what's included and what's not.

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

The package includes both a commonJS bundle (`dist/slimdom.js`) and an ES6 module (`dist/slimdom.mjs`).

## Usage

Create documents using the slimdom.Document constructor, and manipulate them using the [standard DOM API][domstandard].

```javascript
import * as slimdom from 'slimdom';

const document = new slimdom.Document();
document.appendChild(document.createElementNS('http://www.example.com', 'root'));
const xml = slimdom.serializeToWellFormedString(document);
// -> '<root xmlns="http://www.example.com"/>'
```

Some DOM API's, such as the `DocumentFragment` constructor, require the presence of a global document. In these cases, slimdom will use the instance exposed through `slimdom.document`. Although you could mutate this document, it is recommended to create your own to avoid conflicts with other code using slimdom in your application.

When using a `Range`, make sure to call `detach` when you don't need it anymore. As JavaScript currently does not have a way to detect when the instance can be garbage collected, we don't have any other way of detecting when we can stop updating the range for mutations to the surrounding nodes.

## Features

This library implements:

-   All node types: `Attr`, `CDATASection`, `Comment`, `Document`, `DocumentFragment`, `DocumentType`, `Element`, `ProcessingInstruction`, `Text` and `XMLDocument`.
-   `Range`, which correctly updates under mutations.
-   `MutationObserver`
-   `XMLSerializer`, and read-only versions of `innerHTML` / `outerHTML` on `Element`.

## Limitations

For simplicity and efficiency, this implementation deviates from the spec in a few minor ways. Most notably, normal JavaScript arrays are used instead of `HTMLCollection` / `NodeList` and `NamedNodeMap`.

The following features have not yet been implemented:

-   No XML parsing (no `DOMParser`, `innerHTML` and `outerHTML` are read-only). If you need to parse XML, consider using [slimdom-sax-parser][slimdom-sax-parser].
-   No CSS selectors, so no `querySelector` / `querySelectorAll` on `ParentNode`, no `closest` / `matches` / `webkitMatchesSelector` on `Element`. The older non-CSS query methods (`getElementById` for interface `NonElementParentNode`, and `getElementsByTagName` / `getElementsByTagNameNS` / `getElementsByClassName` on `Document`) have not yet been implemented either. To query the DOM, consider using [FontoXPath][fontoxpath].
-   No HTML parsing / serialization, but see [this example][parse5-example] which shows how to connect the [parse5][parse5] HTML parser.
-   No special treatment of HTML documents, including `HTMLElement` and its subclasses. This also includes HTML casing behavior for attributes and tagNames, as well as the `id` / `className` / `classList` properties on `Element` and `compatMode` / `contentType` on `Document`.
-   No events, no `createEvent` on `Document`.
-   No support for shadow DOM, `Slotable` / `ShadowRoot`, no `slot` / `attachShadow` / `shadowRoot` on `Element`.
-   No support for custom elements or the `is` option on `createElement` / `createElementNS`.
-   No iteration helpers (`NodeIterator` / `TreeWalker` / `NodeFilter`, and the `createNodeIterator` / `createTreeWalker` methods on `Document`).
-   No DOM modifying methods on Range (`deleteContents` / `extractContents` / `cloneContents` / `insertNode` / `surroundContents`).
-   No support for newer DOM mutation methods (`prepend` / `append` for interface `ParentNode`, `before` / `after` / `replaceWith` / `remove` for interface `ChildNode`).
-   No `attributeFilter` for mutation observers.
-   No `wholeText` on `Text`.
-   No `isConnected` / `getRootNode` / `textContent` / `isEqualNode` / `isSameNode` / `compareDocumentPosition` on `Node`
-   No notion of URLs (`baseURI` on `Node`, and `URL` / `documentURI` / `origin` on `Document`).
-   No notion of encodings (`characterSet` / `charset` / `inputEncoding` on `Document`). This library only deals with JavaScript strings, not raw byte streams.
-   No properties / methods that exist mainly for web compatibility reasons (`insertAdjacentElement` / `insertAdjacentText` on `Element`, `hasFeature` on `DOMImplementation`, and `specified` on `Attr`).

[slimdom-sax-parser]: https://github.com/wvbe/slimdom-sax-parser
[fontoxpath]: https://github.com/FontoXML/fontoxpath/
[parse5-example]: https://github.com/bwrrp/slimdom.js/tree/master/test/example/parse5
[parse5]: https://github.com/inikulin/parse5

Do not rely on the behavior or presence of any methods and properties not specified in the DOM standard. For example, do not use JavaScript array methods exposed on properties that should expose a NodeList and do not use Element as a constructor. This behavior is _not_ considered public API and may change without warning in a future release.

## Contributing

Pull requests for missing features or tests, bug reports, questions and other feedback are always welcome! Just [open an issue](https://github.com/bwrrp/slimdom.js/issues/new) on the github repo, and provide as much detail as you can.

To work on the slimdom library itself, clone [the repository](https://github.com/bwrrp/slimdom.js) and run `npm install` to install its dependencies.

The slimdom library and tests are developed in [TypeScript](https://www.typescriptlang.org/), using [prettier](https://github.com/prettier/prettier) to automate formatting.

This repository includes a full suite of tests based on [jest](https://facebook.github.io/jest/). Run `npm test` to run the tests, or `npm run test:debug` to debug the tests and code by disabling coverage and enabling the node inspector (see [chrome://inspect](chrome://inspect) in Chrome).

An experimental runner for the W3C [web platform tests](http://web-platform-tests.org/) is <s>included in the `test/web-platform-tests` directory</s> temporarily unavailable due to the migration to jest. To use it (when re-enabled), clone the [web platform tests repository](https://github.com/w3c/web-platform-tests) somewhere and set the `WEB_PLATFORM_TESTS_PATH` environment variable to the corresponding path. Then run `npm test` as normal. The `webPlatform.tests.ts` file contains a blacklist of tests that don't currently run due to missing features.
