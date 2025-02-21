import path from 'node:path';
import fs from 'fs-extra';

import matter from 'gray-matter';

export async function page_generation(name_page: string, gsheets_data: any) {
	const dir_path = path.resolve(process.cwd(), `src/content/${name_page}`);
	const md_path = path.join(dir_path, `${name_page}.md`);

	if (!fs.existsSync(dir_path)) {
		fs.mkdirSync(dir_path, { recursive: true });
	}
	const new_content = matter.stringify('', { [name_page]: gsheets_data });

	fs.writeFileSync(md_path, new_content, 'utf-8');
}
