import fs from 'node:fs';
import path from 'node:path';
import { confirm, note, select } from '@clack/prompts';

const WIZARD_DIR = path.join(process.cwd(), '.wizard');
export const SCHEME_FILE = path.join(WIZARD_DIR, 'scheme.json');

/**
 * Проверяет существование схемы и предлагает действия
 */
export async function getScheme() {
	if (!fs.existsSync(SCHEME_FILE)) {
		if (!fs.existsSync(WIZARD_DIR)) {
			fs.mkdirSync(WIZARD_DIR, { recursive: true });
		}

		const shouldCreate = await confirm({
			message: 'Схема не найдена. Создать новую?',
		});

		if (!shouldCreate) {
			process.exit(0);
		}

		fs.writeFileSync(SCHEME_FILE, JSON.stringify({}, null, 2));
		note('Создан новый файл схемы .wizard/scheme.json', '📁');
		return null;
	}

	const shouldImport = await select({
		message: 'Найдена существующая схема. Что сделать?',
		options: [
			{ value: 'import', label: 'Импортировать схему', hint: 'Схема будет загружена из файла .wizard/scheme.json' },
			{ value: 'new', label: 'Начать новую', hint: 'Предыдущая схема будет удалена' },
		],
	});

	if (shouldImport === 'import') {
		const schema = JSON.parse(fs.readFileSync(SCHEME_FILE, 'utf-8'));
		note('Схема загружена.', '✅');
		return schema;
	}

	fs.writeFileSync(SCHEME_FILE, JSON.stringify({}, null, 2));
	note('Создан новый файл схемы .wizard/scheme.json', '📁');
	return null;
}
