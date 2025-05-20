import os
import sys

from dotenv import load_dotenv

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.helpers import result_to_json, get_google_sheet, dict_to_row, read_template
from content_generator.llm_module import send_to_llm
from content_generator.constants import ListsNames

load_dotenv('.env')




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
            title = os.getenv("TITLE")
            coments_template_path = os.getenv("COMS_TEMPLATE_PATH")
            template = read_template(coments_template_path)
            try:
                template = template.format(
                    title=title,
                    semantic_core=semantic_core,
                    slug=slug,
                    json_format=json_template
                )
            except Exception as e:
                raise Exception(f"Wrong format of template, expected other params. {str(e)}")
            # template = f"""Сгенерируй 5 коментариев на основе семантического ядра и твоих знаний. 
            #     Тайтл: {title}
            #     Cемантическое ядро: {semantic_core}
            #     Для страницы: {slug}
            #     Нужно сгенерировать поля: text - текст коментария, name - имя пользователя (может быть как имя, так и ник или аноним)
            #     Ответ на запрос верни в формате json: {json_template}, без дополнительных пояснений и другого текста!"""

            # Отправка запроса в Gemini
            try:
                response_llm = send_to_llm(template)
            except Exception as e:
                print(f"Error: {e}")

            if response_llm:
                response_llm = result_to_json(response_llm)
                print("Ответ:")
                print(response_llm)
                row_data = dict_to_row(response_llm, headers)
                for col_index in range(len(headers)):
                    if row_data[col_index] and headers[col_index] != "slug":
                        try:
                            worksheet.update_cell(index + 2, col_index + 1, row_data[col_index])
                        except Exception as e:
                            print(f"Ошибка при работе с Google Sheets: {e}")

            else:
                print('Не удалось получить ответ от llm')


        print(f"Лист '{worksheet_title}' успешно обработан.")

    print("Все листы обработаны.")

# main()
