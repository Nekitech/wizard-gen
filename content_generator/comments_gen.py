import os
import sys

import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
import time

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.helpers import result_to_json, load_credentials
from content_generator.llm_module import send_to_gemini

load_dotenv('.env')


def dict_to_row(data_dict, headers):
    return [str(data_dict.get(header, '')) for header in headers]



def main():
    google_sheet_url = os.getenv("GOOGLE_SHEET_URL")
    google_api_key = os.getenv("GEMINIAPI")
    google_credentials = load_credentials()

    if not google_sheet_url:
        raise ValueError("URL Google Sheets не найден в .env файле")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]

    credentials = Credentials.from_service_account_info(
        info=google_credentials, scopes=scopes
    )
    gc = gspread.authorize(credentials)

    try:
        spreadsheet_id = google_sheet_url.split('/')[-1]  # Извлечение ID из URL
        spreadsheet = gc.open_by_key(spreadsheet_id)
    except Exception as e:
        print(f"Ошибка при доступе к Google Sheets: {e}")
        exit(1)

    # Шаг 1: Сбор семантического ядра (первый лист)
    semantic_core_worksheet = spreadsheet.get_worksheet(0)  # Первый лист
    semantic_core_data = semantic_core_worksheet.col_values(1)  # Первая колонка
    semantic_core = [item.strip() for item in semantic_core_data if item.strip()]
    semantic_core = semantic_core[1:]
    print(f"Семантическое ядро собрано: {len(semantic_core)} элементов.")

    # Шаг 2: Генерация коментов
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title
        if worksheet_title != "comments":
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
            response_gemini = send_to_gemini(template, google_api_key)
            
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