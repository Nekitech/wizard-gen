import * as process from 'node:process';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import creds from './creds.json';

console.log(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, process.env.GOOGLE_SHEETS_API_KEY);
const serviceAccountAuth = new JWT({
	email: creds.client_email,
	key: creds.private_key,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet('1CdsRsdSit6OUS4HNhG1GZzxZSURmltwElfoH8mVaMHQ', serviceAccountAuth);
await doc.loadInfo();

const sheet = doc.sheetsByTitle.pages_cast;
await sheet?.loadHeaderRow(2);

const data = await sheet?.getRows();
const jsonData = data?.map(row => row.toObject());
console.log(JSON.stringify(jsonData, null, 4));
export async function connectGoogleApi() {

}
