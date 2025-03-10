import os
import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
import time
from content_generator.helpers import load_credentials_from_env, result_to_json

from llm_module import send_to_gemini


load_dotenv('.env')


def dict_to_row(data_dict, headers):
    return [str(data_dict.get(header, '')) for header in headers]


def main():
    google_sheet_url = os.getenv("GOOGLE_SHEET_URL")
    google_api_key = os.getenv("GEMINIAPI")
    google_credentials = load_credentials_from_env()

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

    # Шаг 2: Сбор типов страниц и их описаний (второй лист)
    page_types_worksheet = spreadsheet.get_worksheet(1)  # Второй лист
    page_types_data = page_types_worksheet.get_all_records()
    page_types = {row['type']: row['description'] for row in page_types_data}
    print(f"Типы страниц собраны: {len(page_types)} типов.")

    all_slugs=[]
    comms_index = -1
    # Шаг 4: Обработка остальных листов
    tytle = os.getenv("TYTLE")
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title

        if(worksheet_title == "page_index"):
            continue

        if(worksheet_title == 'comments'):
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

        json_template = "{\"slugs\" : [\"Магическая битва Сезон 1\", \"Магическая битва Сезон 2\", \"Магическая битва 0. Фильм\", ...]}"
        template= f"""Сгенерируй массив всех страниц типа {worksheet_title} : {page_types.get(worksheet_title, '')}
        основываясь на известных тебе данных о тайтле {tytle} 
        Ответ на запрос верни в формате json. 
        Например: для тайтла Магическая Битва для страницы season с перечеслением сезонов json должен выглядеть так: {json_template}
        В json'e должен лежать только 1 ключ slugs по которому будет лежать массив значений (название страниц).
        Важно: если это страницы сезона, нужен список только сезонов и фильмов, если эта страница серий, нужен список всех серий всех сезонов + фильмы и т.д."""

        response_gemini = send_to_gemini(template, google_api_key)

        if response_gemini:
            col_index = 0
            for index in range(len(headers)):
                if headers[index] == "slug":
                    col_index = index
                    break
            response_gemini = result_to_json(response_gemini)
            print("Ответ:")
            print(response_gemini)
            try:
                data=response_gemini["slugs"]
                for index in range(len(data)):
                    all_slugs.append(data[index])
                    try:
                        worksheet.update_cell(index + 2, col_index + 1, data[index])
                    except Exception as e:
                        print(f"Ошибка при работе с Google Sheets: {e}")
            except Exception as e:
                print("Json не правильной структуры :/")

        else:
            print('error :(')
        time.sleep(10)
        print(f"Лист '{worksheet_title}' успешно обработан.")

    #Заполнение страницы комментариев
    worksheet = spreadsheet.get_worksheet(comms_index)
    col_index = 0
    headers = worksheet.row_values(1)
    for index in range(len(headers)):
        if headers[index] == "slug":
            col_index = index
            break
    data=all_slugs
    for index in range(len(data)):
        try:
            worksheet.update_cell(index + 2, col_index + 1, data[index])
        except Exception as e:
            print(f"Ошибка при работе с Google Sheets: {e}")

    print("Все листы обработаны.")

# main()