import path from 'node:path';
import process from 'node:process';
import { log, spinner } from '@clack/prompts';
import { connectGoogleApiTable } from '../gsheets/connect';
import { clearFolder } from '../helpers/file_system';
import { page_generation } from '../md/md_api';

export async function update_page() {
	try {
		const s = spinner();
		const gsh = await connectGoogleApiTable();

		s.start('Получение типов страниц');
		const types_pages = await gsh.getRowsBySheetName('Типы страниц');
		const type_pages_options = types_pages?.map(item => item.index);
		s.stop('Страницы получены');

		s.start('Удаление md-файлов в src/content');
		const content_path = path.resolve(process.cwd(), 'src/content');
		clearFolder(content_path);
		s.stop('Удаление завершено');

		s.start('Получение данных, генерация и загрузка контента в md-файлы');
		try {
			for (const type of type_pages_options) {
				try {
					const data = await gsh.getRowsBySheetName(`pages_${type}`, 1);
					await page_generation(type, data, gsh);
				} catch (error) {
					log.error(`Ошибка при обработке страницы "${type}":`, error?.message);
					throw error;
				}
			}
		} catch {
			log.error('Произошла ошибка при обработке страниц.');
		}
		s.stop('Загрузка завершена');
	} catch (e) {
		log.error(e?.message);
		process.exit(0);
	}
}
