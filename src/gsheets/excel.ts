import path from 'node:path';
import { config } from 'dotenv';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export class Excel {
	table: GoogleSpreadsheet | null = null;

	constructor(envPath: string) {
		try {
			config({
				path: [path.resolve(process.cwd(), envPath), path.resolve(process.cwd(), `../${envPath}`)],
			});
			const serviceAccountAuth = new JWT({
				email: process.env.CREDENTIALS_CLIENT_EMAIL,
				key: process.env.CREDENTIALS_PRIVATE_KEY,
				scopes: ['https://www.googleapis.com/auth/spreadsheets'],
			});
			this.table = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_TABLE_ID ?? '', serviceAccountAuth);
		} catch (e: any) {
			throw new Error(e.message);
		}
	}

	async init() {
		await this.table?.loadInfo();
	}

	async getNameSheets() {
		return this.table?.sheetsByIndex.map(sheet => sheet.title);
	}

	async addRow(sheetName: string, rowData: any) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);

		await sheet.addRow(rowData);
		console.log(`Строка добавлена в лист '${sheetName}':`, rowData);
	}

	async getRowsBySheetName(sheetName: string, header = 2) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);
		await sheet?.loadHeaderRow(header);

		const data = await sheet?.getRows();
		return data?.map(row => row.toObject());
	}

	async deleteSheet(sheetName: string) {
		const sheet = this.table?.sheetsByTitle[sheetName];
		if (!sheet) throw new Error(`Лист '${sheetName}' не найден`);

		await sheet.delete();
		console.log(`Лист '${sheetName}' удалён`);
	}

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
}
