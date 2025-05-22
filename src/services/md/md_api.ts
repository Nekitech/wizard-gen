import path from 'node:path';
import { log } from '@clack/prompts';

import fs from 'fs-extra';
import matter from 'gray-matter';
import color from 'picocolors';

import { LISTS } from '../constants';
import { Excel } from '../gsheets/excel';

/**
 * Преобразует значение в зависимости от его типа.
 * @param value - Значение.
 * @param type - Тип значения.
 * @returns Преобразованное значение.
 */
function transformValue(value: any, type: string): any {
	switch (type) {
		case 'number':
			return Number(value);
		case 'boolean':
			return value === 'true' || value === '1' || value === true;
		case 'object':
			return JSON.parse(value);
		case 'array':
			return JSON.parse(value);
		default:
			return value;
	}
}

/**
 * Обрабатывает объект, преобразуя его поля в зависимости от типов.
 * @param obj - Объект для обработки.
 * @param types - Массив с типами полей.
 * @returns Обработанный объект.
 */
function processObject(obj: any, types: any[]): any {
	const result: any = {};

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			// Находим тип для текущего поля
			const fieldType = types.find(item => item.columnName === key)?.columnType || 'string';
			// Преобразуем значение
			result[key] = transformValue(obj[key], fieldType);
		}
	}

	return result;
}

export async function page_generation(name_page: string, gsheets_data: any, gsh: Excel) {
	const dir_path = path.resolve(process.cwd(), `src/content/${name_page}`);
	const md_path = path.join(dir_path, `${name_page}.md`);

	if (!fs.existsSync(dir_path)) {
		fs.mkdirSync(dir_path, { recursive: true });
	}

	const types_by_name_page = (await gsh.getRowsBySheetName(LISTS.structure_data, 1)).filter(item => item.type === name_page);

	const data = gsheets_data.map((obj: any) => processObject(obj, types_by_name_page));
	const new_content = matter.stringify('', { [name_page]: data });

	fs.writeFileSync(md_path, new_content, 'utf-8');
	log.message(`Контент страницы ${color.green(name_page)} успешно записался в файл ✅`);
}
