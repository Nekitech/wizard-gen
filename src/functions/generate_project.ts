import path from 'node:path';
import { cancel, isCancel, select, text } from '@clack/prompts';
import { getDirectories } from '../helpers/file_system';
import { startTemplateByName } from '../template_module';

export async function generate_project() {
	const templates_options = getDirectories('templates').map((name) => {
		return {
			label: name,
			value: name,
		};
	});

	return await select({
		message: 'Choise a template',
		options: templates_options,
	}).then(async (res) => {
		const dest_path = await text({
			message: 'Input destination path: ',
			defaultValue: '.',
		});

		if (isCancel(dest_path)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		const dest = path.resolve(process.cwd(), dest_path);
		await startTemplateByName(dest, res as string);
	});
}
