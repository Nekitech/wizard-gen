import path from 'node:path';
import { JWT } from 'google-auth-library';
import { Excel } from './excel';

export async function connectGoogleApiTable(credsPath: string, envPath: string) {
	try {
		const destCreds = path.resolve(process.cwd(), credsPath);
		console.log(process.cwd(), destCreds);
		const creds = await import(destCreds);
		const serviceAccountAuth = new JWT({
			email: creds.client_email,
			key: creds.private_key,
			scopes: ['https://www.googleapis.com/auth/spreadsheets'],
		});
		const gsh = new Excel(serviceAccountAuth, envPath);
		await gsh.init();
	} catch (e: any) {
		throw new Error(e.message);
	}
}
