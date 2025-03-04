import { call_python } from '../helpers/call_python';

export async function generate_comments() {
	await call_python('comments_gen.py', 'main');
}
