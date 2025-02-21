import path from 'node:path';
import fs from 'fs-extra';

/**
 * Функция для получения названий директорий по указанному пути.
 * @param {string} dirPath - Путь к директории.
 * @returns {string[]} - Массив названий директорий.
 */
export function getDirectories(dirPath: string): string[] {
	const templates_path = path.resolve(process.cwd(), dirPath);
	if (!fs.existsSync(templates_path)) {
		throw new Error(`Директория не существует: ${dirPath}`);
	}

	const items = fs.readdirSync(templates_path);

	return items.filter((item) => {
		const itemPath = path.join(templates_path, item);
		return fs.statSync(itemPath).isDirectory();
	});
}
