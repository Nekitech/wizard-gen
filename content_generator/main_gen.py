import os
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

import gspread
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
import time

from content_generator.helpers import load_credentials
from helpers import result_to_json
from llm_module import send_to_gemini


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

    # Шаг 2: Сбор типов страниц и их описаний (второй лист)
    page_types_worksheet = spreadsheet.get_worksheet(1)  # Второй лист
    page_types_data = page_types_worksheet.get_all_records()
    page_types = {row['type']: row['description'] for row in page_types_data}
    print(f"Типы страниц собраны: {len(page_types)} типов.")

    # Шаг 3: Сбор ключей и их описаний для каждого типа (третий лист)
    descriptions_worksheet = spreadsheet.get_worksheet(2)  # Третий лист
    descriptions_data = descriptions_worksheet.get_all_records()
    descriptions = {}
    for row in descriptions_data:
        page_type = row['type']
        key_name = row['columnName']
        key_description = row['columnDescription']
        if page_type not in descriptions:
            descriptions[page_type] = {}
        descriptions[page_type][key_name] = key_description
    print(f"Описания ключей собраны для {len(descriptions)} типов.")

    # Шаг 4: Обработка остальных листов
    for i in range(3, len(spreadsheet.worksheets())):  # Начинаем с четвёртого листа
        worksheet = spreadsheet.get_worksheet(i)
        worksheet_title = worksheet.title
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
        data = worksheet.get_all_records()
        headers = worksheet.row_values(1)
        for index, row in enumerate(data):
            slug = row.get('slug', '')
            keywords = row.get('keywords', '')
            if not slug or not keywords:
                print(f"Пропускаю строку {index + 1}: отсутствуют slug или keywords.")
                continue

            template = f"""Сгенерируй контент на основе ключевых слов, семантического ядра и твоих знаний о сериале. 
                Cемантическое ядро: {semantic_core}
                Описание страницы: {page_types.get(worksheet_title, '')}
                Для страницы: {slug}
                Ключевые слова: {keywords}
                Нужно сгенерировать поля: {descriptions.get(worksheet_title, {})}
                Ответ на запрос верни в формате json. """

            # print(f"Запрос для LLM (строка {index + 1}):\n{template}")

            # Отправка запроса в Gemini
            response_gemini = send_to_gemini(template, google_api_key)
            # response_gemini = {'releaseDate': '2015-10-05', 'rating': '16+', 'description': 'Сайтама – обычный парень, который, чтобы стать супергероем, тренировался три года. Теперь он настолько силен, что побеждает любого противника с одного удара. Однако, его абсолютная мощь сделала его жизнь скучной и неинтересной. В этом эпизоде Сайтама сталкивается с многочисленными злодеями, но ни один из них не представляет для него серьезной угрозы. Он пытается найти достойного соперника и смысл в своей героической деятельности. Встречает Геноса, киборга жаждущего мести.', 'duration': '24', 'h1': 'Ванпанчмен 1 сезон 1 серия: Сильнейший человек - Смотреть онлайн бесплатно', 'id': 'onepunchman-s1-e1', 'season': '1', 'videoUrl': 'https://example.com/onepunchman-s1-e1.mp4', 'slug': '/watch/onepunchman/season-1/episode-1', 'thumbnail': '/images/onepunchman/s1/ep1.jpg', 'title': 'Ванпанчмен 1 сезон 1 серия: Сильнейший человек смотреть онлайн бесплатно на русском', 'keywords': 'Ванпанчмен 1 сезон Сильнейший человек смотреть на русском, аниме смотреть онлайн бесплатно, one punch man', 'seiyuu': [{'name': 'Макото Фурукава', 'character': 'Сайтама'}, {'name': 'Кайто Исикава', 'character': 'Генос'}], 'studio': 'Madhouse'}
            if response_gemini:
                response_gemini = result_to_json(response_gemini)
                # print("Ответ:")
                # print(response_gemini)
                row_data = dict_to_row(response_gemini, headers)
                for col_index in range(len(headers)):
                    if row_data[col_index] and headers[col_index] != "slug":
                        try:
                            worksheet.update_cell(index + 2, col_index + 1, row_data[col_index])
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")
                #     pass
            else:
                print('error :(')
            time.sleep(15)
            # return response_gemini

            # TODO: Обработка ответа LLM и формирование словаря result
            # result = process_llm_response(response)  # Ваша функция обработки ответа

            # Обновление строки в таблице
            # worksheet.update_cell(index + 2, column_index, value)  # column_index и value зависят от result

        print(f"Лист '{worksheet_title}' успешно обработан.")

    print("Все листы обработаны.")