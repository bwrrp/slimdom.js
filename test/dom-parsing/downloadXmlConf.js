// @ts-check

const XMLCONF_URL = 'https://www.w3.org/XML/Test/xmlts20130923.zip';

const { execFileSync } = require('node:child_process');
const { createWriteStream } = require('node:fs');
const { get } = require('node:https');
const { join } = require('node:path');

function download(cb) {
	const file = createWriteStream('./temp/xmlconf.zip');
	get(XMLCONF_URL, (res) => {
		res.pipe(file);
		file.on('finish', () => file.close(cb));
	});
}

function unzip() {
	execFileSync('unzip', ['xmlconf.zip'], { cwd: './temp', encoding: 'utf8' });
}

download(() => {
	unzip();
});
