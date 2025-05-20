import path from 'node:path';
import { log } from '@clack/prompts';
import { config } from 'dotenv';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { readJsonFileSync } from '../helpers/file_system';

export class Excel {
	#table: GoogleSpreadsheet | null = null;
	#scope = ['https://www.googleapis.com/auth/spreadsheets'];

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
				scopes: this.#scope,
			});
			this.#table = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_TABLE_ID ?? '', serviceAccountAuth);
		} catch (e: any) {
			throw new Error(e.message);
		}
	}

	/**
	 * Инициализация таблицы.
	 * @returns {Promise<void>}
	 */
	async init() {
		await this.#table?.loadInfo();
	}

	/**
	 * Получение таблицы.
	 * @returns {GoogleSpreadsheet | null} Таблица.
	 */
	get table(): GoogleSpreadsheet | null {
		return this.#table;
	}

	/**
	 * Получение названий всех листов в таблице.
	 * @returns {Promise<string[] | undefined>} Массив названий листов.
	 */
	async getNameSheets() {
		return this.#table?.sheetsByIndex.map(sheet => sheet.title);
	}

	/**
	 * Добавление строки в указанный лист.
	 * @param {string} sheetName - Название листа.
	 * @param {any} rowData - Данные для добавления в строку.
	 * @throws {Error} Если лист не найден.
	 */
	async addRow(sheetName: string, rowData: any) {
		const sheet = this.#table?.sheetsByTitle[sheetName];
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
	async getRowsBySheetName(sheetName: string, header = 1) {
		const sheet = this.#table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);
		await sheet?.loadHeaderRow(header);

		const data = await sheet?.getRows();
		return data?.map(row => row.toObject());
	}

	/**
	 * Получение всех строк из указанного листа с группировкой по заданному полю.
	 * @param {string} sheetName - Название листа.
	 * @param {number} [header] - Номер строки, содержащей заголовки.
	 * @param {string} group_field - Поле, по которому нужно сгруппировать данные.
	 * @returns {Promise<Record<string, any[]> | undefined>} Объект с группировкой по заданному полю.
	 * @throws {Error} Если лист не найден.
	 */
	async getGroupedRowsByField(sheetName: string, header = 1, group_field: string) {
		const sheet = this.#table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);
		await sheet?.loadHeaderRow(header);

		const data = await sheet?.getRows();
		const rows = data?.map(row => row.toObject()) || [];

		// Группировка по заданному полю
		return rows.reduce((acc, row) => {
			const key = row[group_field];
			if (!acc[key]) acc[key] = [];
			acc[key].push(row);
			return acc;
		}, {} as Record<string, any[]>);
	}

	/**
	 * Удаление листа по названию.
	 * @param {string} sheetName - Название листа.
	 * @throws {Error} Если лист не найден.
	 */
	async deleteSheet(sheetName: string) {
		const sheet = this.#table?.sheetsByTitle[sheetName];
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
		const sheet = this.#table?.sheetsByTitle[sheetName];
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
	 * Удаляет все листы, кроме указанных в исключениях.
	 * @param {string[]} [excludeSheets] - Массив названий листов, которые не нужно удалять.
	 */
	async deleteAllSheets(excludeSheets: string[] = []) {
		const sheets = this.#table?.sheetsByIndex ?? [];

		for (const sheet of sheets) {
			if (excludeSheets.includes(sheet.title)) {
				console.log(`Skipping sheet: ${sheet.title}`);
				continue;
			}

			await sheet.delete();
			console.log(`Deleted sheet: ${sheet.title}`);
		}
	}

	/**
	 * Создание нового листа или получение существующего.
	 * @param {string} sheetName - Название листа.
	 * @param headers
	 * @returns {Promise<GoogleSpreadsheetWorksheet>} Созданный или существующий лист.
	 */
	async createOrGetSheet(sheetName: string, headers?: string[]) {
		let sheet = this.#table?.sheetsByTitle[sheetName];
		if (!sheet) {
			sheet = await this.#table?.addSheet(
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
