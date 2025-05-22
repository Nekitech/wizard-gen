import * as prompt from '@clack/prompts';
import color from 'picocolors';
import { generate_project } from './src/core/generate_project';
import { mainForm } from './src/forms/mainForm';
import { fillGoogleSheetTable } from './src/functions/fill_google_sheet_table';
import { generate_project } from './src/functions/generate_project';
import { sync_md_and_collection } from './src/functions/sync_md_and_collection';
import { update_md_content } from './src/functions/update_md_content';
import { connectGoogleApiTable } from './src/gsheets/connect';

async function main() {
	prompt.intro(
		`✨ ${color.bgCyanBright(
			color.black('Welcome. Below are the options that you can use to create or customization of the site'),
		)} ✨`,
	);

	const gsh = await connectGoogleApiTable();

	await prompt.group({
		mainForm: () => prompt.select({
			message: 'Choose the function of wizard',
			options: mainForm,
		}),
		functions: async ({ results }) => {
			const { mainForm } = results;
			switch (mainForm) {
				case 'generate_project':
					await generate_project(gsh);
					break;
				case 'update_md':
					await update_md_content(gsh);
					break;
				case 'fill_google_sheet_table':
					await fillGoogleSheetTable();
					break;
				case 'sync_md':
					await sync_md_and_collection(gsh);
					break;

				default:
					break;
			}
		},
	});

	prompt.outro(`The work of the wizard is completed`);
}

main().catch(e => console.log(e));
