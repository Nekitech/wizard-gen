import json
import os

CREDENTIALS_PATH = 'credentials.json'

def result_to_json(raw_string):
    cleaned_string = raw_string.strip('```json\n').strip('```')

    try:
        data = json.loads(cleaned_string)
        return data
    except json.JSONDecodeError as e:
        print(f"Ошибка декодирования JSON: {e}")
        return None

def load_file(path):
    with open(path, 'r', encoding='utf-8') as file:
        return json.load(file)

def load_credentials_from_env():
    cred = dict()
    cred["type"]=os.getenv("CREDENTIALS_TYPE")
    cred["project_id"]=os.getenv("CREDENTIALS_PROJECT_ID")
    cred["private_key_id"]=os.getenv("CREDENTIALS_PRIVATE_KEY_ID")
    cred["private_key"]=os.getenv("CREDENTIALS_PRIVATE_KEY")
    cred["client_email"]=os.getenv("CREDENTIALS_CLIENT_EMAIL")
    cred["client_id"]=os.getenv("CREDENTIALS_CLIENT_ID")
    cred["auth_uri"]= os.getenv("CREDENTIALS_AUTH_URI")
    cred["token_uri"]=os.getenv("CREDENTIALS_TOKEN_URI")
    cred["auth_provider_x509_cert_url"]=os.getenv("CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL")
    cred["client_x509_cert_url"]=os.getenv("CREDENTIALS_CLIENT_X509_CERT_URL")
    cred["universe_domain"]=os.getenv("CREDENTIALS_UNIVERSE_DOMAIN")
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