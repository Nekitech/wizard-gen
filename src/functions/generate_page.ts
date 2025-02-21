import * as prompt from '@clack/prompts';
import { log } from '@clack/prompts';
import { isEmpty } from '../helpers/validation';

export async function generate_page() {
	await prompt.group({
		kindPage: () => prompt.text({
			message: 'Description page',
		}),
		namePage: () => prompt.text({
			message: 'Type page',
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
		typeFields: (result) => {
			const name_fields = result.results.fieldsPage?.split(',') ?? [];
			const fieldTypes = ['string', 'number', 'boolean', 'date', 'array', 'object'];
			const groups = Object.fromEntries(
				name_fields.map((name: string) => [
					name,
					() =>
						prompt.select({
							message: `Choose a field type "${name}"`,
							options: fieldTypes.map(type => ({ value: type, label: type })),
						}),
				]),
			);
			return prompt.group(groups);
		},
	}, {
		onCancel: () => {
			prompt.cancel('Operation cancelled.');
			process.exit(0);
		},
	});
	// вызов питон файла для отправки результатов анкеты
}
