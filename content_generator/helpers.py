import json

def result_to_json(raw_string):
    cleaned_string = raw_string.strip('```json\n').strip('```')

    try:
        data = json.loads(cleaned_string)
        return data
    except json.JSONDecodeError as e:
        print(f"Ошибка декодирования JSON: {e}")
        return None