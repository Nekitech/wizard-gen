import path from 'node:path';
import { cancel, isCancel, select, text } from '@clack/prompts';
import { startTemplateByName } from '../templates';

export async function generate_project() {
	return await select({
		message: 'Choise a template',
		options: [
			{
				label: 'Website series / anime',
				value: 'series-template',
			},
		],
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
