import path from 'node:path';
import * as process from 'node:process';
import * as prompt from '@clack/prompts';
import { log, spinner } from '@clack/prompts';
import fs from 'fs-extra';
import { call_python_with_spinner } from '../helpers/call_python';
import { isEmpty } from '../helpers/validation';

/**
 * Записывает новую коллекцию в файл config.ts.
 * @param collectionName - Имя коллекции (например, "cast").
 * @param collectionCode - Код коллекции (например, "const castCollection = defineCollection({ ... })").
 */
function write_to_config(collectionName: string, collectionCode: string): void {
	const configPath = path.resolve(process.cwd(), 'src/content/config.ts');

	try {
		let configContent = '';

		if (fs.existsSync(configPath)) {
			configContent = fs.readFileSync(configPath, 'utf-8');
		} else {
			const defaultContent = `import { defineCollection, z } from 'astro:content';\n\n`;
			fs.mkdirSync(path.dirname(configPath), { recursive: true }); // Создаем директорию, если её нет
			fs.writeFileSync(configPath, defaultContent, 'utf-8'); // Создаем файл
			configContent = defaultContent; // Устанавливаем содержимое
		}

		configContent += `\n${collectionCode}\n`;

		// regexp для поиска export const collections
		const exportRegex = /export\s+const\s+collections\s*=\s*\{([\s\S]*?)\};/;
		const exportMatch = configContent.match(exportRegex);

		if (exportMatch) {
			// если export const collections уже существует, обновляем его
			const existingExports = exportMatch[1].trim();
			const newExport = `  ${collectionName}: ${collectionName}Collection,`;
			const updatedExports = `export const collections = {\n${existingExports}\n${newExport}\n};`;

			// удаляем старый export и добавляем новый в конец файла
			configContent = configContent.replace(exportRegex, '').trim();
			configContent += `\n\n${updatedExports}`;
		} else {
			// если export const collections отсутствует, создаем его. Срабатывает при создании первой коллекции
			const newExport = `export const collections = {\n  ${collectionName}: ${collectionName}Collection,\n};`;
			configContent += `\n\n${newExport}`;
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
			typeFields: async () => {
				// const name_fields = result.results.fieldsPage?.split(',') ?? [];
				// return await getNestedFieldTypes(name_fields, 1);
			},
		}, {
			onCancel: () => {
				prompt.cancel('Операция отменена.');
				process.exit(0);
			},
		});
		const s = spinner();
		s.start('Обработка запроса Gemini');
		const result_call = await call_python_with_spinner('collection_gen.py', 'generate_collection', JSON.stringify(result)) as string;
		const code_collection = JSON.parse(result_call)?.collection ?? '';
		write_to_config(result.typePage, code_collection);
		s.stop('Gemini завершил обработку, коллекция записана в config.ts');
	} catch (e) {
		log.error(e?.message);
		process.exit(0);
	}
}
