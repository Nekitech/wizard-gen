import { call_python_with_spinner } from '../helpers/call_python';

export async function fillGoogleSheetTable() {
	await call_python_with_spinner('main_gen.py', 'main');
}
