import { log } from '@clack/prompts';
import * as ncp from 'node-calls-python';

const PYTHON_BIN_PATH = 'content_generator/venv/bin/python';
const PYTHON_PATH_PACKAGES = 'content_generator/venv/lib/python3.12/site-packages';

export async function call_python(path_python_file: string, name_function: string, ...args: any[]) {
	return new Promise((resolve, reject) => {
		const py = ncp.interpreter;
		py.setPythonExecutable(PYTHON_BIN_PATH);
		py.addImportPath(PYTHON_PATH_PACKAGES);

		py.import(path_python_file, false)
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
