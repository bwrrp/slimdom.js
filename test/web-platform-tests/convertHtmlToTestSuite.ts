import * as path from 'path';

import blocklist, { BlockReasonByTestName } from './blocklist';

export const PREAMBLE = `
require(${JSON.stringify(require.resolve('ts-node/register'))});
const { runTest } = require(${JSON.stringify(path.join(__dirname, 'runTest.ts'))});
`;

function checkBlocklist(normalizedRelativePath: string): string | BlockReasonByTestName | null {
	const parts = normalizedRelativePath.split('/');
	for (let i = 1; i <= parts.length; ++i) {
		const prefix = parts.slice(0, i).join('/');
		const reason = blocklist[prefix];
		if (reason) {
			return reason;
		}
	}

	return null;
}

export default function convertHtmlToTestSuite(src: string, htmlPath: string, rootPath: string) {
	const relativePath = path.relative(rootPath, htmlPath);
	const normalizedRelativePath = relativePath.replace(/\\/g, '/');

	const testSrc: string[] = [];
	testSrc.push(PREAMBLE);
	testSrc.push(`describe(${JSON.stringify(normalizedRelativePath)}, () => {`);

	const blockReason = checkBlocklist(normalizedRelativePath);
	if (typeof blockReason === 'string') {
		testSrc.push(`it.todo(${JSON.stringify(blockReason)});`);
	} else {
		testSrc.push(
			`const { src, htmlPath, rootPath, blockReasonByTestName } = ${JSON.stringify({
				src,
				htmlPath,
				rootPath,
				blockReasonByTestName: blockReason || {},
			})};`
		);
		testSrc.push('runTest(src, htmlPath, rootPath, blockReasonByTestName);');
	}

	testSrc.push('});');

	return testSrc.join('\n');
}
