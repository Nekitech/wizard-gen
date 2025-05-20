import path from 'node:path';
import * as process from 'node:process';
import { log, spinner } from '@clack/prompts';
import fs from 'fs-extra';
import { LISTS } from '../constants';
import { Excel } from '../gsheets/excel';
import { call_python_with_spinner } from '../helpers/call_python';

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

export async function generate_collection(gsh: Excel) {
	try {
		const types_fields = await gsh.getGroupedRowsByField(LISTS.structure_data, 1, 'type');

		const s = spinner();
		s.start('Обработка запроса Gemini');

		for (const page_type in types_fields) {
			const data = {
				type: page_type,
				list_fields: types_fields[page_type],
			};
			const result_call = await call_python_with_spinner('collection_gen.py', 'generate_collection', JSON.stringify(data)) as string;

			const code_collection = JSON.parse(result_call)?.collection ?? '';
			write_to_config(page_type, code_collection);
		}

		s.stop('Gemini завершил обработку, коллекция записана в config.ts');
	} catch (e) {
		log.error(e?.message);
		process.exit(0);
	}
}
