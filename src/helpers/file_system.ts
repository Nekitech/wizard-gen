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

/**
 * Записывает строку в файл по указанному пути.
 * @param filePath - Путь к файлу.
 * @param content - Строка для записи.
 * @param options - Опции для записи (например, кодировка).
 */
export function writeToFile(filePath: string, content: string, options: fs.WriteFileOptions = 'utf-8'): void {
	try {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(filePath, content, options);
		console.log(`Файл успешно записан: ${filePath}`);
	} catch (error) {
		console.error(`Ошибка при записи файла: ${error.message}`);
	}
}
