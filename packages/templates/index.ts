import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const templates_folder = 'templates';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Копирует шаблон сайта в целевую папку
 * @param dest
 * @param name
 */
export async function startTemplateByName(dest: string, name: string) {
	const source = path.join(__dirname, templates_folder, name);
	if (!fs.existsSync(source)) {
		throw new Error(`Source directory does not exist: ${source}`);
	}

	if (!fs.existsSync(dest)) {
		throw new Error(`Destination directory does not exist: ${dest}`);
	}

	try {
		await fs.copy(source, dest);
		console.log('Папка успешно скопирована!');
	} catch (err) {
		console.error('Ошибка при копировании папки:', err);
	}
}
