import { log } from '@clack/prompts';
import { Excel } from '../gsheets/excel';
import { generate_collection } from '../process/generate_collection';
import { update_md_content } from './update_md_content';

export async function sync_md_and_collection(gsh: Excel) {
	await update_md_content(gsh);
	await generate_collection(gsh);

	log.success('Sync MD completed');
}
