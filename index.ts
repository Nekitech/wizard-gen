import * as prompt from '@clack/prompts';
import color from 'picocolors';
import { fillGoogleSheetTable } from './src/core/fill_google_sheet_table';
import { generate_project } from './src/core/generate_project';
import { mainForm } from './src/forms/mainForm';
import { generate_collection } from './src/functions/generate_collection';
import { update_page } from './src/functions/update_page';

async function main() {
	prompt.intro(
		`✨ ${color.bgCyanBright(
			color.black('Welcome. Below are the options that you can use to create or customization of the site'),
		)} ✨`,
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
				case 'generate_collection':
					await generate_collection();
					break;
				case 'update_page':
					await update_page();
					break;
				case 'fill_google_sheet_table':
					await fillGoogleSheetTable();
					break;
				default:
					break;
			}
		},
	});

	prompt.outro(`The work of the wizard is completed`);
}

main().catch(e => console.log(e));
