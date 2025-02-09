import path from 'node:path';
import { input, select, Separator } from '@inquirer/prompts';
import { startTemplateByName } from '@wizard-gen/templates';

await select({
	message: 'Choose the function of wyzard',
	choices: [
		{
			name: 'Generation of the site on the template',
			value: 'generate_project',
			description: 'Generation of the site on the template',
		},
		{
			name: 'Generating website pages',

			value: 'generate_pages',
			description: 'Generating website pages',
		},
		{
			name: 'Generating comments',
			value: 'generate_comments',
			description: 'Generating comments',
		},
		{
			name: 'News generation',
			value: 'generate_news',
			description: 'News generation',
		},
		{
			name: 'Setting up site styles',
			value: 'config_styles',
			description: 'Setting up site styles',
		},
		new Separator(),
	],
}).then(async (res) => {
	switch (res) {
		case 'generate_project':
			await select({
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
			break;
		default:
			break;
	}
	return res;
});
