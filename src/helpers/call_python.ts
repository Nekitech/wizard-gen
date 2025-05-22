import path from 'node:path';
import * as process from 'node:process';
import { fileURLToPath } from 'node:url';
import { log, spinner } from '@clack/prompts';
import * as ncp from 'node-calls-python';
import color from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPythonBinPath(): string {
	const venvDir = path.join(__dirname, '..', 'content_generator', 'venv');
	return process.platform === 'win32'
		? path.join(venvDir, 'Scripts', 'python.exe') // Windows
		: path.join(venvDir, 'bin', 'python'); // Unix (Linux/macOS)
}

function getPythonPackagesPath(version_python: string = '3.12'): string {
	const venvDir = path.join(__dirname, '..', 'content_generator', 'venv');
	return process.platform === 'win32'
		? path.join(venvDir, 'Lib', 'site-packages') // Windows
		: path.join(venvDir, 'lib', `python${version_python}`, 'site-packages'); // Unix (Linux/macOS)
}

export async function call_python_with_spinner(path_python_file: string, name_function: string, ...args: any[]) {
	const s = spinner({ indicator: 'timer' });
	s.start(color.green(`Start call python script: ${path_python_file}`));
	const res = await call_python(path_python_file, name_function, ...args);
	s.stop(color.green(`Stop call python script: ${path_python_file}`));
	return res;
}

export async function call_python(path_python_file: string, name_function: string, ...args: any[]) {
	return new Promise((resolve, reject) => {
		const py = ncp.interpreter;

		const absolute_path_python_file = path.join(__dirname, '..', 'content_generator', path_python_file);

		const pythonBinPath = getPythonBinPath();
		console.log(pythonBinPath);
		py.fixlink('/usr/lib/python3.13/lib-dynload/_struct.cpython-313-x86_64-linux-gnu.so');
		py.setPythonExecutable(pythonBinPath);

		const pythonPackagesPath = getPythonPackagesPath('3.13');
		py.addImportPath(pythonPackagesPath);
		console.log(pythonPackagesPath);

		py.import(absolute_path_python_file, false)
			.then((pymodule) => {
				py.call(pymodule, name_function, ...args)
					.then(res => resolve(res))
					.catch((e) => {
						log.warn(`Failed to call python file: ${e}`);
						reject(e);
					});
			})
			.catch((e) => {
				log.warn(`Failed to import python file: ${e}`);
				reject(e);
			});
	});
}
