import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '@clack/prompts';
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
		log.success(`Файл успешно записан: ${filePath}`);
	} catch (error) {
		log.error(`Ошибка при записи файла: ${error?.message}`);
	}
}

export function readJsonFileSync(filePath: string) {
	try {
		const fullPath = path.resolve(process.cwd(), filePath);
		const fileContent = fs.readFileSync(fullPath, 'utf-8');
		return JSON.parse(fileContent);
	} catch (error) {
		throw new Error(`Ошибка при чтении JSON-файла: ${error?.message}`);
	}
}

export function readFile(filePath: string) {
	try {
		const fullPath = path.resolve(process.cwd(), filePath);
		return fs.readFileSync(fullPath, 'utf-8');
	} catch (error) {
		throw new Error(`Ошибка при чтении файла: ${error?.message}`);
	}
}

export function clearFolder(folderPath: string) {
	try {
		if (!fs.existsSync(folderPath)) {
			log.warn(`Папка ${folderPath} не существует.`);
			return;
		}

		const items = fs.readdirSync(folderPath);

		for (const item of items) {
			const itemPath = path.join(folderPath, item);

			try {
				const isDirectory = fs.statSync(itemPath).isDirectory();

				if (isDirectory) {
					clearFolder(itemPath);
					fs.rmdirSync(itemPath);
				} else {
					fs.unlinkSync(itemPath);
				}
			} catch (error: any) {
				log.error(`Ошибка при обработке ${itemPath}:`, error?.message);
			}
		}

		log.info(`Папка ${folderPath} очищена.`);
	} catch (error: any) {
		log.error(`Ошибка при очистке папки ${folderPath}:`, error?.message);
	}
}
