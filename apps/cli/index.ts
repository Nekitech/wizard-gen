import { select, Separator } from '@inquirer/prompts';
import { generate_project } from './src/functions/generate_project';
import { gsheets_api } from './src/functions/gsheets_api';

select({
	message: 'Choose the function of wyzard',
	loop: false,
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
		{
			name: 'Connect to Google Sheet table',
			value: 'connect_gsheets',
		},
	],
}).then(async (value) => {
	switch (value) {
		case 'generate_project':
			await generate_project();
			break;
		case 'connect_gsheets':
			await gsheets_api();
			break;
		default:
			break;
	}
	return value;
});
