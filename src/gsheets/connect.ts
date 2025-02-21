import { spinner } from '@clack/prompts';
import { Excel } from './excel';

export async function connectGoogleApiTable(envPath: string = '.env') {
	try {
		const s = spinner();
		s.start('Connection to table');
		const gsh = new Excel(envPath);
		await gsh.init();
		s.stop('connection success!');
		return gsh;
	} catch (e: any) {
		throw new Error(e.message);
	}
}
