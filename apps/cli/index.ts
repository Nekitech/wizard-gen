import * as p from '@clack/prompts';
import color from 'picocolors';
import { generate_project } from './src/functions/generate_project';
import { gsheets_api } from './src/functions/gsheets_api';

async function main() {
	p.intro(
		`${color.bgBlueBright(
			color.black(' Welcome. Below are the options that you can use to create or customization of the site'),
		)}`,
	);

	await p.select({
		message: 'Choose the function of wizard',
		initialValue: 'Yes',
		options: [
			{
				value: 'generate_project',
				label: 'Generation of the site on the template',
				hint: 'Generation of the site on the template',
			},
			{
				value: 'generate_pages',
				label: 'Generating website pages',
				hint: 'Generating website pages',
			},
			{
				value: 'generate_comments',
				label: 'Generating comments',
				hint: 'Generating comments',
			},
			{
				value: 'generate_news',
				label: 'News generation',
				hint: 'News generation',
			},
			{
				value: 'config_styles',
				label: 'Setting up site styles',
				hint: 'Setting up site styles',
			},
			{
				value: 'connect_gsheets',
				label: 'Connect to Google Sheet table',
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
}

main().catch(e => console.log(e));
