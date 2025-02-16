import { spinner } from '@clack/prompts';
import { connectGoogleApiTable } from '../gsheets/connect';

export async function gsheets_api() {
	const s = spinner();
	s.start('Connection to table');
	await connectGoogleApiTable('../.env');
	s.stop('connection success!');
}
