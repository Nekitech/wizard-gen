import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

/**
 * Функция для получения названий директорий по указанному пути.
 * @param {string} dirPath - Путь к директории.
 * @returns {string[]} - Массив названий директорий.
 */
export function getDirectories(dirPath: string): string[] {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const templates_path = path.resolve(__dirname, dirPath);
	if (!fs.existsSync(templates_path)) {
		throw new Error(`Директория не существует: ${dirPath}`);
	}

	const items = fs.readdirSync(templates_path);

	return items.filter((item) => {
		const itemPath = path.join(templates_path, item);
		return fs.statSync(itemPath).isDirectory();
	});
}
