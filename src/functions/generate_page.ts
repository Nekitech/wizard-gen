import path from 'node:path';
import * as process from 'node:process';
import * as prompt from '@clack/prompts';
import { log, spinner } from '@clack/prompts';
import fs from 'fs-extra';
import { call_python } from '../helpers/call_python';
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

/**
 * Записывает новую коллекцию в файл config.ts.
 * @param collectionName - Имя коллекции (например, "cast").
 * @param collectionCode - Код коллекции (например, "const castCollection = defineCollection({ ... })").
 */
function write_to_config(collectionName: string, collectionCode: string): void {
	const configPath = path.resolve(process.cwd(), 'src/content/config.ts');

	try {
		let configContent = fs.existsSync(configPath)
			? fs.readFileSync(configPath, 'utf-8')
			: `import { defineCollection, z } from 'astro:content';\n\n`;

		configContent += `\n${collectionCode}\n`;

		const exportRegex = /export\s+const\s+collections\s*=\s*\{([\s\S]*?)\};/;
		const exportMatch = configContent.match(exportRegex);

		if (exportMatch) {
			const existingExports = exportMatch[1].trim();
			const newExport = `  ${collectionName}: ${collectionName}Collection,`;
			const updatedExports = `export const collections = {\n${existingExports}\n${newExport}\n};`;

			configContent = configContent.replace(exportRegex, updatedExports);
		} else {
			const newExport = `export const collections = {\n  ${collectionName}: ${collectionName}Collection,\n};`;
			configContent += `\n${newExport}\n`;
		}

		fs.writeFileSync(configPath, configContent, 'utf-8');

		console.log(`Коллекция "${collectionName}" успешно добавлена в config.ts.`);
	} catch (error) {
		console.error(`Ошибка при записи в config.ts: ${error.message}`);
	}
}

export async function generate_collection() {
	try {
		const result = await prompt.group({
			typePage: () =>
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
		const s = spinner();
		s.start('Обработка запроса Gemini');
		const result_call = await call_python('collection_gen.py', 'generate_collection', JSON.stringify(result)) as string;
		const code_collection = JSON.parse(result_call)?.collection ?? '';
		write_to_config(result.typePage, code_collection);
		s.stop('Gemini завершил обработку, коллекция записана в config.ts');
	} catch (e) {
		log.error(e?.message);
		process.exit(0);
	}
}
