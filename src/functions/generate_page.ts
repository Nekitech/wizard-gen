import * as prompt from '@clack/prompts';
import { log } from '@clack/prompts';
import { isEmpty } from '../helpers/validation';

const MAX_DEPTH = 3; // Максимальная глубина вложенности объектов

/**
 * Рекурсивная функция для получения типов полей объекта
 * @param fieldName - Имя поля
 * @param depth - Текущая глубина вложенности
 * @returns Объект с типами полей
 */
async function getFieldTypes(fieldName: string, depth: number): Promise<any> {
	if (depth > MAX_DEPTH) {
		log.warn(`The maximum depth of investment (${MAX_DEPTH}) was achieved for the field "${fieldName}"`);
		return {};
	}

	const fieldTypes = ['string', 'number', 'boolean', 'date', 'array', 'object'];
	const type = await prompt.select({
		message: `Choose a field type: "${fieldName}"`,
		options: fieldTypes.map(type => ({ value: type, label: type })),
	});

	if (type === 'object') {
		const nestedFields = await prompt.text({
			message: `Enter nested fields for the object"${fieldName}" (through a comma, without gaps)`,
			placeholder: 'field1,field2,field3',
			validate: (value) => {
				if (isEmpty(value)) {
					log.error('The value should not be empty');
					return new Error('The value should not be empty');
				}
				return;
			},
		}) as string;

		const nestedFieldNames = nestedFields.split(',');
		const nestedFieldTypes = await getNestedFieldTypes(nestedFieldNames, ++depth);

		return {
			[fieldName]: {
				type: 'object',
				properties: nestedFieldTypes,
			},
		};
	} else {
		return {
			[fieldName]: {
				type,
			},
		};
	}
}

/**
 * Рекурсивная функция для получения типов вложенных полей
 * @param fieldNames - Массив имен полей
 * @param depth - Текущая глубина вложенности
 * @returns Объект с типами полей
 */
async function getNestedFieldTypes(fieldNames: string[], depth: number): Promise<any> {
	const result: any = {};

	for (const fieldName of fieldNames) {
		const fieldType = await getFieldTypes(fieldName, depth);
		Object.assign(result, fieldType);
	}

	return result;
}

export async function generate_page() {
	const result = await prompt.group({
		kindPage: () =>
			prompt.text({
				message: 'Описание страницы',
			}),
		namePage: () =>
			prompt.text({
				message: 'Тип страницы',
			}),
		fieldsPage: () =>
			prompt.text({
				message: 'Перечислите поля, которые должны быть у сущности',
				placeholder: 'через запятую, без пробелов',
				validate: (value) => {
					if (isEmpty(value)) {
						log.error('Значение не должно быть пустым');
						return new Error('Значение не должно быть пустым');
					}
					return;
				},
			}),
		typeFields: async (result) => {
			const name_fields = result.results.fieldsPage?.split(',') ?? [];
			return await getNestedFieldTypes(name_fields, 1);
		},
	}, {
		onCancel: () => {
			prompt.cancel('Операция отменена.');
			process.exit(0);
		},
	});

	console.log('Результат:', JSON.stringify(result, null, 2));
	// Вызов Python-файла для отправки результатов анкеты
}
