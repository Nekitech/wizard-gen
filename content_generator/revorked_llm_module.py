import content_generator.fabric_adapters as adp
from content_generator.helpers import read_template

def generate_coments(adapter: adp.LLMAdapter, semantic_core: list, slug: str, title: str, template_path: str):
    json_template = "{\"text\": [\"comment1\", \"comment2\", ...]\", \"name\": [\"name1\", \"name2\", ...]}"
    template = read_template(template_path, "comments")
    try:
        template = template.format(
            title=title,
            semantic_core=semantic_core,
            slug=slug,
            json_format=json_template
        )
    except Exception as e:
        raise Exception(f"Wrong format of template, expected other params. {str(e)}")
    
    try:
        result = adapter.send_prompt(template)
        result = adapter.result_to_json(result)
    except Exception as e:
        raise Exception(f"Something went wrong during llm request. {str(e)}")
    
    return result

def generate_page_info(adapter: adp.LLMAdapter,
                        semantic_core: list,
                        slug: str,
                        title: str,
                        page_title: str,
                        page_description: str,
                        template_path: str
                        ):
    template = read_template(template_path, "main")
    try:
        template = template.format(
            title=title,
            semantic_core=semantic_core,
            page_title=page_title,
            slug=slug,
            page_description=page_description
        )
    except Exception as e:
        raise Exception(f"Wrong format of template, expected other params. {str(e)}")
    
    try:
        result = adapter.send_prompt(template)
        result = adapter.result_to_json(result)
    except Exception as e:
        raise Exception(f"Something went wrong during llm request. {str(e)}")
    
    return result

def generate_slugs(adapter: adp.LLMAdapter,
                    worksheet_title: str,
                    description_of_page: str,
                    title: str,
                    template_path: str
                    ):
    template = read_template(template_path, "slug")
    try:
        template = template.format(
            worksheet_title=worksheet_title,
            description_of_page=description_of_page,
            name_title=title
        )
    except Exception as e:
        raise Exception(f"Wrong format of template, expected other params. {str(e)}")
    
    try:
        result = adapter.send_prompt(template)
        result = adapter.result_to_json(result)
    except Exception as e:
        raise Exception(f"Something went wrong during llm request. {str(e)}")
    
    return result