import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as prompt from '@clack/prompts';
import { cancel, confirm, group, isCancel, log, select, spinner, text } from '@clack/prompts';
import { LISTS } from '../constants';
import { Excel } from '../gsheets/excel';
import { call_python_with_spinner } from '../helpers/call_python';
import { getDirectories, readFile } from '../helpers/file_system';
import { isEmpty } from '../helpers/validation';
import { generate_collection } from '../process/generate_collection';
import { getScheme, SCHEME_FILE } from '../process/wizard-folder';
import { startTemplateByName } from '../template_module';
import { TStructureDataItem } from '../types/types';
import { update_md_content } from './update_md_content';

type TPagesData = {
	type: string;
	description: string;

};

/**
 * Запрашивает у пользователя названия страниц и их описания.
 * @returns Объект, где ключ - название страницы, значение - описание.
 */
async function types_pages() {
	const result = await prompt.text({
		message: 'Введите названия страниц (через запятую, без пробелов)',
		validate: (value: string) => {
			if (isEmpty(value)) {
				log.error('Значение не должно быть пустым');
				return new Error('Значение не должно быть пустым');
			}
			return;
		},
	}) as string;

	const pages: string[] = result.split(',');
	const pagesData: TPagesData[] = [];

	for (const page of pages) {
		const description: string = await prompt.text({
			message: `Введите описание для страницы "${page}"`,
			validate: (value: string) => {
				if (isEmpty(value)) {
					log.error('Описание не должно быть пустым');
					return new Error('Описание не должно быть пустым');
				}
				return;
			},
		}) as string;

		pagesData.push({
			type: page,
			description,
		});
	}

	return pagesData;
}

/**
 * Запрашивает у пользователя названия полей, их типы и описания для каждой страницы.
 * @param pagesData - Объект с названиями страниц и их описаниями.
 * @returns Объект, где ключ - название страницы, значение - объект с полями и их характеристиками.
 */
async function structure_data({ results }: any) {
	const structure: TStructureDataItem[] = [];

	for (const page of results.types_pages) {
		const fieldsResult: string = await prompt.text({
			message: `Перечислите поля для страницы "${page.type}" (через запятую, без пробелов)`,
			validate: (value: string) => {
				if (isEmpty(value)) {
					log.error('Значение не должно быть пустым');
					return new Error('Значение не должно быть пустым');
				}
				return;
			},
		}) as string;

		const fieldNames: string[] = fieldsResult.split(',');
		const types = await getFieldDataByTypePage(fieldNames);
		structure.push(...types.map((el) => {
			return {
				...el,
				type: page.type,
			};
		}));
	}

	return structure;
}

/**
 * Функция возвращает название, описание и тип полей конкретного типа страниц
 * @param fieldNames - Массив имен полей
 * @returns Объект с типами полей и описаниями
 */
async function getFieldDataByTypePage(fieldNames: string[]) {
	const fieldTypes: string[] = ['string', 'number', 'boolean', 'date', 'array', 'object'];
	const result: Omit<TStructureDataItem, 'type'>[] = [];

	for (const fieldName of fieldNames) {
		const type: string = await prompt.select({
			message: `Выберите тип для поля "${fieldName}"`,
			options: fieldTypes.map(type => ({ value: type, label: type })),
		}) as string;

		const description: string = await prompt.text({
			message: `Введите описание для поля "${fieldName}"`,
			validate: (value: string) => {
				if (isEmpty(value)) {
					log.error('Описание не должно быть пустым');
					return new Error('Описание не должно быть пустым');
				}
				return;
			},
		}) as string;

		result.push({ columnName: fieldName, columnType: type, columnDescription: description });
	}

	return result;
}

/*
	Запрос на получение семантического ядра в виде текста либо текстового файла
 */
async function semantic_core() {
	const select_options_core = await select({
		message: 'Хотите ввести семантическое ядро вручную или считать из файла .txt?',
		options: [
			{
				value: 'semantic_core_text',
				label: 'Ввести текстом',
				hint: 'через запятую',
			},
			{
				value: 'semantic_core_file',
				label: 'Считать из файла',
				hint: 'Расширение файла - *.txt',
			},
		],
	});
	switch (select_options_core) {
		case 'semantic_core_file': {
			const text_path = await text({
				message: 'Введите путь до файла',
				validate: (value: string) => {
					if (isEmpty(value)) {
						log.error('Значение семантического ядра не должно быть пустым');
						return new Error('Значение не должно быть пустым');
					}
					return;
				},
			}) as string;
			const file_core_path = path.resolve(process.cwd(), text_path);
			return readFile(file_core_path).split(',');
		}

		case 'semantic_core_text': {
			const keywords = await text({
				placeholder: '(через запятую, без пробелов)',
				message: 'Введите семантическое ядро',
				validate: (value: string) => {
					if (isEmpty(value)) {
						log.error('Значение семантического ядра не должно быть пустым');
						return new Error('Значение не должно быть пустым');
					}
					return;
				},
			}) as string;
			return keywords.split(',');
		}
		default:
			return null;
	}
}

export async function generate_project(gsh: Excel) {
	const s = spinner();
	const templates_options = getDirectories('templates').map((name) => {
		return {
			label: name,
			value: name,
		};
	});

	let scheme_site = await getScheme();

	if (!scheme_site) {
		scheme_site = await group({
			semantic_core,
			types_pages,
			structure_data,
			select_template: async () => {
				return await select({
					message: 'Choice a template',
					options: templates_options,
				}).then(async (res) => {
					const dest_path = await text({
						message: 'Input destination path: ',
						defaultValue: '.',
					});

					if (isCancel(dest_path)) {
						cancel('Operation cancelled.');
						process.exit(0);
					}
					const dest = path.resolve(process.cwd(), dest_path);
					await startTemplateByName(dest, res as string);

					return res;
				});
			},
			isSaveScheme: async ({ results }) => {
				const isSaved = await confirm({
					message: 'Сохранить данную схему?',
					initialValue: true,
				});
				if (isSaved) {
					fs.writeFileSync(SCHEME_FILE, JSON.stringify(results, null, 4));
				}
			},
		}, {
			onCancel: ({ results }) => {
				cancel('Operation cancelled.');
				log.warn(JSON.stringify(results, null, 4));
				process.exit(0);
			},
		});
	}
	s.message('Очищаем старые листы: ');

	await gsh.deleteAllSheets([LISTS.semantic_core, LISTS.structure_data, LISTS.types_pages]);

	s.start('Создание и заполнение листов');

	/* Создание и заполнение листа семантического ядра */
	await gsh.createOrGetSheet(LISTS.semantic_core, ['keyword']);

	const keywords_list = scheme_site?.semantic_core ?? [];

	for (const keyword of keywords_list) {
		await gsh.addRow(LISTS.semantic_core, {
			keyword,
		});
	}

	/* Создание и заполнение листа с типами страниц */

	await gsh.createOrGetSheet(LISTS.types_pages, ['type', 'description']);
	for (const page of scheme_site?.types_pages) {
		await gsh.addRow(LISTS.types_pages, page);
	}

	/* Создание и заполнение листа со структурой данных (полями страниц) */

	await gsh.createOrGetSheet(LISTS.structure_data, ['type', 'columnName', 'columnDescription', 'columnType']);
	for (const column of scheme_site?.structure_data) {
		await gsh.addRow(LISTS.structure_data, column);
	}

	/* Создание листов для страниц */

	for (const page of scheme_site?.types_pages) {
		// фильтруем поля конкретного типа страницы и берет только название поля, для вставки в хедеры текущей таблицы
		const fields = scheme_site?.structure_data
			.filter((field: TStructureDataItem) => field.type === page.type)
			.map((field: TStructureDataItem) => field.columnName);
		await gsh.createOrGetSheet(`${LISTS.pages}${page.type}`, fields);
	}

	// генерация slug'ов
	await call_python_with_spinner('slug_gen.py', 'main');
	await call_python_with_spinner('main_gen.py', 'main');

	s.stop('Создание и заполнение листов завершено');

	// обновление .md файлов контента
	await update_md_content(gsh);

	// генерация коллекций
	await generate_collection(gsh);

	log.step(JSON.stringify(scheme_site, null, 4));

	await call_python_with_spinner('slug_gen.py', 'main');
	await call_python_with_spinner('main_gen.py', 'main');
}
