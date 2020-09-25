import benchmarkRunner from '@fontoxml/fonto-benchmark-runner';
import * as slimdom from 'slimdom';
import { Node } from 'slimdom';

let document, root: Node;

const MAX_ELEMENTS = 25000;
const INCREMENTS = 2500;

for (let i = 2500; i <= MAX_ELEMENTS; i += INCREMENTS) {
	benchmarkRunner.addBenchmark(
		`${i} Elements`,
		() => {
			let element: Node | null = root.firstChild!;

			if(element.nextSibling){
				root.insertBefore(element.nextSibling, element);
			}

		},
		() => {
			document = new slimdom.Document();
			root = document.appendChild(document.createElement('root'));

			for (let j = 0; j < i; j++) {
				root.appendChild(document.createElement('div'));
			}
		},
	);
}