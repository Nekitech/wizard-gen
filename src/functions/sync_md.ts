import { log } from "@clack/prompts";
import { connectGoogleApiTable } from "../gsheets/connect";
import { generate_collection } from "./generate_collection";
import { update_md_content } from "./update_page";

export async function sync_md() {
    const gsh = await connectGoogleApiTable();
    await update_md_content(gsh);
    await generate_collection(gsh);
    log.success('Sync MD completed');
}