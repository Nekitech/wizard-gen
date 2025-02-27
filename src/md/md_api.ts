import path from 'node:path';
import fs from 'fs-extra';

import matter from 'gray-matter';
import { connectGoogleApiTable } from '../gsheets/connect';

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

export async function page_generation(name_page: string, gsheets_data: any) {
	const dir_path = path.resolve(process.cwd(), `src/content/${name_page}`);
	const md_path = path.join(dir_path, `${name_page}.md`);

	if (!fs.existsSync(dir_path)) {
		fs.mkdirSync(dir_path, { recursive: true });
	}
	const gsh = await connectGoogleApiTable();
	const types_by_name_page = (await gsh.getRowsBySheetName('Структура данных', 1)).filter(item => item.type === name_page);

	const data = gsheets_data.map(obj => processObject(obj, types_by_name_page));
	const new_content = matter.stringify('', { [name_page]: data });

	fs.writeFileSync(md_path, new_content, 'utf-8');
}
