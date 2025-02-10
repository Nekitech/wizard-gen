import path from 'node:path';
import { input, select } from '@inquirer/prompts';
import { startTemplateByName } from '@wizard-gen/templates';

export async function generate_project() {
	return await select({
		message: 'Choise a template',
		choices: [
			{
				name: 'Website series / anime',
				value: 'series-template',
			},
		],
	}).then(async (res) => {
		const dest_path = await input({
			message: 'Input destination path: ',
			default: '.',
		});
		const dest = path.resolve(process.cwd(), dest_path);
		await startTemplateByName(dest, res);
	});
}
