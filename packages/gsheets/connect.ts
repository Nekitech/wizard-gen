import { JWT } from 'google-auth-library';
import creds from './creds.json';
import { Excel } from './src/excel';

const serviceAccountAuth = new JWT({
	email: creds.client_email,
	key: creds.private_key,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export async function connectGoogleApiTable() {
	try {
		const gsh = new Excel(serviceAccountAuth);
		await gsh.init();
		console.log(await gsh.getRowsBySheetName('Структура данных', 1));
	} catch (e: any) {
		throw new Error(e.message);
	}
}

await connectGoogleApiTable();
