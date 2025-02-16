import { Excel } from './excel';

export async function connectGoogleApiTable(envPath: string) {
	try {
		const gsh = new Excel(envPath);
		await gsh.init();
	} catch (e: any) {
		throw new Error(e.message);
	}
}
