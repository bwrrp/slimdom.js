# slimdom

[![NPM version](https://badge.fury.io/js/slimdom.svg)](https://badge.fury.io/js/slimdom)
[![Build Status](https://travis-ci.org/bwrrp/slimdom.js.svg?branch=master)](https://travis-ci.org/bwrrp/slimdom.js)
[![devDependency Status](https://david-dm.org/bwrrp/slimdom.js/dev-status.svg)](https://david-dm.org/bwrrp/slimdom.js?type=dev)

Fast, tiny DOM implementation for node and the browser.

This is a (partial) implementation of the [DOM living standard][DOMSTANDARD], as last updated 8 August 2017, and the [DOM Parsing and Serialization W3C Editor's Draft][DOMPARSING]. See the 'Features' and 'Limitations' sections below for details on what's included and what's not.

[DOMSTANDARD]: https://dom.spec.whatwg.org/
[DOMPARSING]: https://w3c.github.io/DOM-Parsing/

## Installation

The slimdom library can be installed using npm or yarn:
```
npm install --save slimdom
```
or
```
yarn add slimdom
```

The package includes both a commonJS bundle (`dist/slimdom.js`) and an ES6 module (`dist/slimdom.mjs`).

## Usage

Create documents using the slimdom.Document constructor, and manipulate them using the [standard DOM API][1].

```
import * as slimdom from 'slimdom';

const document = new slimdom.Document();
document.appendChild(document.createElement('root'));
// ...
```

Some DOM API's, such as the `DocumentFragment` constructor, require the presence of a global document. In these cases, slimdom will use the instance exposed through `slimdom.document`. Although you could mutate this document, it is recommended to create your own to avoid conflicts with other code using slimdom in your application.

When using a `Range`, make sure to call `detach` when you don't need it anymore. As JavaScript currently does not have a way to detect when the instance can be garbage collected, we don't have any other way of detecting when we can stop updating the range for mutations to the surrounding nodes.

## Features

This library implements:

* All node types: `Attr`, `CDATASection`, `Comment`, `Document`, `DocumentFragment`, `DocumentType`, `Element`, `ProcessingInstruction`, `Text` and `XMLDocument`.
* `Range`, which correctly updates under mutations
* `MutationObserver`
* `XMLSerializer`, and read-only versions of `innerHTML` / `outerHTML` on `Element`

## Limitations

The following features are not (yet) implemented:

* No events, no `createEvent` on `Document`
* Arrays are used instead of `HTMLCollection` / `NodeList` and `NamedNodeMap`.
* No `getElementById` / `getElementsByTagName` / `getElementsByTagNameNS` / `getElementsByClassName`
* No `prepend` / `append`
* No selectors, no `querySelector` / `querySelectorAll` on `ParentNode`, no `closest` / `matches` / `webkitMatchesSelector` on `Element`
* No `before` / `after` / `replaceWith` / `remove`
* No `attributeFilter` for mutation observers
* No `baseURI` / `isConnected` / `getRootNode` / `textContent` / `isEqualNode` / `isSameNode` / `compareDocumentPosition` on `Node`
* No `URL` / `documentURI` / `origin` / `compatMode` / `characterSet` / `charset` / `inputEncoding` / `contentType` on `Document`
* No `hasFeature` on `DOMImplementation`
* No `id` / `className` / `classList` / `insertAdjacentElement` / `insertAdjacentText` on `Element`
* No `specified` on `Attr`
* No `wholeText` on `Text`
* No `deleteContents` / `extractContents` / `cloneContents` / `insertNode` / `surroundContents` on `Range`
* No `NodeIterator` / `TreeWalker` / `NodeFilter`, no `createNodeIterator` / `createTreeWalker` on `Document`
* No HTML documents, including `HTMLElement` and its subclasses. This also includes HTML casing behavior for attributes and tagNames.
* No shadow DOM, `Slotable` / `ShadowRoot`, no `slot` / `attachShadow` / `shadowRoot` on `Element`
* No custom elements
* No XML parsing
* No HTML parsing / serialization, but see `test/SlimdomTreeAdapter.ts` for an example on how to connect the parse5 HTML parser.

Do not rely on the behavior or presence of any methods and properties not specified in the DOM standard. For example, do not use JavaScript array methods exposed on properties that should expose a NodeList and do not use Element as a constructor. This behavior is *not* considered public API and may change without warning in a future release.

## Contributing

Pull requests for missing features or tests, bug reports, questions and other feedback are always welcome! Just [open an issue](https://github.com/bwrrp/slimdom.js/issues/new) on the github repo, and provide as much detail as you can.

To work on the slimdom library itself, clone [the repository](https://github.com/bwrrp/slimdom.js) and run `npm install` to install its dependencies.

The slimdom library and tests are developed in [TypeScript](https://www.typescriptlang.org/), using [prettier](https://github.com/prettier/prettier) to automate formatting. Settings for the vscode [vscode-prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) are included. If you use prettier from another editor, please use options equivalent to the command line `--print-width 120 --use-tabs --single-quote`.

This repository includes a full suite of tests based on [mocha](http://mochajs.org/) and [chai](http://chaijs.com/), with coverage computed using [istanbul and nyc](https://istanbul.js.org/). Run `npm test` to run the tests, or `npm run test:debug` to debug the tests and code by disabling coverage and enabling the node inspector (see [chrome://inspect](chrome://inspect) in Chrome).

An experimental runner for the W3C [web platform tests](http://web-platform-tests.org/) is included in the `test/web-platform-tests` directory. To use it, clone the [web platform tests repository](https://github.com/w3c/web-platform-tests) somewhere and set the `WEB_PLATFORM_TESTS_PATH` environment variable to the corresponding path. Then run `npm test` as normal. The `webPlatform.tests.ts` file contains a blacklist of tests that don't currently run due to missing features.
