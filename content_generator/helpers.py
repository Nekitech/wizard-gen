import json
import os

import gspread
from google.oauth2.service_account import Credentials

from content_generator.constants import scopes

CREDENTIALS_PATH = 'credentials.json'


def result_to_json(raw_string):

    cleaned_string = raw_string.strip('```json\n').strip('```')

    try:
        data = json.loads(cleaned_string)
        return data
    except json.JSONDecodeError as e:
        print(f"Ошибка декодирования JSON: {e}")
        return None

'''
'{\n  "description": "Добро пожаловать на главную страницу сайта, посвященного популярному южнокорейскому сериалу «Игра в кальмара». Здесь вы найдете всю необходимую информацию о первом и втором сезонах, включая даты выхода серий, описание сюжета, актерский состав, интересные факты и многое другое. Не упустите шанс узнать больше об этом захватывающем триллере!",\n  "h1": "«Игра в кальмара» — все, что нужно знать о сериале",\n  "title": "«Игра в кальмара» — все сезоны и серии",\n  "text": "Приветствуем вас на нашем сайте, полностью посвященном одному из самых популярных сериалов последних лет — «Игре в кальмара». В наших материалах мы собрали для вас подробную информацию о всех аспектах этого захватывающего шоу. Вы узнаете о сюжете каждого эпизода, познакомитесь с актерами и их ролями, а также сможете погрузиться в мир фанатов сериала, изучая фан-теории и читая отзывы других зрителей. Мы постарались собрать для вас все самое интересное, чтобы ваше знакомство с этим миром было максимально полным и увлекательным. Заходите чаще, ведь здесь всегда есть что-то новое!",\n  "url": "/"\n}'
'''

def load_file(path):
    with open(path, 'r', encoding='utf-8') as file:
        return json.load(file)


def load_credentials_from_env():
    cred = dict()
    cred["type"] = os.getenv("CREDENTIALS_TYPE")
    cred["project_id"] = os.getenv("CREDENTIALS_PROJECT_ID")
    cred["private_key_id"] = os.getenv("CREDENTIALS_PRIVATE_KEY_ID")
    cred["private_key"] = os.getenv("CREDENTIALS_PRIVATE_KEY")
    cred["client_email"] = os.getenv("CREDENTIALS_CLIENT_EMAIL")
    cred["client_id"] = os.getenv("CREDENTIALS_CLIENT_ID")
    cred["auth_uri"] = os.getenv("CREDENTIALS_AUTH_URI")
    cred["token_uri"] = os.getenv("CREDENTIALS_TOKEN_URI")
    cred["auth_provider_x509_cert_url"] = os.getenv("CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL")
    cred["client_x509_cert_url"] = os.getenv("CREDENTIALS_CLIENT_X509_CERT_URL")
    cred["universe_domain"] = os.getenv("CREDENTIALS_UNIVERSE_DOMAIN")
    return cred


def load_credentials_from_json():
    return load_file(CREDENTIALS_PATH)


def load_credentials():
    if os.path.exists(CREDENTIALS_PATH):
        print("Файл credentials.json найден. Используем его для получения данных.")
        return load_credentials_from_json()
    else:
        print("Файл credentials.json не найден. Используем данные из .env.")
        return load_credentials_from_env()


def get_google_sheet() -> gspread.Spreadsheet:
    """
    Получает объект Google Sheets по ID таблицы.

    :return: Объект gspread.Spreadsheet.
    :raises ValueError: Если spreadsheet_id не указан и не найден в переменных окружения.
    :raises Exception: Если произошла ошибка при доступе к Google Sheets.
    """
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_TABLE_ID")
    google_credentials = load_credentials()

    if not spreadsheet_id:
        raise ValueError("table id не найден в .env файле")

    credentials = Credentials.from_service_account_info(
        info=google_credentials, scopes=scopes
    )
    gc = gspread.authorize(credentials)

    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        return spreadsheet
    except Exception as e:
        print(f"Ошибка при доступе к Google Sheets: {e}")
        exit(1)

def dict_to_row(data_dict, headers):
    return [str(data_dict.get(header, '')) for header in headers]

def read_template(abs_path: str) -> str:
    try:
        with open(abs_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except FileNotFoundError:
        raise ValueError(f"Template file not found: {abs_path}")
    except Exception as e:
        raise ValueError(f"Error reading template: {str(e)}")