import path from 'node:path';
import fs from 'fs-extra';
import matter from 'gray-matter';

export async function page_generation(name_page: string) {
	const md_path = path.resolve(process.cwd(), `src/content/${name_page}/${name_page}.md`);
	const md_data = fs.readFileSync(md_path, 'utf-8');

	const { data, content } = matter(md_data);

	data[name_page].push(data);

	matter.stringify(content, data);
}
