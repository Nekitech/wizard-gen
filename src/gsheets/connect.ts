import { spinner } from '@clack/prompts';
import color from 'picocolors';
import { Excel } from './excel';

export async function connectGoogleApiTable(envPath: string = '.env') {
	try {
		const s = spinner();
		s.start('Connection to table');
		const gsh = new Excel(envPath);
		await gsh.init();
		s.stop(`Successfully connecting to the table: ${color.green(gsh.table.title)}`);
		return gsh;
	} catch (e: any) {
		throw new Error(e.message);
	}
}
