import { existsSync } from 'fs';
import { execFileSync } from 'child_process';

function git(cwd: string | undefined, ...args: string[]): void {
	execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function downloadWpt(repositoryUrl: string, destinationPath: string) {
	console.log(`Downloading WPT from ${repositoryUrl} to ${destinationPath}...`);
	if (!existsSync(destinationPath)) {
		git(
			undefined,
			'clone',
			'--filter=blob:none',
			'--no-checkout',
			repositoryUrl,
			destinationPath
		);
		git(destinationPath, 'sparse-checkout', 'init', '--cone');
		git(destinationPath, 'sparse-checkout', 'set', 'dom');
		git(destinationPath, 'sparse-checkout', 'add', 'resources');
	}
	git(destinationPath, '-c', 'advice.detachedHead=false', 'checkout', 'master');
	git(destinationPath, 'pull', 'origin', 'master');
}

const [repositoryUrl, destinationPath] = process.argv.slice(2);
downloadWpt(repositoryUrl, destinationPath);
