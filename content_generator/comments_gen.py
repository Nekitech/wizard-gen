import os
import sys
import time

from dotenv import load_dotenv

from content_generator.constants import ListsNames

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.helpers import result_to_json, get_google_sheet
from content_generator.llm_module import send_to_gemini

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

    # Шаг 2: Генерация коментов
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title
        if worksheet_title != ListsNames.COMMENTS.value:
            print(f"Лист '{worksheet_title}' - не коментарии")
            continue

        print(f"Обработка листа '{worksheet_title}'...")

        # Получаем данные со столбца slug
        data = worksheet.get_all_records()
        headers = worksheet.row_values(1)
        json_template = "{\"text\": [\"comment1\", \"comment2\", ...]\", \"name\": [\"name1\", \"name2\", ...]}"
        for index, row in enumerate(data):
            slug = row.get('slug', '')
            if not slug:
                print(f"Пропускаю строку {index + 1}: отсутствуют slug или keywords.")
                continue

            template = f"""Сгенерируй 5 коментариев на основе семантического ядра и твоих знаний. 
                Cемантическое ядро: {semantic_core}
                Для страницы: {slug}
                Нужно сгенерировать поля: text - текст коментария, name - имя пользователя (может быть как имя, так и ник или аноним)
                Ответ на запрос верни в формате json: {json_template}"""

            # Отправка запроса в Gemini
            response_gemini = send_to_gemini(template)

            if response_gemini:
                response_gemini = result_to_json(response_gemini)
                print("Ответ:")
                print(response_gemini)
                row_data = dict_to_row(response_gemini, headers)
                for col_index in range(len(headers)):
                    if row_data[col_index] and headers[col_index] != "slug":
                        try:
                            worksheet.update_cell(index + 2, col_index + 1, row_data[col_index])
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")

            else:
                print('error :(')
            time.sleep(10)

        print(f"Лист '{worksheet_title}' успешно обработан.")

    print("Все листы обработаны.")

# main()
