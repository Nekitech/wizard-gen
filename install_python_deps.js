import { execSync } from 'node:child_process';

const isWindows = process.platform === 'win32';

const command = isWindows
	? 'python -m venv content_generator/venv && content_generator\\venv\\Scripts\\activate && pip install -r content_generator/requirements.txt'
	: 'python -m venv content_generator/venv && . content_generator/venv/bin/activate && pip install -r content_generator/requirements.txt';

try {
	execSync(command, { stdio: 'inherit' });
} catch (error) {
	console.error('Ошибка при установке Python-зависимостей:', error.message);
	process.exit(1);
}
