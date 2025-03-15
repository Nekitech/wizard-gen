import path from 'node:path';
import { log } from '@clack/prompts';
import { config } from 'dotenv';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { readJsonFileSync } from '../helpers/file_system';

export class Excel {
	table: GoogleSpreadsheet | null = null;

	/**
	 * Конструктор класса Excel.
	 * @param {string} envPath - Путь к файлу .env.
	 * @throws {Error} Если произошла ошибка при инициализации.
	 */
	constructor(envPath: string) {
		try {
			const creds = readJsonFileSync('credentials.json');
			config({
				path: [path.resolve(process.cwd(), envPath), path.resolve(process.cwd(), `../${envPath}`)],
			});
			const serviceAccountAuth = new JWT({
				email: creds?.client_email,
				key: creds?.private_key,
				scopes: ['https://www.googleapis.com/auth/spreadsheets'],
			});
			this.table = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_TABLE_ID ?? '', serviceAccountAuth);
		} catch (e: any) {
			throw new Error(e.message);
		}
	}

	/**
	 * Инициализация таблицы.
	 * @returns {Promise<void>}
	 */
	async init() {
		await this.table?.loadInfo();
	}

	/**
	 * Получение названий всех листов в таблице.
	 * @returns {Promise<string[] | undefined>} Массив названий листов.
	 */
	async getNameSheets() {
		return this.table?.sheetsByIndex.map(sheet => sheet.title);
	}

	/**
	 * Добавление строки в указанный лист.
	 * @param {string} sheetName - Название листа.
	 * @param {any} rowData - Данные для добавления в строку.
	 * @throws {Error} Если лист не найден.
	 */
	async addRow(sheetName: string, rowData: any) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);

		await sheet.addRow(rowData);
		log.success(`Строка добавлена в лист '${sheetName}':`);
	}

	/**
	 * Получение всех строк из указанного листа.
	 * @param {string} sheetName - Название листа.
	 * @param {number} [header] - Номер строки, содержащей заголовки.
	 * @returns {Promise<any[] | undefined>} Массив объектов, представляющих строки.
	 * @throws {Error} Если лист не найден.
	 */
	async getRowsBySheetName(sheetName: string, header = 2) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);
		await sheet?.loadHeaderRow(header);

		const data = await sheet?.getRows();
		return data?.map(row => row.toObject());
	}

	/**
	 * Удаление листа по названию.
	 * @param {string} sheetName - Название листа.
	 * @throws {Error} Если лист не найден.
	 */
	async deleteSheet(sheetName: string) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);

		await sheet.delete();
		console.log(`Лист '${sheetName}' удалён`);
	}

	/**
	 * Удаление строки по индексу из указанного листа.
	 * @param {string} sheetName - Название листа.
	 * @param {number} rowIndex - Индекс строки для удаления.
	 * @throws {Error} Если лист не найден или индекс строки неверный.
	 */
	async deleteRow(sheetName: string, rowIndex: number) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);

		await sheet.loadCells();
		const rows = await sheet.getRows();

		if (rowIndex < 0 || rowIndex >= rows.length) {
			throw new Error(`Строка с индексом ${rowIndex} не найдена`);
		}

		await rows[rowIndex]?.delete();
		console.log(`Строка ${rowIndex} удалена из листа '${sheetName}'`);
	}

	/**
	 * Создание нового листа или получение существующего.
	 * @param {string} sheetName - Название листа.
	 * @param headers
	 * @returns {Promise<GoogleSpreadsheetWorksheet>} Созданный или существующий лист.
	 */
	async createOrGetSheet(sheetName: string, headers?: string[]) {
		let sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) {
			sheet = await this.table?.addSheet(
				{
					title: sheetName,
					headerValues: headers,
				},
			);
			log.success(`Лист '${sheetName}' создан`);
		} else {
			log.error(`Лист '${sheetName}' уже существует`);
			await sheet.clear();
			await sheet.setHeaderRow(headers ?? []);
		}
		return sheet;
	}
}
