import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.constants import ListsNames

from dotenv import load_dotenv

from content_generator.helpers import result_to_json, get_google_sheet, dict_to_row, read_template
from llm_module import send_to_llm

load_dotenv(".env")




def main():
    spreadsheet = get_google_sheet()

    # Шаг 1: Сбор семантического ядра (первый лист)
    semantic_core_worksheet = spreadsheet.worksheet(ListsNames.SEMANTIC_CORE.value)
    semantic_core_data = semantic_core_worksheet.col_values(1)
    semantic_core = [item.strip() for item in semantic_core_data if item.strip()]
    semantic_core = semantic_core[1:]
    title = os.getenv("TITLE")
    print(f"Семантическое ядро собрано: {len(semantic_core)} элементов.")

    # Шаг 2: Сбор типов страниц и их описаний (второй лист)
    page_types_worksheet = spreadsheet.worksheet(ListsNames.TYPES_PAGES.value)
    page_types_data = page_types_worksheet.get_all_records()
    page_types = {row["type"]: row["description"] for row in page_types_data}
    print(f"Типы страниц собраны: {len(page_types)} типов.")

    # Шаг 3: Сбор ключей и их описаний для каждого типа (третий лист)
    descriptions_worksheet = spreadsheet.worksheet(ListsNames.STRUCTURE_DATA.value)
    descriptions_data = descriptions_worksheet.get_all_records()
    descriptions = {}
    for row in descriptions_data:
        page_type = row["type"]
        key_name = row["columnName"]
        key_description = row["columnDescription"]
        if page_type not in descriptions:
            descriptions[page_type] = {}
        descriptions[page_type][key_name] = key_description
    print(f"Описания ключей собраны для {len(descriptions)} типов.")

    # Шаг 4: Обработка остальных листов
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title
        data = worksheet.get_all_records()
        headers = worksheet.row_values(1)
        main_gen_template_path = os.getenv("TEMPLATE_PATH")
        template = read_template(main_gen_template_path, "main")
        if worksheet_title == "page_index":
            slug = "index"
            page_description = "это главная страница сайта"
            desc = {
                "description": "Описание главной страницы",
                "h1": "Заголовок на странице",
                "title": "Загловок файла",
                "text": "Текст страницы с описанием тайтла",
                "url": "url",
            }
            try:
                template = template.format(
                    title=title,
                    semantic_core=semantic_core,
                    page_title=page_description,
                    slug=slug,
                    page_description=desc
                )
            except Exception as e:
                raise Exception(f"Wrong format of template, expected other params. {str(e)}")
#             template = f"""Сгенерируй контент на основе ключевых слов, семантического ядра и твоих знаний о тайтле. 
#                 Тайтл: {title}
#                 Cемантическое ядро: {semantic_core}
#                 Описание страницы: это главная страница сайта
#                 Нужно сгенерировать поля: {desc}
#                 Ответ на запрос верни в формате json. 
#                 Имена актеров и персонажей, названия тайтла и серий должны быть на русском.
# """
            try:
                response = send_to_llm(template)
            except Exception as e:
                response = None
                print(f"Exeption occured: {e}")

            if response:
                response = result_to_json(response)
                print("Ответ:")
                print(response)
                row_data = dict_to_row(response, headers)
                for col_index in range(len(headers)):
                    if row_data[col_index] and headers[col_index] != "slug":
                        try:
                            worksheet.update_cell(2, col_index + 1, row_data[col_index])
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")
            else:
                print("LLM returned wrong response")
            continue
        
        worksheet_title = worksheet_title[5:]
        worksheet_title = worksheet_title.lstrip("_")
        if worksheet_title not in page_types:
            print(
                f"Лист '{worksheet_title}' не содержит известного типа страницы. Пропускаю..."
            )
            continue

        print(f"Обработка листа '{worksheet_title}'...")
        if descriptions.get(worksheet_title, {}) == {}:
            print("Пока генерить нечего, поля не описаны")
            continue

        # Получаем данные со второго и третьего столбца (slug и keywords)
        for index, row in enumerate(data):
            slug = row.get("slug", "")
            page_title = page_types.get(worksheet_title, "")
            page_description = descriptions.get(worksheet_title, {})
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
            # template = f"""Сгенерируй контент на основе ключевых слов, семантического ядра и твоих знаний о тайтле. 
            #     Тайтл: {title}
            #     Cемантическое ядро: {semantic_core}
            #     Описание страницы: {page_title}
            #     Для страницы: {slug}
            #     Нужно сгенерировать поля: {page_description}
            #     Ответ на запрос верни в формате json. """

            # Отправка запроса в llm
            try:
                response = send_to_llm(template)
            except Exception as e:
                response = None
                print(f"Exeption occured: {e}")

            if response:
                response = result_to_json(response)
                row_data = dict_to_row(response, headers)
                for col_index in range(len(headers)):
                    if row_data[col_index] and headers[col_index] != "slug":
                        try:
                            worksheet.update_cell(
                                index + 2, col_index + 1, row_data[col_index]
                            )
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")
            else:
                print("LLM returned wrong response")

        print(f"Лист '{worksheet_title}' успешно обработан.")

    print("Все листы обработаны.")

# main()