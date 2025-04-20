import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from dotenv import load_dotenv

from content_generator.constants import ListsNames
from content_generator.helpers import result_to_json, get_google_sheet

from llm_module import send_to_llm

load_dotenv('.env')


def dict_to_row(data_dict, headers):
    return [str(data_dict.get(header, '')) for header in headers]


def main():
    spreadsheet = get_google_sheet()

    # Шаг 1: Сбор семантического ядра (первый лист)
    semantic_core_worksheet = spreadsheet.worksheet(ListsNames.SEMANTIC_CORE.value)  # Первый лист
    semantic_core_data = semantic_core_worksheet.col_values(1)  # Первая колонка
    semantic_core = [item.strip() for item in semantic_core_data if item.strip()]
    semantic_core = semantic_core[1:]
    print(f"Семантическое ядро собрано: {len(semantic_core)} элементов.")

    # Шаг 2: Сбор типов страниц и их описаний (второй лист)
    page_types_worksheet = spreadsheet.worksheet(ListsNames.TYPES_PAGES.value)  # Второй лист
    page_types_data = page_types_worksheet.get_all_records()
    page_types = {row['type']: row['description'] for row in page_types_data}
    print(f"Типы страниц собраны: {len(page_types)} типов.")

    all_slugs = []
    comms_index = -1
    # Шаг 4: Обработка остальных листов
    name_title = os.getenv("TITLE")
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title

        if worksheet_title == "page_index":
            continue

        if worksheet_title == ListsNames.COMMENTS.value:
            comms_index = i
            continue

        data = worksheet.get_all_records()
        headers = worksheet.row_values(1)
        worksheet_title = worksheet_title[5:]
        worksheet_title = worksheet_title.lstrip("_")
        if worksheet_title not in page_types:
            print(f"Лист '{worksheet_title}' не содержит известного типа страницы. Пропускаю...")
            continue

        print(f"Обработка листа '{worksheet_title}'...")

        template = f"""Сгенерируй массив всех страниц типа {worksheet_title} : {page_types.get(worksheet_title, '')}, для тайтла - {name_title} 
        Ответ на запрос верни в формате json. В json'e должен лежать только 1 ключ slugs по которому будет лежать массив строковых значений (название страниц).
        Важно: если это страницы сезона, нужен список только сезонов и фильмов, если эта страница серий, нужен список ВСЕХ серий, ВСЕХ сезонов + фильмы, если страница актеров и съемочный группы: список всех актеров, операторов постановщиков и т.д., если это страаница героев: список всех персонажей тайтла
        Важно: возвращай только json, без пояснений и другого текста!"""
        
        try:

            response_llm = send_to_llm(template)

            if response_llm:
                col_index = 0
                for index in range(len(headers)):
                    if headers[index] == "slug":
                        col_index = index
                        break
                response_llm = result_to_json(response_llm)
                print("Ответ:")
                print(response_llm)
                try:
                    data = response_llm["slugs"]
                    for index in range(len(data)):
                        all_slugs.append(data[index])
                        try:
                            worksheet.update_cell(index + 2, col_index + 1, data[index])
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")
                except Exception as e:
                    print("Json не правильной структуры :/")
            else:
                print('Не получили ответа от llm')
        except Exception as e:
            print(f"Error: {e}")

        print(f"Лист '{worksheet_title}' успешно обработан.")

    # Заполнение страницы комментариев
    worksheet = spreadsheet.get_worksheet(comms_index)
    col_index = 0
    headers = worksheet.row_values(1)
    for index in range(len(headers)):
        if headers[index] == "slug":
            col_index = index
            break
    data = all_slugs
    for index in range(len(data)):
        try:
            worksheet.update_cell(index + 2, col_index + 1, data[index])
        except Exception as e:
            print(f"Ошибка при работе с Google Sheets: {e}")

    print("Все листы обработаны.")

# main()
