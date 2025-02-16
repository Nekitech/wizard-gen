import * as p from '@clack/prompts';
import color from 'picocolors';
import { mainForm } from './forms/mainForm';
import { generate_page } from './functions/generate_page';
import { generate_project } from './functions/generate_project';
import { gsheets_api } from './functions/gsheets_api';

async function main() {
	p.intro(
		`${color.bgBlueBright(
			color.black(' Welcome. Below are the options that you can use to create or customization of the site'),
		)}`,
	);

	await p.select({
		message: 'Choose the function of wizard',
		options: mainForm,
	}).then(async (value) => {
		switch (value) {
			case 'generate_project':
				await generate_project();
				break;
			case 'connect_gsheets':
				await gsheets_api();
				break;
			case 'generate_page':
				await generate_page();
				break;
			default:
				break;
		}
		return value;
	});
}

main().catch(e => console.log(e));
