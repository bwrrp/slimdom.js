import * as slimdom from '../../../src/index';

// Sizzle is built to run in a browser, so you'll need to set up your build tooling to inject a
// stub for the window global. Here, we'll stub it with a slimdom document.

declare var window: any;
window.document = slimdom.document.implementation.createHTMLDocument();
