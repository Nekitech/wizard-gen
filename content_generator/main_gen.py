import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.constants import ListsNames

from dotenv import load_dotenv
import time

from content_generator.helpers import result_to_json, get_google_sheet
# from helpers import result_to_json
from llm_module import send_to_llm

load_dotenv(".env")


def dict_to_row(data_dict, headers):
    return [str(data_dict.get(header, "")) for header in headers]



def main():
    spreadsheet = get_google_sheet()

    # Шаг 1: Сбор семантического ядра (первый лист)
    semantic_core_worksheet = spreadsheet.worksheet(ListsNames.SEMANTIC_CORE.value)
    semantic_core_data = semantic_core_worksheet.col_values(1)
    semantic_core = [item.strip() for item in semantic_core_data if item.strip()]
    semantic_core = semantic_core[1:]
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
        if worksheet_title == "page_index":
            desc = {
                "description": "Описание главной страницы",
                "h1": "Заголовок на странице",
                "title": "Загловок файла",
                "text": "Текст страницы с описанием тайтла",
                "url": "url",
            }
            template = f"""Сгенерируй контент на основе ключевых слов, семантического ядра и твоих знаний о сериале. 
                Cемантическое ядро: {semantic_core}
                Описание страницы: это главная страница сайта
                Нужно сгенерировать поля: {desc}
                Ответ на запрос верни в формате json. 
                Имена актеров и персонажей, названия тайтла и серий должны быть на русском.
"""
            try:
                response_llm = send_to_llm(template)

                if response_llm:
                    response_llm = result_to_json(response_llm)
                    print("Ответ:")
                    print(response_llm)
                    row_data = dict_to_row(response_llm, headers)
                    for col_index in range(len(headers)):
                        if row_data[col_index] and headers[col_index] != "slug":
                            try:
                                worksheet.update_cell(2, col_index + 1, row_data[col_index])
                            except Exception as e:
                                print(f"Ошибка при работе с Google Sheets: {e}")
                else:
                    print('error :(')
                time.sleep(5)
                continue
            except Exception as e:
                print(f"Ошибка: {e}")

        worksheet_title = worksheet_title[5:]
        worksheet_title = worksheet_title.lstrip("_")
        if worksheet_title not in page_types:
            print(f"Лист '{worksheet_title}' не содержит известного типа страницы. Пропускаю...")
            continue

        print(f"Обработка листа '{worksheet_title}'...")
        if descriptions.get(worksheet_title, {}) == {}:
            print("Пока генерить нечего, поля не описаны")
            continue

        # Получаем данные со второго и третьего столбца (slug и keywords)
        for index, row in enumerate(data):
            slug = row.get("slug", "")
            # keywords = row.get('keywords', '')
            # Ключевые слова: {keywords}

            # if not slug or not keywords:
            #     print(f"Пропускаю строку {index + 1}: отсутствуют slug или keywords.")
            #     continue
            title = os.getenv("TITLE")

            template = f"""Сгенерируй контент на основе ключевых слов, семантического ядра и твоих знаний о тайтле. 
                Тайтл: {title}
                Cемантическое ядро: {semantic_core}
                Описание страницы: {page_types.get(worksheet_title, "")}
                Для страницы: {slug}
                Нужно сгенерировать поля: {descriptions.get(worksheet_title, {})}
                Ответ на запрос верни в формате json. Без дополнительных пояснений и другого текста!"""

            # Отправка запроса в Gemini
            try:
                response_llm = send_to_llm(template)

                if response_llm:
                    response_llm = result_to_json(response_llm)
                    row_data = dict_to_row(response_llm, headers)
                    for col_index in range(len(headers)):
                        if row_data[col_index] and headers[col_index] != "slug":
                            try:
                                worksheet.update_cell(index + 2, col_index + 1, row_data[col_index])
                            except Exception as e:
                                print(f"Ошибка при работе с Google Sheets: {e}")
                else:
                    print('Ответ на запрос не был получен')
            except Exception as e:
                print(f"Error: {e}")

        print(f"Лист '{worksheet_title}' успешно обработан.")

    print("Все листы обработаны.")

# main()
