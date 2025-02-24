import * as prompt from '@clack/prompts';
import color from 'picocolors';
import { mainForm } from './src/forms/mainForm';
import { generate_page } from './src/functions/generate_page';
import { generate_project } from './src/functions/generate_project';
import { update_page } from './src/functions/update_page';

async function main() {
	prompt.intro(
		`${color.bgBlueBright(
			color.black(' Welcome. Below are the options that you can use to create or customization of the site'),
		)}`,
	);

	await prompt.group({
		mainForm: () => prompt.select({
			message: 'Choose the function of wizard',
			options: mainForm,
		}),
		functions: async ({ results }) => {
			const { mainForm } = results;
			switch (mainForm) {
				case 'generate_project':
					await generate_project();
					break;
				case 'generate_page':
					await generate_page();
					break;
				case 'update_page':
					await update_page();
					break;
				default:
					break;
			}
		},
	});
}

main().catch(e => console.log(e));
