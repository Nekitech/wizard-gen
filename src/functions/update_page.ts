import * as prompt from '@clack/prompts';
import { log, spinner } from '@clack/prompts';
import { connectGoogleApiTable } from '../gsheets/connect';
import { page_generation } from '../md/md_api';

export async function update_page() {
	try {
		const s = spinner();
		const gsh = await connectGoogleApiTable();

		s.start('Получение типов страниц');
		const type_pages_options = (await gsh.getRowsBySheetName('Типы страниц'))?.map((item) => {
			return {
				value: item.index,
				label: item.index,

			};
		});
		s.stop('Страницы получены');

		const selected_type = await prompt.select({
			message: 'Выберите тип страниц, md - файл которой вы хотите обновить',
			options: type_pages_options,
		});
		s.start('Получение данных, загрузка в md-файл');
		const data = await gsh.getRowsBySheetName(`pages_${selected_type}`);
		await page_generation(selected_type, data);
		s.stop('Загрузка завершена');
	} catch (e) {
		log.error(e?.message);
		process.exit(0);
	}
}
