import { call_python } from '../helpers/call_python';

export async function fillGoogleSheetTable() {
	await call_python('main_gen.py', 'main');
}
