import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesSrc = path.resolve(__dirname, 'templates');
const templatesDest = path.resolve(__dirname, 'dist/templates');

await fs.copy(templatesSrc, templatesDest, (err) => {
	if (err) return console.error('Ошибка копирования:', err);
	console.log('Папка templates успешно скопирована!');
});
