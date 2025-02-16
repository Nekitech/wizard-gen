import * as prompt from '@clack/prompts';
import { log } from '@clack/prompts';
import { page_generation } from '../codegen/page';
import { isEmpty } from '../helpers/validation';

export async function generate_page() {
	await page_generation('cast');
	return await prompt.group({
		kindPage: () => prompt.text({
			message: 'What kind of page do you want to create? (description)',
		}),
		namePage: () => prompt.text({
			message: 'Name of page',
		}),
		fieldsPage: () => prompt.text({
			message: 'List the fields that the entity should be',
			placeholder: 'through a comma, without spaces',
			validate: (value) => {
				if (isEmpty(value)) {
					log.error('The value should not be empty');
					return new Error('The value should not be empty');
				}
				return;
			},
		}),
	}, {
		onCancel: () => {
			prompt.cancel('Operation cancelled.');
			process.exit(0);
		},
	});
}
