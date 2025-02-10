import path from 'node:path';
import { config } from 'dotenv';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import creds from './creds.json';

config({
	path: path.resolve(process.cwd(), '.env'),
});

const serviceAccountAuth = new JWT({
	email: creds.client_email,
	key: creds.private_key,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

//
// const sheet = doc.sheetsByTitle.pages_cast;
// await sheet?.loadHeaderRow(2);
//
// const data = await sheet?.getRows();
// const jsonData = data?.map(row => row.toObject());

export async function connectGoogleApiTable() {
	try {
		const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_TABLE_ID ?? '', serviceAccountAuth);
		await doc.loadInfo();
		console.log(`Connection is success! Amount of pages is: ${doc.sheetCount}`);
		return doc;
	} catch (e: any) {
		throw new Error(e.message);
	}
}
