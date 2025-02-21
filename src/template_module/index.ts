import * as path from 'node:path';
import fs from 'fs-extra';

const templates_folder = 'templates';

/**
 * Копирует шаблон сайта в целевую папку
 * @param dest
 * @param name
 */
export async function startTemplateByName(dest: string, name: string) {
	const source = path.join(process.cwd(), templates_folder, name);
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
